import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import matter from 'gray-matter';
import { APPROVED, CATEGORIES, DRAFT, PUBLISHED, addDays, isDueForPublication, localDate, nextMonday, readPosts, slotsForWeek, validateArticle, validateWeek } from '../scripts/editorial/common.mjs';
import { isPrimaryUrl, verifySource } from '../scripts/editorial/gemini.mjs';
import { generateBatch } from '../scripts/expert_bot.mjs';
import { publishApproved } from '../scripts/publish_editorial.mjs';
import { importPrepared } from '../scripts/import_editorial.mjs';

const week = '2026-10-26';
const sources = [
  { title: 'MSF', url: 'https://msf-usa.org/documents/safety', claims: [{ fact: 'Consultar o manual.', quote: 'Always follow the motorcycle owner manual instructions.' }] },
  { title: 'Honda', url: 'https://www.honda.com.br/motos/manual', claims: [{ fact: 'Conferir antes da viagem.', quote: 'Consulte sempre as instruções específicas do manual do proprietário.' }] },
];
const titles = {
  Dicas: 'Planejamento de paradas na viagem de moto em casal',
  Equipamentos: 'Capa de chuva para moto: como escolher para viajar',
  Manutenção: 'Bateria da moto parada: cuidados antes de viajar',
};

function fixtureArticle(category) {
  const paragraph = 'Confira o manual e considere as condições do percurso antes de tomar uma decisão. A preparação deve respeitar as orientações do fabricante e os limites de cada pessoa. Organize uma lista simples para comparar as opções com calma e procure uma oficina quando precisar de um profissional qualificado. ';
  const sections = Array.from({ length: 5 }, (_, index) => `## Etapa ${index + 1}\n\n${paragraph.repeat(4)}${index < 2 ? `\n💡 **Leia também nossos outros roteiros autorais:**\n- [Roteiro real ${index}](/blog/rota-${index})\n` : ''}`).join('\n\n');
  return {
    title: titles[category],
    excerpt: 'Planeje os cuidados da próxima viagem de moto com orientações práticas, consulta ao manual e decisões adequadas ao percurso para viajar com tranquilidade.',
    body: `${sections}\n\n## Checklist e erro comum\n\n- [ ] Consultar o manual.\n\n${category === 'Equipamentos' ? '| Critério | Opção A | Opção B |\n| --- | --- | --- |\n| Uso | Consultar manual | Conferir compatibilidade |\n\n' : ''}## Fontes consultadas\n\n${sources.map(source => `- [${source.title}](${source.url})`).join('\n')}`,
  };
}

function fixtureRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ead-editorial-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'content/posts'), { recursive: true });
  fs.mkdirSync(path.join(root, 'content/editorial'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
  fs.writeFileSync(path.join(root, 'docs/MANUAL_EDITORIAL_SEO_ADSENSE.md'), 'Manual da fixture.');
  fs.writeFileSync(path.join(root, 'content/editorial/plan.json'), JSON.stringify({ weeks: { [week]: CATEGORIES.map(category => ({ category, title: titles[category], keyword: category, angle: 'Intenção da pauta.', subject: 'checklist' })) } }));
  for (let index = 0; index < 2; index++) {
    fs.writeFileSync(path.join(root, `content/posts/rota-${index}.md`), matter.stringify('Relato real.', { title: `Serra autoral número ${index}`, category: 'Roteiros', status: PUBLISHED }));
  }
  return root;
}

test('semana e datas respeitam Brasília inclusive na virada de domingo', () => {
  assert.equal(localDate(new Date('2026-10-26T01:00:00Z')), '2026-10-25');
  assert.equal(nextMonday(new Date('2026-10-26T01:00:00Z')), week);
  assert.equal(nextMonday(new Date('2026-10-26T04:00:00Z')), '2026-11-02');
  assert.deepEqual(slotsForWeek(week).map(slot => slot.planned_for), ['2026-10-26T10:47:00-03:00', '2026-10-28T10:47:00-03:00', '2026-10-30T10:47:00-03:00']);
  assert.equal(addDays('2026-12-28', 7), '2027-01-04');
  assert.throws(() => validateWeek('2026-10-27'));
  assert.throws(() => validateWeek('2026-02-30'));
  assert.throws(() => validateWeek('2026-10-26\nGEMINI_API_KEY=malicious'));
});

test('somente aprovação humana dupla e vencimento permitem publicação', () => {
  const data = { ...slotsForWeek(week)[0], editorial_id: slotsForWeek(week)[0].id, status: APPROVED, editorial_reviewed: true, image_reviewed: true };
  const now = new Date('2026-10-26T13:47:00Z');
  assert.equal(isDueForPublication(data, now), true);
  assert.equal(isDueForPublication({ ...data, planned_for: new Date(data.planned_for) }, now), true);
  assert.equal(isDueForPublication({ ...data, planned_for: '2026-10-26T13:47:00+00:00' }, now), true);
  assert.equal(isDueForPublication({ ...data, planned_for: '2026-10-26T10:47:00' }, now), false);
  assert.equal(isDueForPublication({ ...data, planned_for: new Date('invalid') }, now), false);
  assert.equal(isDueForPublication(data, new Date('2026-10-26T13:46:59Z')), false);
  for (const overrides of [{ status: DRAFT }, { status: PUBLISHED }, { editorial_reviewed: false }, { image_reviewed: false }, { category: 'Notícias' }, { editorial_id: '' }, { planned_for: 'not-a-date' }]) {
    assert.equal(isDueForPublication({ ...data, ...overrides }, now), false);
  }
});

test('fontes rejeitam URLs externas, subdomínio impostor e evidência inventada', async () => {
  for (const url of ['http://www.honda.com.br/manual', 'https://honda.com.br.evil.test', 'https://127.0.0.1/manual', 'https://user:secret@msf-usa.org/manual', 'https://msf-usa.org:8443/manual']) assert.equal(isPrimaryUrl(url), false);
  assert.equal(isPrimaryUrl(sources[0].url), true);
  const fetcher = async () => new Response(`<html><body>${sources[0].claims[0].quote}</body></html>`, { headers: { 'content-type': 'text/html' } });
  assert.equal((await verifySource(sources[0], {}, fetcher)).verification, 'html-quote-match');
  const accented = { ...sources[0], claims: [{ fact: 'Pausa e planejamento.', quote: 'Conferir alimentação, condições e organização da próxima etapa.' }] };
  assert.equal((await verifySource(accented, {}, async () => new Response('<p>Conferir alimenta&ccedil;&atilde;o, condi&#231;&#245;es e organiza&#xE7;&#xE3;o da pr&oacute;xima etapa.</p>'))).verification, 'html-quote-match');
  await assert.rejects(() => verifySource({ ...sources[0], claims: [{ fact: 'Unsupported', quote: 'This invented sentence was never present in the official source page.' }] }, {}, fetcher));
  await assert.rejects(() => verifySource(sources[0], {}, async () => new Response('', { status: 302, headers: { location: 'https://evil.test/page' } })));
  await assert.rejects(() => verifySource(sources[0], {}, async () => new Response('not a pdf', { headers: { 'content-type': 'application/pdf' } })));
});

test('validação exige fontes, links por seção e formato adequado à categoria', t => {
  const root = fixtureRoot(t), posts = readPosts(root);
  const article = fixtureArticle('Equipamentos');
  assert.deepEqual(validateArticle(article, 'Equipamentos', posts, sources), []);
  assert.ok(validateArticle({ ...article, body: article.body.replace(/\|.*\n/g, '') }, 'Equipamentos', posts, sources).length);
  assert.ok(validateArticle({ ...article, body: `${article.body}\n[Loja](https://evil.test)` }, 'Equipamentos', posts, sources).length);
  assert.ok(validateArticle({ ...article, body: article.body.replace('rota-0', 'rascunho-inexistente') }, 'Equipamentos', posts, sources).length);
  assert.ok(validateArticle(article, 'Equipamentos', posts, []).length);
});

test('lote é recuperável: falha parcial não perde artigos nem sobrescreve revisão humana', async t => {
  const root = fixtureRoot(t);
  let failEquipment = true, calls = 0;
  const generator = async prompt => {
    calls++;
    const category = CATEGORIES.find(category => prompt.includes(`Categoria: ${category}.`));
    return { value: fixtureArticle(category), model: 'fixture-model' };
  };
  const researcher = async topic => {
    if (topic.category === 'Equipamentos' && failEquipment) throw new Error('Fixture: pesquisa indisponível.');
    return { sources, model: 'fixture-research', review_notes: [] };
  };
  const first = await generateBatch({ root, week, generator, researcher });
  assert.equal(first.articles.length, 2);
  assert.equal(first.errors.length, 1);
  const dicas = readPosts(root).find(post => post.data.category === 'Dicas');
  fs.writeFileSync(dicas.file, matter.stringify(`${dicas.content}\nNota editorial humana preservada.\n`, { ...dicas.data, status: APPROVED, editorial_reviewed: true }));
  failEquipment = false;
  const second = await generateBatch({ root, week, generator, researcher });
  assert.equal(second.articles.length, 3);
  assert.equal(second.errors.length, 0);
  assert.equal(second.articles.filter(item => item.reused).length, 2);
  assert.equal(calls, 3);
  assert.equal(readPosts(root).filter(post => post.data.editorial_id).length, 3);
  assert.match(fs.readFileSync(dicas.file, 'utf8'), /Nota editorial humana preservada/);
  assert.equal(matter(fs.readFileSync(dicas.file, 'utf8')).data.status, APPROVED);
  await generateBatch({ root, week, generator: () => { throw new Error('Não deve chamar a API.'); }, researcher });
});

test('publicador preserva rascunhos, espera data e capa revisada e não republica', async t => {
  const root = fixtureRoot(t);
  await generateBatch({ root, week,
    generator: async prompt => ({ value: fixtureArticle(CATEGORIES.find(category => prompt.includes(`Categoria: ${category}.`))), model: 'fixture' }),
    researcher: async () => ({ sources, model: 'fixture', review_notes: [] }),
  });
  const now = new Date('2026-10-26T13:47:00Z');
  assert.equal((await publishApproved({ root, now })).published.length, 0);
  for (const post of readPosts(root).filter(post => post.data.editorial_id)) fs.writeFileSync(post.file, matter.stringify(post.content, { ...post.data, status: APPROVED, editorial_reviewed: true, image_reviewed: true }));
  assert.equal((await publishApproved({ root, now: new Date('2026-10-26T13:46:59Z') })).published.length, 0);
  const published = await publishApproved({ root, now });
  assert.equal(published.published.length, 1);
  assert.equal(published.published[0].category, 'Dicas');
  assert.equal((await publishApproved({ root, now })).published.length, 0);
  const equipment = readPosts(root).find(post => post.data.category === 'Equipamentos');
  fs.unlinkSync(path.join(root, 'public', equipment.data.image.slice(1)));
  const blocked = await publishApproved({ root, now: new Date('2026-10-28T13:47:00Z') });
  assert.equal(blocked.blocked.length, 1);
  assert.equal(matter(fs.readFileSync(equipment.file, 'utf8')).data.status, APPROVED);
});

test('entrada editorial do ChatGPT usa o mesmo fluxo, sem chamada ou chave Gemini', async t => {
  const root = fixtureRoot(t);
  const result = await importPrepared({ root,
    input: { week, articles: CATEGORIES.map(category => ({ category, article: fixtureArticle(category), sources })) },
    verifier: async source => ({ ...source, verified_at: new Date().toISOString(), verification: 'fixture' }),
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.articles.length, 3);
  assert.ok(readPosts(root).filter(post => post.data.editorial_id).every(post => post.data.status === DRAFT && post.data.editorial_reviewed === false && post.data.image_reviewed === false));
  for (const post of readPosts(root).filter(post => post.data.editorial_id)) assert.match(fs.readFileSync(post.file, 'utf8'), /^image: ['"]?\/images\/blog\/.+\.webp['"]?$/m);
});
