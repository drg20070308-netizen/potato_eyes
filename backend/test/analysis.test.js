import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { generateAnalysis, createAnalysisService } from '../src/analysis.js';
const env = { GEMINI_API_KEY: 'test', NAVER_CLIENT_ID: 'test', NAVER_CLIENT_SECRET: 'test' };
const article = { id: 'one', title: '김정은 관련 보도', description: '외교 활동 보도' };
const report = { headline: '행동의 배경', observation: '보도에 따른 행동이다.', motives: '가능한 설명이다.', worldContext: '자료 범위가 제한적이다.', uncertainty: '다른 설명도 가능하다.', sourceIds: ['one'], researchIds: ['levy1992'] };
const response = result => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(result) }] } }] }) });
test('analysis only accepts provided article and research references', async () => {
  assert.equal((await generateAnalysis([article], env, async () => response(report))).sources[0].id, 'one');
  await assert.rejects(generateAnalysis([article], env, async () => response({ ...report, sourceIds: ['fabricated'] })));
  await assert.rejects(generateAnalysis([article], env, async () => response({ ...report, researchIds: ['fabricated'] })));
});
test('daily cache persists on first deployment, survives restart and refreshes after 24 hours', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'analysis-')); const file = pathToFileURL(join(dir, 'data', 'analysis.json'));
  let time = Date.parse('2026-10-30T12:00:00Z'), calls = 0;
  const fetcher = async url => {
    if (String(url).includes('naverapihub')) return { ok: true, json: async () => ({ items: [{ title: '김정은 관련 보도', description: '외교 소식', originallink: 'https://example.com/news', pubDate: new Date(time).toUTCString() }] }) };
    calls++; const { normalize } = await import('../src/news.js'); const id = normalize({ title: '김정은 관련 보도', originallink: 'https://example.com/news', pubDate: new Date(time).toUTCString() }).id;
    return response({ ...report, sourceIds: [id] });
  };
  try {
    const service = createAnalysisService({ env, file, fetcher, now: () => time }); await service.refresh(); await service.refresh(); assert.equal(calls, 1);
    const restarted = createAnalysisService({ env, file, fetcher, now: () => time }); await restarted.load(); await restarted.refresh(); assert.equal(calls, 1);
    time += 24 * 3600000 + 1; await restarted.refresh(); assert.equal(calls, 2); assert.equal(restarted.read().stale, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
