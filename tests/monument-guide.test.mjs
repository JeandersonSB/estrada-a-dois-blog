import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import html from 'remark-html';
import { splitMonumentGuide, filterMonumentGuide } from '../lib/monument-guide.ts';

const raw = fs.readFileSync(new URL('../content/posts/monumentos-rota-biker-locais-enderecos-horarios.md', import.meta.url), 'utf8');
const { data, content } = matter(raw);
const rendered = String(await remark().use(remarkGfm).use(html).process(content));
const guide = splitMonumentGuide(rendered);

test('article is reconstructed without any content loss, including number 2 and the FAQ', () => {
  assert.ok(guide);
  assert.deepEqual(guide.entries.map(e => e.number), Array.from({length: 45}, (_,i) => i + 1));
  assert.equal(guide.beforeHtml + guide.entries.map(e => e.html).join('') + guide.afterHtml, rendered);
  assert.match(guide.afterHtml, /Como montar uma viagem/);
  assert.equal(data.status, '⏳ Rascunho');
  assert.equal(data.image, '');
});

test('number searches distinguish IDs from schedules, addresses and linked neighbours', () => {
  for (const term of ['13', '013', '#13', 'Monumento 13', 'monumento nº 13']) {
    assert.deepEqual(filterMonumentGuide(guide.entries, term).map(e => e.number), [13]);
  }
  assert.deepEqual(filterMonumentGuide(guide.entries, '02').map(e => e.number), [2]);
  assert.deepEqual(filterMonumentGuide(guide.entries, '513').map(e => e.number), [13]);
});

test('name, city, accents, full state names and UF searches preserve numerical order', () => {
  assert.deepEqual(filterMonumentGuide(guide.entries, 'portal grill').map(e => e.number), [26]);
  assert.deepEqual(filterMonumentGuide(guide.entries, 'ponta grossa').map(e => e.number), [13]);
  assert.deepEqual(filterMonumentGuide(guide.entries, 'SAO PAULO').map(e => e.number), [8,12,16,18,19,23,25,27,28,29,33,34,44,45]);
  assert.deepEqual(filterMonumentGuide(guide.entries, 'Paraná').map(e => e.number), [1,5,9,13,31,32,38]);
  assert.deepEqual(filterMonumentGuide(guide.entries, 'PR').map(e => e.number), [1,5,9,13,31,32,38]);
  assert.deepEqual(filterMonumentGuide(guide.entries, 'SC').map(e => e.number), [3,4,6,7,21,24,26]);
  assert.deepEqual(filterMonumentGuide(guide.entries, 'PY').map(e => e.number), [30]);
});

test('no-match and clearing work, and unrelated articles fall back to normal rendering', () => {
  assert.deepEqual(filterMonumentGuide(guide.entries, 'lugar inexistente'), []);
  assert.equal(filterMonumentGuide(guide.entries, '   '), guide.entries);
  assert.equal(filterMonumentGuide(guide.entries, ''), guide.entries);
  assert.equal(splitMonumentGuide('<h2>Outro artigo</h2><p>Texto original</p>'), null);
  assert.equal(splitMonumentGuide('<h2>Monumentos da Rota Biker em ordem crescente</h2><h3>Ficha sem número</h3>'), null);
});
