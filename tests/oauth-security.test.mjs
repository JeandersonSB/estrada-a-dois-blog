import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import {
  newOauthState,
  hasValidOauthState,
  safeJsonForInlineScript,
  isTrustedCmsOrigin,
  trustedCmsOrigins,
} from '../lib/oauth-security.ts';

test('OAuth state is unpredictable, one-time shaped and rejects mismatches', () => {
  const first = newOauthState();
  const second = newOauthState();
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.match(second, /^[a-f0-9]{64}$/);
  assert.notEqual(first, second);
  assert.equal(hasValidOauthState(first, first), true);
  assert.equal(hasValidOauthState(first, second), false);
  assert.equal(hasValidOauthState(first, null), false);
  assert.equal(hasValidOauthState(null, first), false);
  assert.equal(hasValidOauthState(first, first.slice(0, -1)), false);
  assert.equal(hasValidOauthState(first, first.toUpperCase()), false);
  assert.equal(hasValidOauthState('', ''), false);
});

test('OAuth token delivery is restricted to exact CMS origins', () => {
  assert.equal(isTrustedCmsOrigin('https://www.estradaadois.com', true), true);
  assert.equal(isTrustedCmsOrigin('https://estradaadois.com', true), true);
  assert.equal(isTrustedCmsOrigin('https://estrada-a-dois-blog.vercel.app', true), true);
  assert.equal(isTrustedCmsOrigin('https://estrada-a-dois-blog-jeandeerson-1438.vercel.app', true), true);
  assert.equal(isTrustedCmsOrigin('http://localhost:3000', true), false);
  assert.equal(isTrustedCmsOrigin('http://localhost:3000', false), true);
  for (const fake of [
    'https://evil.vercel.app',
    'https://www.estradaadois.com.evil.com',
    'https://www.estradaadois.com@evil.com',
    'https://www.estradaadois.com:8443',
    'http://www.estradaadois.com',
    'null',
    '*',
    '',
  ]) assert.equal(isTrustedCmsOrigin(fake, true), false, fake);
  assert.equal(new Set(trustedCmsOrigins(true)).size, trustedCmsOrigins(true).length);
});

test('OAuth token safely survives JavaScript string serialization without HTML injection', () => {
  const malicious = '</script><script>alert("stolen")</script>&\u2028\u2029';
  const message = 'authorization:github:success:' + JSON.stringify({
    token: malicious,
    provider: 'github',
  });
  const encoded = safeJsonForInlineScript(message);
  assert.equal(JSON.parse(encoded), message);
  assert.doesNotMatch(encoded, /<\/script/i);
  assert.doesNotMatch(encoded, /<|>|&|\u2028|\u2029/);
  assert.match(encoded, /\\u003c/);
});

test('OAuth routes enforce state cookie and authenticated postMessage handshake', () => {
  const authRoute = readFileSync(new URL('../app/api/auth/route.ts', import.meta.url), 'utf8');
  const callbackRoute = readFileSync(new URL('../app/api/callback/route.ts', import.meta.url), 'utf8');
  assert.match(authRoute, /httpOnly:\s*true/);
  assert.match(authRoute, /sameSite:\s*'lax'/);
  assert.match(callbackRoute, /hasValidOauthState\(expectedState, receivedState\)/);
  assert.match(callbackRoute, /event\.source !== openerWindow/);
  assert.match(callbackRoute, /allowedOrigins\.has\(event\.origin\)/);
  assert.match(callbackRoute, /Content-Security-Policy/);
  assert.match(callbackRoute, /Cache-Control/);
  assert.doesNotMatch(callbackRoute, /endsWith\(['"]\.vercel\.app/);
});
