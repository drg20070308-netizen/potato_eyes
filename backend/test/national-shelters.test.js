import test from 'node:test';
import assert from 'node:assert/strict';
import { officialRecords, nationalDataset, createOfficialSearch } from '../src/official-shelters.js';
import { createShelterService } from '../src/shelters.js';
test('nationwide source covers 17 provincial labels and preserves quality counts',()=>{
 assert.equal(officialRecords.length,17239);assert.equal(nationalDataset.regionCount,17);assert.equal(nationalDataset.quality.excluded,1604);assert.equal(nationalDataset.quality.coordinateMissing,8);
});
test('Seoul, Busan and Jeju regional results stay inside requested district',async()=>{
 const search=createOfficialSearch({env:{},fetcher:async()=>{throw Error('No network');}});
 for(const region of ['서울 종로구','부산 사하구 하단동','제주 제주시']) {
  const r=await search(new URLSearchParams({region}));assert.equal(r.code,200);assert.ok(r.body.shelters.length>0,region);assert.equal(r.body.datasetCount,17239);
  if(region.includes('종로구'))assert.ok(r.body.shelters.every(i=>i.address.includes('종로구')));
 }
});
test('nearby scans nationwide inventory, respects radius and sorts distances',async()=>{
 const search=createOfficialSearch({env:{},fetcher:async()=>{throw Error('No network');}});
 for(const [lat,lng] of [[37.5665,126.978],[33.4996,126.5312],[35.11,128.96]]) {
  const r=await search(new URLSearchParams({lat:String(lat),lng:String(lng),radius:'3000'}));assert.ok(r.body.shelters.length>0);assert.ok(r.body.shelters.every(i=>i.distance<=3000));assert.ok(r.body.shelters.every((i,n,a)=>!n||a[n-1].distance<=i.distance));
 }
});
test('public regional API no longer requires Kakao key for official listings',async()=>{
 const r=await createShelterService({env:{}})(new URLSearchParams('region=서울 종로구'));assert.equal(r.code,200);assert.ok(r.body.shelters.length>0);
});
