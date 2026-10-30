import { readFileSync } from 'node:fs';
import { matchesRegion } from './shelter-region.js';
export const officialRecords = JSON.parse(readFileSync(new URL('../fixtures/busan-official-shelters.json', import.meta.url), 'utf8'));
export function distanceMeters(lat, lng, otherLat, otherLng) {
  const rad = x => x * Math.PI / 180, dLat = rad(otherLat-lat), dLng = rad(otherLng-lng);
  const a = Math.sin(dLat/2)**2 + Math.cos(rad(lat))*Math.cos(rad(otherLat))*Math.sin(dLng/2)**2;
  return Math.round(6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}
export function matchesOfficialRegion(region, item) {
  const legalDong = item.dong.replace(/\d+동$/, '동');
  return matchesRegion(region, [`${item.region} ${item.dong} ${legalDong}`]);
}
export function createOfficialSearch({ env, fetcher = fetch, records = officialRecords }) {
  const enriched = new Map(), pending = new Map();
  async function kakao(path, query) {
    const url = new URL(`https://dapi.kakao.com/v2/local/${path}.json`); url.searchParams.set('query',query);
    const response = await fetcher(url,{headers:{Authorization:`KakaoAK ${env.KAKAO_REST_API_KEY.trim()}`},signal:AbortSignal.timeout(15000)});
    if(!response.ok) throw Error('GEOCODING_FAILED');
    const data=await response.json(); if(!Array.isArray(data.documents)) throw Error('GEOCODING_FAILED'); return data.documents;
  }
  async function hydrate(item) {
    if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) return item;
    if(enriched.has(item.id)) return enriched.get(item.id);
    if(pending.has(item.id)) return pending.get(item.id);
    const task=(async()=>{
      try {
        const query=item.address.replace(/\([^)]*\)/g,'').replace(/지하\s*/g,'').trim();
        const docs=await kakao('search/address',query);
        const doc=docs.find(d=>matchesRegion(item.region,[d.address_name]) && Number.isFinite(Number(d.x)) && Number.isFinite(Number(d.y)));
        if(doc) { const result={...item,lat:Number(doc.y),lng:Number(doc.x)}; enriched.set(item.id,result); return result; }
      } catch { /* Regional lists remain available even if coordinate lookup fails. */ }
      return item;
    })().finally(()=>pending.delete(item.id)); pending.set(item.id,task); return task;
  }
  async function hydrateAll(items) {
    const results=[]; let index=0;
    await Promise.all(Array.from({length:Math.min(5,items.length)},async()=>{while(index<items.length){const at=index++; results[at]=await hydrate(items[at]);}})); return results;
  }
  return async function search(params) {
    const region=(params.get('region')||'').trim();
    const nearby=params.has('lat') || params.get('mode')==='nearby';
    const radius=Number(params.get('radius')||3000);
    let lat=Number(params.get('lat')),lng=Number(params.get('lng'));
    if(![1000,3000,5000,10000,20000].includes(radius)) return {code:400,body:{error:'INVALID_QUERY'}};
    if(params.get('mode')==='nearby' && !params.has('lat')) {
      if(!region || region.length>80) return {code:400,body:{error:'INVALID_QUERY'}};
      const docs=await kakao('search/address',region);
      const areas=docs.filter(d=>matchesRegion(region,[d.address_name]));
      let center=areas[0];
      if(areas.length>1 && new Set(areas.map(d=>d.address?.region_2depth_name)).size>1) return {code:400,body:{error:'AMBIGUOUS_REGION'}};
      if(!center) { const places=await kakao('search/keyword',`${region} 행정복지센터`); center=places.find(d=>matchesRegion(region,[d.address_name, d.place_name])); }
      if(!center) return {code:400,body:{error:'REGION_NOT_FOUND'}};
      lat=Number(center.y);lng=Number(center.x); params.set('lat',String(lat));params.set('lng',String(lng));
    }
    if(nearby && (!Number.isFinite(lat)||!Number.isFinite(lng)||lat<33||lat>39||lng<124||lng>132)) return {code:400,body:{error:'INVALID_QUERY'}};
    // The bundled authoritative coverage is explicitly limited to two districts.
    if(nearby && (lat<34.8||lat>35.5||lng<128.5||lng>129.4)) return null;
    const candidates=nearby?records:records.filter(item=>matchesOfficialRegion(region,item));
    if(!candidates.length) return null;
    const hydrated=await hydrateAll(candidates);
    const located=hydrated.filter(item=>Number.isFinite(item.lat)&&Number.isFinite(item.lng));
    const shelters=(nearby?located.map(item=>({...item,distance:distanceMeters(lat,lng,item.lat,item.lng)})).filter(item=>item.distance<=radius).sort((a,b)=>a.distance-b.distance):hydrated.map(item=>({...item,distance:null})));
    return {code:200,body:{shelters,hasMore:false,source:'사하구청·사상구청 공식 민방위 대피시설 목록',checkedAt:new Date().toISOString(),dataCheckedAt:'2026-10-30',coverage:'공식 목록 수록 범위: 부산 사하구·사상구. 전국 전수 자료는 아닙니다.',coordinateMissing:hydrated.length-located.length,mode:nearby?'nearby':'region',center:nearby?{lat,lng,label:region||'내 위치',radius}:null}};
  };
}
