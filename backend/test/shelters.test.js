import test from 'node:test';
import assert from 'node:assert/strict';
import { createShelterService } from '../src/shelters.js';
const params = value => new URLSearchParams(value);
test('requires valid region or Korean coordinates before calling provider', async () => {
  let called = false;
  const search = createShelterService({ env: { KAKAO_REST_API_KEY: 'secret' }, fetcher: async () => { called = true; } });
  for (const query of ['', 'lat=37', 'lat=&lng=127', 'lat=91&lng=127', 'region=서울&radius=99']) assert.equal((await search(params(query))).code, 400);
  assert.equal(called, false);
});
test('missing key returns actionable configuration status', async () => {
  const result = await createShelterService({ env: {} })(params('region=서울'));
  assert.equal(result.code, 503); assert.equal(result.body.error, 'NOT_CONFIGURED');
});
test('nearby query applies provider radius, distance order, normalizes and omits secrets', async () => {
  const search = createShelterService({ env: { KAKAO_REST_API_KEY: 'secret' }, fetcher: async (url, options) => {
    assert.equal(url.hostname, 'dapi.kakao.com'); assert.equal(url.searchParams.get('sort'), 'distance');
    assert.equal(url.searchParams.get('radius'), '3000'); assert.equal(url.searchParams.get('x'), '127');
    assert.equal(options.headers.Authorization, 'KakaoAK secret');
    return { ok: true, json: async () => ({ meta: { is_end: false }, documents: [{ id: '1', place_name: '민방위대피소', x: '127', y: '37', distance: '120', address_name: '서울', phone: '' }] }) };
  } });
  const result = await search(params('lat=37&lng=127'));
  assert.equal(result.code, 200); assert.equal(result.body.shelters[0].distance, 120);
  assert.equal(result.body.hasMore, true); assert.equal(JSON.stringify(result).includes('secret'), false);
});
test('regional results do not invent distances', async () => {
  const search = createShelterService({ env: { KAKAO_REST_API_KEY: 'secret' }, fetcher: async url => {
    assert.ok(['서울 민방위대피소', '서울 대피소'].includes(url.searchParams.get('query'))); assert.equal(url.searchParams.has('x'), false);
    return { ok: true, json: async () => ({ meta: { is_end: true }, documents: [{ id: '1', x: '127', y: '37', distance: '', address_name: '서울 강남구 역삼동' }] }) };
  } });
  assert.equal((await search(params('region=서울'))).body.shelters[0].distance, null);
});
test('provider limits, malformed responses and network failures do not expose provider payloads', async () => {
  for (const fetcher of [async () => ({ ok: false, status: 429 }), async () => ({ ok: true, json: async () => ({}) }), async () => { throw new Error('secret'); }]) {
    const result = await createShelterService({ env: { KAKAO_REST_API_KEY: 'secret' }, fetcher })(params('region=서울'));
    assert.equal(result.code, 503); assert.equal(JSON.stringify(result).includes('secret'), false);
  }
});

test('disabled Kakao map service is distinguishable from invalid credentials', async () => {
  const search = createShelterService({ env: { KAKAO_REST_API_KEY: 'secret' }, fetcher: async () => ({ ok: false, status: 403, json: async () => ({ message: 'App(example) disabled OPEN_MAP_AND_LOCAL service.' }) }) });
  assert.equal((await search(params('region=서울'))).body.error, 'PROVIDER_DISABLED');
  const denied = createShelterService({ env: { KAKAO_REST_API_KEY: 'secret' }, fetcher: async () => ({ ok: false, status: 401 }) });
  assert.equal((await denied(params('region=서울'))).body.error, 'PROVIDER_UNAUTHORIZED');
});


import { matchesRegion } from '../src/shelter-region.js';
test('district names match whole address tokens, not neighboring districts', () => {
  assert.equal(matchesRegion('사상구', ['부산 사상구 덕포동 12']), true);
  assert.equal(matchesRegion('사상구', ['부산 중구 영주동 51']), false);
  assert.equal(matchesRegion('부산광역시 사상구', ['부산 사상구 덕포동']), true);
  assert.equal(matchesRegion('덕포동', ['부산 사상구 덕포1동']), false);
});
test('dong search broadens provider query but filters by land-lot dong', async () => {
  const search = createShelterService({ env: { KAKAO_REST_API_KEY: 'test' }, fetcher: async url => {
    const documents = url.pathname.includes('/address.json') ? [{ address_name: '부산 사상구 덕포동', address: { region_1depth_name: '부산', region_2depth_name: '사상구', region_3depth_name: '덕포동' } }] : [
      { id: '1', x: '129', y: '35', address_name: '부산 사상구 덕포동 1', road_address_name: '부산 사상구 사상로 2' },
      { id: '2', x: '129', y: '35', address_name: '부산 사상구 모라동 2' },
      { id: '3', x: '129', y: '35', address_name: '부산 북구 구포동 3' },
    ];
    return { ok: true, json: async () => ({ documents, meta: { is_end: true } }) };
  } });
  const result = await search(params('region=부산 사상구 덕포동'));
  assert.equal(result.code, 200); assert.deepEqual(result.body.shelters.map(s => s.id), ['1']);
});
test('administrative dong reverse lookup excludes facilities in another dong', async () => {
  const search = createShelterService({ env: { KAKAO_REST_API_KEY: 'test' }, fetcher: async url => {
    let documents;
    if (url.pathname.includes('address.json')) documents = [];
    else if (url.pathname.includes('coord2regioncode')) documents = [{ address_name: url.searchParams.get('x') === '129' ? '부산 사상구 덕포1동' : '부산 사상구 덕포2동' }];
    else documents = [{ id: '1', x: '129', y: '35', address_name: '부산 사상구 덕포동' }, { id: '2', x: '129.1', y: '35', address_name: '부산 사상구 덕포동' }];
    return { ok: true, json: async () => ({ documents, meta: { is_end: true } }) };
  } });
  assert.deepEqual((await search(params('region=부산 사상구 덕포1동'))).body.shelters.map(s => s.id), ['1']);
});

test('alternate shelter keyword recovers dong results and never admits another district', async () => {
  const queries = [];
  const search = createShelterService({ env: { KAKAO_REST_API_KEY: 'test' }, fetcher: async url => {
    let documents = [];
    if (url.pathname.includes('address.json')) documents = [{ address_name: '부산 사상구 덕포동', address: { region_1depth_name: '부산', region_2depth_name: '사상구', region_3depth_name: '덕포동' } }];
    else { const query = url.searchParams.get('query'); queries.push(query); if (query === '부산 사상구 대피소') documents = [{ id: 'target', x: '129', y: '35', address_name: '부산 사상구 덕포동 12' }, { id: 'wrong', x: '129', y: '35', address_name: '부산 북구 덕천동 12' }]; }
    return { ok: true, json: async () => ({ documents, meta: { is_end: true } }) };
  } });
  const result = await search(params('region=부산 사상구 덕포동'));
  assert.equal(result.code, 200);
  assert.deepEqual(result.body.shelters.map(s => s.id), ['target']);
  assert.ok(queries.includes('부산 사상구 대피소'));
});