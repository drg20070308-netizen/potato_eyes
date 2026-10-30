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
    assert.equal(url.searchParams.get('query'), '서울 민방위대피소'); assert.equal(url.searchParams.has('x'), false);
    return { ok: true, json: async () => ({ meta: { is_end: true }, documents: [{ id: '1', x: '127', y: '37', distance: '' }] }) };
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
