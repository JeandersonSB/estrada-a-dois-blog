import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readContactRequest, ContactRequestError } from '../lib/contact-request.ts';

const request = (body, headers = {}) => new Request('https://www.estradaadois.com/api/contato', {
  method: 'POST', body, headers: { 'content-type': 'application/json', ...headers },
});
const rejectsWithStatus = (req, status) => assert.rejects(readContactRequest(req),
  error => error instanceof ContactRequestError && error.status === status);

test('valid contact submissions preserve text and normalize optional fields', async () => {
  const result = await readContactRequest(request(JSON.stringify({ name: ' Jeanderson ', message: '<tag>& oi' })));
  assert.equal(result.name, 'Jeanderson');
  assert.equal(result.message, '<tag>& oi');
  assert.equal(result.honeypot, false);
  assert.equal(result.email, '');
});

test('invalid JSON, non-object bodies and invalid field types are client errors', async () => {
  for (const body of ['{', 'null', '[]', '"hello"', '{"name":123,"message":"oi"}', '{"name":"   ","message":"oi"}']) {
    await rejectsWithStatus(request(body), 400);
  }
  await rejectsWithStatus(request(JSON.stringify({ name: 'A', message: 'x'.repeat(2501) })), 400);
  await rejectsWithStatus(request(JSON.stringify({ name: 'A', message: 'Oi', email: {} })), 400);
});

test('cross-site browser submissions and non-JSON media types are rejected', async () => {
  const body = '{"name":"A","message":"Oi"}';
  await rejectsWithStatus(request(body, { origin: 'https://estradaadois.com.evil.example' }), 403);
  await rejectsWithStatus(request(body, { 'sec-fetch-site': 'cross-site' }), 403);
  await rejectsWithStatus(request(body, { 'content-type': 'text/plain' }), 415);
  assert.equal((await readContactRequest(request(body, { origin: 'https://www.estradaadois.com' }))).name, 'A');
});

test('size limit counts UTF-8 bytes and cannot be bypassed with absent or false headers', async () => {
  const oversized = JSON.stringify({ name: 'A', message: '🛵'.repeat(2200) });
  await rejectsWithStatus(request(oversized), 413);
  await rejectsWithStatus(request(oversized, { 'content-length': '1' }), 413);
  await rejectsWithStatus(request('{}', { 'content-length': '8193' }), 413);
  let cancelled = false;
  const stream = new ReadableStream({
    start(controller) { controller.enqueue(new Uint8Array(8193)); },
    cancel() { cancelled = true; },
  });
  await rejectsWithStatus(new Request('https://www.estradaadois.com/api/contato', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: stream, duplex: 'half',
  }), 413);
  assert.equal(cancelled, true);
});

test('honeypot submissions return a discard signal without provider access', async () => {
  assert.equal((await readContactRequest(request('{"_bot_honey":"spam"}'))).honeypot, true);
});
