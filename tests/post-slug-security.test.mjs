import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePostSlug } from '../lib/post-slug.ts';

test('all existing article slugs remain compatible', () => {
  const fileNames = readdirSync(join(process.cwd(), 'content', 'posts')).filter(name => name.endsWith('.md'));
  assert.ok(fileNames.length > 0);
  for (const fileName of fileNames) {
    const slug = fileName.slice(0, -3);
    assert.equal(normalizePostSlug(slug), slug, fileName);
  }
});

test('decoded paths cannot escape the articles folder', () => {
  const invalid = [
    '..', '.', '../outside', '..%2foutside', '..%252foutside',
    '%2e%2e%2foutside', '%2fetc%2fpasswd', '..\\outside',
    '%5cWindows', 'name%00', '%ZZ', 'CAPITALS', 'name.html',
    'https://example.test', 'foo/bar', 'foo\\bar', '',
  ];
  for (const candidate of invalid) {
    assert.equal(normalizePostSlug(candidate), null, candidate);
  }
});

test('normal and URL-encoded canonical slugs are accepted', () => {
  assert.equal(normalizePostSlug('paraguai-de-moto'), 'paraguai-de-moto');
  assert.equal(normalizePostSlug('rota%2Dbiker'), 'rota-biker');
  assert.equal(normalizePostSlug('abc-123'), 'abc-123');
  assert.equal(normalizePostSlug('a'.repeat(181)), null);
});
