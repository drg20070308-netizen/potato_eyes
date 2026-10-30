import test from 'node:test';
import assert from 'node:assert/strict';
import { readPosition, locationFailure } from '../../frontend/shelterLocation.mjs';

test('missing or malformed browser coordinates cannot start a regional search', () => {
  for (const result of [undefined, {}, { coords: null }, { coords: {} }, { coords: { latitude: null, longitude: null } }, { coords: { latitude: NaN, longitude: 127 } }]) assert.equal(readPosition(result), null);
});
test('copies non-enumerable browser coordinate properties into plain data', () => {
  const coords = Object.defineProperties({}, { latitude: { get: () => 37.5 }, longitude: { get: () => 127 } });
  assert.deepEqual(readPosition({ coords }), { latitude: 37.5, longitude: 127 });
});
test('location denial, timeout and unavailable give distinct actionable messages', () => {
  assert.match(locationFailure(1), /위치를 허용/);
  assert.match(locationFailure(3), /시간이 초과/);
  assert.match(locationFailure(), /좌표를 받지 못/);
});
