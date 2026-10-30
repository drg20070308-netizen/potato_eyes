import test from 'node:test';
import assert from 'node:assert/strict';
import { createOfficialSearch, officialRecords, matchesOfficialRegion, distanceMeters } from '../src/official-shelters.js';
const env={KAKAO_REST_API_KEY:'test'};
test('official municipal snapshot includes Hadan and Deokpo facilities',()=>{
 assert.equal(officialRecords.length,173);
 assert.equal(officialRecords.filter(i=>matchesOfficialRegion('하단동',i)).length,9);
 assert.equal(officialRecords.filter(i=>matchesOfficialRegion('부산 사상구 덕포동',i)).length,13);
 assert.ok(officialRecords.filter(i=>matchesOfficialRegion('사상구',i)).every(i=>i.region==='부산 사상구'));
});
test('regional listing survives missing geocodes and never hides official Hadan entries',async()=>{
 const search=createOfficialSearch({env,fetcher:async()=>({ok:true,json:async()=>({documents:[]})})});
 const r=await search(new URLSearchParams('region=하단동'));
 assert.equal(r.body.shelters.length,9);assert.equal(r.body.coordinateMissing,9);
 assert.ok(r.body.shelters.some(i=>i.name==='하단역'));
});
test('nearby calculates distance from actual coordinates and excludes outside radius',async()=>{
 const records=[{id:'a',name:'a',region:'부산 사하구',dong:'하단1동',lat:35.1,lng:128.96},{id:'b',name:'b',region:'부산 사상구',dong:'모라동',lat:35.3,lng:129.2}];
 const search=createOfficialSearch({env,records});const r=await search(new URLSearchParams('lat=35.1&lng=128.96&radius=1000'));
 assert.deepEqual(r.body.shelters.map(i=>i.id),['a']);assert.equal(r.body.shelters[0].distance,0);assert.ok(distanceMeters(35.1,128.96,35.3,129.2)>20000);
});
test('region-centered radius search geocodes the requested region then applies radius',async()=>{
 const records=[{id:'a',name:'a',region:'부산 사하구',dong:'하단1동',lat:35.1,lng:128.96}];
 const search=createOfficialSearch({env,records,fetcher:async()=>({ok:true,json:async()=>({documents:[{address_name:'부산 사하구 하단동',x:'128.96',y:'35.1'}]})})});
 const r=await search(new URLSearchParams('region=하단동&mode=nearby&radius=20000'));assert.equal(r.body.center.radius,20000);assert.equal(r.body.shelters.length,1);
});
