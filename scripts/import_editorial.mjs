import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CATEGORIES, PLAN, validateWeek } from './editorial/common.mjs';
import { verifySource } from './editorial/gemini.mjs';
import { generateBatch } from './expert_bot.mjs';

// Entrada da tarefa do ChatGPT: usa pesquisa na web e redação da própria tarefa,
// sem credencial ou chamada à API Gemini. O mesmo validador, identidade semanal,
// capa e status de rascunho são compartilhados com o gerador manual.
export async function importPrepared({ input, root = process.cwd(), verifier = verifySource } = {}) {
  const week = validateWeek(input?.week || '');
  const plan = JSON.parse(fs.readFileSync(path.join(root, PLAN), 'utf8'));
  if (!plan.weeks[week]) throw new Error('Planeje primeiro esta semana em content/editorial/plan.json.');
  if (!Array.isArray(input.articles) || input.articles.some(item => !CATEGORIES.includes(item.category)) || new Set(input.articles.map(item => item.category)).size !== input.articles.length) throw new Error('Entrada precisa ter categorias válidas, sem repetições.');
  let current;
  return generateBatch({ root, week,
    researcher: async topic => {
      current = input.articles.find(item => item.category === topic.category);
      if (!current) throw new Error(`Falta o artigo de ${topic.category} na entrada.`);
      const sources = [];
      for (const source of (current.sources || []).slice(0, 4)) {
        const verified = await verifier(source);
        if (!sources.some(item => item.url === verified.url)) sources.push(verified);
      }
      if (sources.length < 2) throw new Error('São necessárias duas fontes oficiais com evidência conferida.');
      return { sources, model: 'pesquisa web editorial', review_notes: current.review_notes || [] };
    },
    generator: async () => ({ value: current.article, model: 'redação editorial com ChatGPT' }),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const file = process.argv[2];
    if (!file) throw new Error('Informe um arquivo JSON com week e articles.');
    const result = await importPrepared({ input: JSON.parse(fs.readFileSync(file, 'utf8')) });
    if (result.errors.length) process.exitCode = 1;
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
