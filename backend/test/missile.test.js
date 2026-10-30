import test from 'node:test';
import assert from 'node:assert/strict';
import { detectMissileReport } from '../src/missile.js';
const now = Date.parse('2026-10-30T12:00:00Z');
const article = { id: '1', title: '북한 미사일 발사', description: '미사일이 동해 공해상에 낙하했다.', publishedAt: new Date(now - 60000).toISOString(), source: '예시', originalUrl: 'https://example.com' };
test('report quotes location and preserves uncertainty', () => {
  assert.match(detectMissileReport(article, now).line, /동해 공해상/);
  assert.equal(detectMissileReport({ ...article, description: '동해에 낙하한 것으로 추정된다.' }, now).uncertain, true);
  assert.match(detectMissileReport({ ...article, description: '발사 소식이다.' }, now).line, /미확인/);
});
test('old, future, simulated and unrelated news are excluded', () => {
  assert.equal(detectMissileReport({ ...article, publishedAt: new Date(now - 7 * 3600000).toISOString() }, now), null);
  assert.equal(detectMissileReport({ ...article, description: '모형 표적에 대한 가상 시연' }, now), null);
  assert.equal(detectMissileReport({ ...article, title: '우주 발사', description: '위성 소식' }, now), null);
});
