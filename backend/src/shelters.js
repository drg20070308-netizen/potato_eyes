// Place search is a discovery aid, not an authoritative civil-defence registry.
export function createShelterService({ env, fetcher = fetch }) {
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
    if (!env.KAKAO_REST_API_KEY) return { code: 503, body: { error: 'NOT_CONFIGURED' } };
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.set('query', `${hasCoordinates ? '' : region + ' '}민방위대피소`);
    url.searchParams.set('size', '15');
    if (hasCoordinates) for (const [key, value] of Object.entries({ x: lng, y: lat, radius, sort: 'distance' })) url.searchParams.set(key, String(value));
    try {
      const response = await fetcher(url, { headers: { Authorization: `KakaoAK ${env.KAKAO_REST_API_KEY}` }, signal: AbortSignal.timeout(10000) });
      if (!response.ok) {
        let error = response.status === 429 ? 'PROVIDER_LIMIT' : [401, 403].includes(response.status) ? 'PROVIDER_UNAUTHORIZED' : 'PROVIDER_ERROR';
        if (response.status === 403) {
          const failure = await response.json().catch(() => ({}));
          if (typeof failure.message === 'string' && failure.message.includes('disabled OPEN_MAP_AND_LOCAL')) error = 'PROVIDER_DISABLED';
        }
        return { code: 503, body: { error } };
      }
      const data = await response.json();
      if (!Array.isArray(data.documents) || !data.meta) throw new Error('INVALID_RESPONSE');
      const shelters = data.documents.filter(d => d.x && d.y && Number.isFinite(Number(d.x)) && Number.isFinite(Number(d.y))).map(d => ({
        id: d.id, name: d.place_name, address: d.road_address_name || d.address_name,
        lat: Number(d.y), lng: Number(d.x), phone: d.phone || null,
        distance: hasCoordinates && d.distance !== '' && Number.isFinite(Number(d.distance)) ? Number(d.distance) : null,
      }));
      return { code: 200, body: { shelters, hasMore: !data.meta.is_end, source: '카카오맵 장소 검색', checkedAt: new Date().toISOString() } };
    } catch { return { code: 503, body: { error: 'PROVIDER_UNAVAILABLE' } }; }
  };
}
