import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalize, collect, summarize, clean } from '../src/news.js';
import { createNewsService } from '../src/service.js';
const item = { title: '<b>북한</b> &quot;소식&quot;', description: '관련 보도입니다.', originallink: 'https://www.yna.co.kr/view/123', pubDate: 'Fri, 30 Oct 2026 10:00:00 +0900' };
const env = { NAVER_CLIENT_ID: 'test', NAVER_CLIENT_SECRET: 'test', OPENAI_API_KEY: 'test' };
const ai = { status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ lines: ['북한 관련 소식이 보도됐다.', '추가 내용은 원문에서 확인할 수 있다.'] }) }] }] };
test('normalize strips markup, preserves source and rejects unsafe links', () => {
  const result = normalize(item);
  assert.equal(result.title, '북한 "소식"'); assert.equal(result.source, '연합뉴스');
  assert.equal(normalize({ ...item, originallink: 'javascript:alert(1)' }), null);
  assert.equal(normalize({ ...item, pubDate: 'invalid' }), null);
  assert.equal(clean('&#x110000;'), '');
});
test('collect uses newest order, credentials and deduplicates', async () => {
  const result = await collect(env, async (url, options) => {
    assert.equal(url.origin, 'https://naverapihub.apigw.ntruss.com'); assert.equal(url.pathname, '/search/v1/news'); assert.equal(url.searchParams.get('format'), 'json'); assert.equal(options.headers['X-NCP-APIGW-API-KEY'], 'test'); assert.equal(url.searchParams.get('sort'), 'date'); assert.equal(options.headers['X-NCP-APIGW-API-KEY-ID'], 'test');
    return { ok: true, json: async () => ({ items: [item, item] }) };
  }); assert.equal(result.length, 1);
});
test('summary validates refusal, incomplete and invalid line counts', async () => {
  const mock = data => async () => ({ ok: true, json: async () => data });
  assert.equal((await summarize(normalize(item), env, mock(ai))).length, 2);
  await assert.rejects(summarize(normalize(item), env, mock({ status: 'incomplete' })));
  await assert.rejects(summarize(normalize(item), env, mock({ status: 'completed', output: [] })));
  await assert.rejects(collect(env, async () => ({ ok: false, status: 429 })));
});
test('service persists summaries, coalesces refresh and reuses on restart', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bukhan-test-'));
  let calls = 0;
  const fetcher = async url => ({ ok: true, json: async () => String(url).includes('naverapihub.apigw.ntruss.com') ? { items: [item] } : (++calls, ai) });
  const file = pathToFileURL(join(dir, 'news.json'));
  try {
    const first = createNewsService({ env, file, fetcher });
    await Promise.all([first.refresh(), first.refresh()]);
    assert.equal(first.read().articles.length, 1); assert.equal(calls, 1);
    assert.equal(first.read().articles[0].fingerprint, undefined);
    const second = createNewsService({ env, file, fetcher }); await second.load(); await second.refresh();
    assert.equal(calls, 1); assert.equal(second.read().status, 'ready');
    const failed = createNewsService({ env, file, fetcher: async () => { throw Error('offline'); } });
    await failed.load(); await failed.refresh(); assert.equal(failed.read().articles.length, 1); assert.equal(failed.read().stale, true);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('missing credentials gives explicit unconfigured state', () => {
  assert.equal(createNewsService({ env: {}, file: new URL('file:///unused') }).read().status, 'not_configured');
});
