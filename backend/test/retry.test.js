import test from 'node:test';
import assert from 'node:assert/strict';
import { requestWithRetry } from '../src/retry.js';
test('temporary 503 retries recover and stop after success', async () => {
  let calls = 0; const waits = [];
  const response = await requestWithRetry('https://example.com', {}, async () => ({ status: ++calls < 3 ? 503 : 200 }), async ms => waits.push(ms));
  assert.equal(response.status, 200); assert.equal(calls, 3); assert.deepEqual(waits, [1000, 2000]);
});
test('quota and permission failures never retry; server failures are bounded', async () => {
  for (const status of [403, 429, 503]) {
    let calls = 0;
    await requestWithRetry('https://example.com', {}, async () => { calls++; return { status }; }, async () => {});
    assert.equal(calls, status === 503 ? 3 : 1);
  }
});
