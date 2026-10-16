// Run: node scripts/market.test.mjs
import assert from 'node:assert/strict';
import { marketStatus, formatWait, usSessionInIST, istClock } from '../src/market.js';

// 2026-10-15 is a Thursday. New York is on EDT (UTC-4).
const at = (iso) => new Date(iso);

assert.equal(marketStatus(at('2026-10-15T13:30:00Z')).open, true, '9:30 ET opens');
assert.equal(marketStatus(at('2026-10-15T13:29:00Z')).minutesLeft, 1, '9:29 ET opens in 1m');
assert.equal(marketStatus(at('2026-10-15T19:59:00Z')).minutesLeft, 1, '15:59 ET closes in 1m');
assert.equal(marketStatus(at('2026-10-15T20:00:00Z')).open, false, '16:00 ET is closed');
assert.equal(marketStatus(at('2026-10-15T20:00:00Z')).minutesLeft, 17 * 60 + 30, 'Thu close to Fri open');
assert.equal(marketStatus(at('2026-10-16T20:00:00Z')).minutesLeft, 2 * 1440 + 17 * 60 + 30, 'Fri close to Mon open');
assert.equal(marketStatus(at('2026-10-17T16:00:00Z')).open, false, 'Saturday closed');
assert.equal(marketStatus(at('2026-12-15T14:30:00Z')).open, true, '9:30 EST in winter opens');
assert.equal(formatWait(45), '45m');
assert.equal(formatWait(125), '2h 5m');
assert.equal(formatWait(3000), '2d 2h');
// Session in IST: 7:00 pm–1:30 am during US daylight time, 8:00 pm–2:30 am otherwise.
assert.deepEqual(usSessionInIST(at('2026-10-15T12:00:00Z')), { open: 19 * 60, close: 25 * 60 + 30 }, 'EDT session in IST');
assert.deepEqual(usSessionInIST(at('2026-12-15T12:00:00Z')), { open: 20 * 60, close: 26 * 60 + 30 }, 'EST session in IST');
assert.equal(istClock(19 * 60), '7:00\u00a0pm');
assert.equal(istClock(25 * 60 + 30), '1:30\u00a0am');
assert.equal(istClock(12 * 60), '12:00\u00a0pm');
assert.equal(istClock(0), '12:00\u00a0am');
console.log('market.test: all passed');
