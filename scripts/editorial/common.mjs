import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export const TIMEZONE = 'America/Sao_Paulo';
export const DRAFT = '⏳ Rascunho';
export const APPROVED = '✅ Aprovado para agendar';
export const PUBLISHED = '🟢 Publicado';
export const CATEGORIES = ['Dicas', 'Equipamentos', 'Manutenção'];
export const LIMITS = { Dicas: [700, 1200], Equipamentos: [800, 1400], Manutenção: [700, 1300] };
export const POSTS = 'content/posts';
export const PLAN = 'content/editorial/plan.json';
export const REPORTS = 'content/editorial/reports';

export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function addDays(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function nextMonday(now = new Date()) {
  const date = localDate(now);
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return addDays(date, ((8 - day) % 7) || 7);
}

export function validateWeek(week) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week) || Number.isNaN(Date.parse(week)) ||
      new Date(`${week}T12:00:00Z`).getUTCDay() !== 1 || addDays(week, 0) !== week) {
    throw new Error('A semana precisa ser uma segunda-feira válida em YYYY-MM-DD.');
  }
  return week;
}

export function slugify(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function slotsForWeek(week) {
  validateWeek(week);
  return CATEGORIES.map((category, index) => ({
    id: `ead-${week}-${slugify(category)}`, category,
    planned_for: `${addDays(week, index * 2)}T10:47:00-03:00`,
  }));
}

export function readPosts(root = process.cwd()) {
  const directory = path.join(root, POSTS);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory).filter(name => name.endsWith('.md')).map(name => {
    const file = path.join(directory, name);
    const { data, content } = matter(fs.readFileSync(file, 'utf8'));
    return { file, slug: name.slice(0, -3), data, content };
  });
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(data, null, 2)}\n`);
  fs.renameSync(temporary, file);
}

export function parseJson(text) {
  return JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
}

export function countWords(body) {
  return (body.replace(/https?:\/\/\S+/g, '').match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) || []).length;
}

const STOPWORDS = new Set('a o as os de da do das dos e em no na nos nas com para por um uma como que moto motocicleta viagem viajar guia dicas antes sobre escolher conferir'.split(' '));
export function topicOverlap(a, b) {
  const tokens = value => new Set(slugify(value).split('-').filter(word => word.length > 2 && !STOPWORDS.has(word)));
  const left = tokens(a), right = tokens(b);
  const intersection = [...left].filter(word => right.has(word)).length;
  return intersection / Math.max(1, Math.min(left.size, right.size));
}

export function validateArticle(article, category, posts = [], sources = []) {
  const errors = [];
  if (!article || typeof article.title !== 'string' || typeof article.excerpt !== 'string' || typeof article.body !== 'string') {
    return ['Título, resumo e corpo são obrigatórios.'];
  }
  const { title, excerpt, body } = article;
  const [min, max] = LIMITS[category] || [Infinity, 0];
  const words = countWords(body);
  if (title.length < 45 || title.length > 65) errors.push('Título precisa ter 45–65 caracteres.');
  if (excerpt.length < 140 || excerpt.length > 160) errors.push('Resumo precisa ter 140–160 caracteres.');
  if (words < min || words > max) errors.push(`Corpo tem ${words} palavras; esperado ${min}–${max}.`);
  if (/^#\s/m.test(body) || (body.match(/^##\s/gm) || []).length < 4 || /^#{4,}\s/m.test(body)) errors.push('Use pelo menos quatro H2, H3 opcionais e nenhum H1 no corpo.');
  if (/<\/?[a-z][^>]*>|javascript:|data:|!\[|```/i.test(body)) errors.push('Não use HTML, scripts, imagens ou blocos de código no corpo.');
  if (/\b(compre agora|cupom|desconto exclusivo|testamos|usamos em nossas|na nossa experiência|em nossas viagens constatamos)\b/i.test(body)) errors.push('Remova publicidade ou experiência própria não fornecida.');
  if (posts.some(post => topicOverlap(title, post.data.title || '') >= 0.82)) errors.push('A pauta se aproxima de artigo já existente; diferencie a intenção.');
  if (category === 'Equipamentos' && !/^\s*\|.*\|\s*\n\s*\|[\s:|\-]+\|/m.test(body)) errors.push('Inclua tabela comparativa em Markdown.');
  if (category === 'Dicas' && !/- \[ \]/.test(body)) errors.push('Inclua checklist e um erro comum.');
  if (category === 'Manutenção' && !/oficina|mec[aâ]nico|profissional qualificado/i.test(body)) errors.push('Diferencie inspeção simples de serviço em oficina.');
  const sections = body.split(/^## /m).slice(1);
  if (sections.filter(section => /💡 \*\*Leia também nossos outros roteiros autorais:\*\*/.test(section)).length < 2) errors.push('Inclua Leia também em pelo menos duas seções relacionadas.');
  const knownSlugs = new Set(posts.filter(post => post.data.status === PUBLISHED && post.data.category === 'Roteiros').map(post => post.slug));
  for (const match of body.matchAll(/\]\(([^)]+)\)/g)) {
    const url = match[1];
    if (url.startsWith('/blog/')) {
      if (!knownSlugs.has(url.slice(6))) errors.push(`Link interno não publicado: ${url}`);
    } else if (!sources.some(source => source.url === url)) {
      errors.push('Use apenas links internos publicados e as fontes primárias consultadas.');
    }
  }
  if (!/^## Fontes consultadas\s*$/m.test(body) || sources.length < 2 || sources.some(source => !body.includes(`](${source.url})`))) errors.push('Cite pelo menos duas fontes primárias consultadas na seção final.');
  return [...new Set(errors)];
}

export function isDueForPublication(data, now = new Date()) {
  return CATEGORIES.includes(data.category) && data.status === APPROVED &&
    data.editorial_reviewed === true && data.image_reviewed === true &&
    /^ead-\d{4}-\d{2}-\d{2}-(dicas|equipamentos|manutencao)$/.test(data.editorial_id || '') &&
    typeof data.planned_for === 'string' && /T\d{2}:\d{2}:\d{2}(?:-03:00|Z)$/.test(data.planned_for) &&
    Number.isFinite(Date.parse(data.planned_for)) && Date.parse(data.planned_for) <= now.getTime();
}

export async function notifyTelegram(message, fetcher = fetch) {
  const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) throw new Error('Configure TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID nos Secrets do GitHub.');
  const response = await fetcher(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(20000),
    body: JSON.stringify({ chat_id: chat, text: message.slice(0, 4000), disable_web_page_preview: true }),
  });
  if (!response.ok || !(await response.json()).ok) throw new Error('Telegram não confirmou o envio do aviso.');
}
