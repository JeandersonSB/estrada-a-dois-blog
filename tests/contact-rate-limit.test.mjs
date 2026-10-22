import assert from 'node:assert/strict';
import { test } from 'node:test';
import { checkContactRateLimit } from '../lib/contact-rate-limit.ts';

test('per-instance contact rate limiting stops repetitive sends and resets after ten minutes', () => {
  const now = 100000;
  const ip = '198.51.100.14';
  for (let i = 0; i < 5; i++) {
    assert.deepEqual(checkContactRateLimit(ip, now+i), { allowed: true, retryAfterSeconds: 0 });
  }
  const result = checkContactRateLimit(ip, now+5);
  assert.equal(result.allowed, false);
  assert.ok(result.retryAfterSeconds > 0);
  assert.deepEqual(checkContactRateLimit(ip, now+600001), { allowed: true, retryAfterSeconds: 0 });
});

test('the limit distinguishes clients and limits missing or malformed addresses', () => {
  assert.equal(checkContactRateLimit('203.0.113.1').allowed, true);
  assert.equal(checkContactRateLimit('203.0.113.2').allowed, true);
  const now = 2000000;
  for (let i = 0; i < 5; i++) assert.equal(checkContactRateLimit(i % 2 ? null : 'bad-ip', now).allowed, true);
  assert.equal(checkContactRateLimit(null, now).allowed, false);
  assert.equal(checkContactRateLimit('spoofed-client-ip', now).allowed, false);
});
