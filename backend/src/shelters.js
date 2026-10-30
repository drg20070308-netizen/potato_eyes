import { matchesRegion, regionTokens } from './shelter-region.js';
// Place search is a discovery aid, not an authoritative civil-defence registry.
export function createShelterService({ env, fetcher = fetch }) {
  const apiKey = env.KAKAO_REST_API_KEY?.trim();
  return async function search(params) {
    const region = (params.get('region') || '').trim();
    const hasCoordinates = params.has('lat') || params.has('lng');
    const lat = Number(params.get('lat')), lng = Number(params.get('lng'));
    const radius = Number(params.get('radius') || 3000);
    if (region.length > 80 || (!region && !hasCoordinates) ||
        (hasCoordinates && (!params.get('lat') || !params.get('lng') || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < 33 || lat > 39 || lng < 124 || lng > 132)) ||
        ![1000, 3000, 5000, 10000, 20000].includes(radius)) {
      return { code: 400, body: { error: 'INVALID_QUERY' } };
    }
    if (!apiKey) return { code: 503, body: { error: 'NOT_CONFIGURED' } };
    try {
      async function request(url) {
        const response = await fetcher(url, { headers: { Authorization: `KakaoAK ${apiKey}` }, signal: AbortSignal.timeout(10000) });
        if (!response.ok) {
          let code = response.status === 429 ? 'PROVIDER_LIMIT' : [401, 403].includes(response.status) ? 'PROVIDER_UNAUTHORIZED' : 'PROVIDER_ERROR';
          if (response.status === 403) { const body = await response.json().catch(() => ({})); if (body.message?.includes('disabled OPEN_MAP_AND_LOCAL')) code = 'PROVIDER_DISABLED'; }
          const error = new Error(code); error.publicCode = code; throw error;
        }
        const data = await response.json();
        if (!Array.isArray(data.documents) || !data.meta) throw Error('INVALID_RESPONSE');
        return data;
      }
      let searchRegion = region, targetRegion = region;
      const isDong = /(?:동|읍|면|리)$/.test(region);
      // Resolve a dong to its full address so a broad keyword fallback stays in the requested district.
      if (!hasCoordinates && isDong) {
        const addressUrl = new URL('https://dapi.kakao.com/v2/local/search/address.json'); addressUrl.searchParams.set('query', region);
        const resolved = await request(addressUrl);
        const candidates = resolved.documents.filter(d => matchesRegion(region, [d.address_name, [d.address?.region_1depth_name, d.address?.region_2depth_name, d.address?.region_3depth_name, d.address?.region_3depth_h_name].filter(Boolean).join(' ')]));
        const areas = [...new Set(candidates.map(d => d.address?.region_1depth_name && d.address?.region_2depth_name ? `${d.address.region_1depth_name} ${d.address.region_2depth_name}` : null).filter(Boolean))];
        if (areas.length > 1) return { code: 400, body: { error: 'AMBIGUOUS_REGION' } };
        if (areas.length === 1) searchRegion = areas[0];
        else searchRegion = regionTokens(region).slice(0, -1).join(' ') || region;
      }
      const documents = new Map(); let hasMore = false;
      const queries = hasCoordinates ? ['민방위대피소'] : [...new Set([`${region} 민방위대피소`, `${region} 대피소`, ...(isDong ? [`${searchRegion} 민방위대피소`, `${searchRegion} 대피소`] : [])])];
      for (const query of queries) {
        for (let page = 1; page <= (hasCoordinates ? 1 : 3); page++) {
          const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
          url.searchParams.set('query', query); url.searchParams.set('size', '15'); url.searchParams.set('page', String(page));
          if (hasCoordinates) for (const [key, value] of Object.entries({ x: lng, y: lat, radius, sort: 'distance' })) url.searchParams.set(key, String(value));
          const data = await request(url);
          for (const doc of data.documents) documents.set(doc.id, doc);
          hasMore ||= !data.meta.is_end;
          if (data.meta.is_end) break;
        }
      }
      const filtered = [];
      for (const doc of documents.values()) {
        if (hasCoordinates || matchesRegion(targetRegion, [doc.address_name, doc.road_address_name])) { filtered.push(doc); continue; }
        // Administrative dong names (e.g. 덕포1동) differ from land-lot legal dong names.
        if (isDong && /\d동$/.test(region) && Number.isFinite(Number(doc.x)) && Number.isFinite(Number(doc.y))) {
          const reverse = new URL('https://dapi.kakao.com/v2/local/geo/coord2regioncode.json'); reverse.searchParams.set('x', doc.x); reverse.searchParams.set('y', doc.y);
          const area = await request(reverse);
          if (area.documents.some(d => matchesRegion(targetRegion, [d.address_name]))) filtered.push(doc);
        }
      }
      const data = { documents: filtered, meta: { is_end: !hasMore } };
      const shelters = data.documents.filter(d => d.x && d.y && Number.isFinite(Number(d.x)) && Number.isFinite(Number(d.y))).map(d => ({
        id: d.id, name: d.place_name, address: d.road_address_name || d.address_name,
        lat: Number(d.y), lng: Number(d.x), phone: d.phone || null,
        distance: hasCoordinates && d.distance !== '' && Number.isFinite(Number(d.distance)) ? Number(d.distance) : null,
      }));
      return { code: 200, body: { shelters, hasMore: !data.meta.is_end, source: '카카오맵 장소 검색', checkedAt: new Date().toISOString() } };
    } catch (error) { return { code: 503, body: { error: error.publicCode || 'PROVIDER_UNAVAILABLE' } }; }
  };
}
