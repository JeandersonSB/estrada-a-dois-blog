import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import { CATEGORIES, DRAFT, LIMITS, PLAN, POSTS, PUBLISHED, REPORTS, addDays, countWords, localDate, nextMonday, notifyTelegram, readPosts, slotsForWeek, slugify, topicOverlap, validateArticle, validateWeek, writeJson } from './editorial/common.mjs';
import { generate, research } from './editorial/gemini.mjs';
import { createCover, SUBJECTS } from './editorial/cover.mjs';

function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function weekInput() { return validateWeek(process.env.EDITORIAL_WEEK || nextMonday()); }

function validateTopics(topics, posts, reserved = []) {
  if (!Array.isArray(topics) || topics.length !== 3) throw new Error('O plano precisa ter exatamente três pautas.');
  for (const [index, category] of CATEGORIES.entries()) {
    const topic = topics[index];
    if (topic.category !== category || typeof topic.title !== 'string' || typeof topic.angle !== 'string' || !SUBJECTS[topic.subject]) throw new Error('Pauta sem categoria, intenção ou ilustração válida.');
    if ([...posts.map(post => post.data), ...reserved].some(item => topicOverlap(item.title || '', topic.title) >= 0.82)) throw new Error(`Pauta muito próxima do acervo: ${topic.title}`);
  }
}

async function ensurePlan(root, week, posts, generator) {
  const planFile = path.join(root, PLAN);
  const plan = readJson(planFile);
  if (plan.weeks[week]) { validateTopics(plan.weeks[week], posts); return plan.weeks[week]; }
  // Quando o calendário inicial acabar, planeja outro ciclo de quatro semanas.
  // Só ideias são produzidas aqui; cada artigo ainda precisa passar pela pesquisa.
  const reserved = Object.values(plan.weeks).flat();
  const result = await generator(`Planeje quatro semanas de pautas originais para Estrada a Dois, começando em ${week}.
Público: motociclistas brasileiros iniciantes e casais. Uma pauta por categoria por semana, na ordem Dicas, Equipamentos, Manutenção.
Evite Notícias e Roteiros. Não alegue experiência do casal nem escolha desmontagem de freios/motor. Prefira dúvidas específicas, prevenções e decisões práticas.
Acervo existente e pautas reservadas (não repetir intenção): ${JSON.stringify([...posts.map(post => ({ title: post.data.title, category: post.data.category })), ...reserved])}.
Temas de capa disponíveis: ${Object.keys(SUBJECTS).join(', ')}.
Formato: {"weeks":[[{"category":"Dicas","title":"Ideia de título","keyword":"busca principal","angle":"Dúvida específica e diferencial","subject":"map"},{"category":"Equipamentos",...},{"category":"Manutenção",...}], ...mais 3 semanas]}.`);
  if (!Array.isArray(result.value.weeks) || result.value.weeks.length !== 4) throw new Error('Planejamento não retornou quatro semanas.');
  for (const [index, topics] of result.value.weeks.entries()) {
    validateTopics(topics, posts, reserved);
    reserved.push(...topics);
    plan.weeks[addDays(week, index * 7)] = topics;
  }
  writeJson(planFile, plan);
  return plan.weeks[week];
}

export async function generateBatch({ root = process.cwd(), week = weekInput(), generator = generate, researcher = research } = {}) {
  const reportFile = path.join(root, REPORTS, `${week}.json`);
  const previous = fs.existsSync(reportFile) ? readJson(reportFile) : {};
  const report = { week, checked_at: new Date().toISOString(), articles: [], errors: [] };
  let posts = readPosts(root);
  const slots = slotsForWeek(week);
  // Identidade semanal persistente: reexecução não sobrescreve nem duplica o
  // conteúdo já gerado, revisado, aprovado ou publicado pelo usuário.
  const missing = slots.filter(slot => !posts.some(post => post.data.editorial_id === slot.id));
  let topics;
  if (missing.length) {
    const basePosts = posts.filter(post => !slots.some(slot => slot.id === post.data.editorial_id));
    topics = await ensurePlan(root, week, basePosts, generator);
  }
  const manual = fs.readFileSync(path.join(root, 'docs/MANUAL_EDITORIAL_SEO_ADSENSE.md'), 'utf8');
  for (const [index, slot] of slots.entries()) {
    const existing = posts.find(post => post.data.editorial_id === slot.id);
    if (existing) {
      report.articles.push({ ...(previous.articles || []).find(item => item.id === slot.id), id: slot.id, title: existing.data.title, category: slot.category, slug: existing.slug, planned_for: existing.data.planned_for, status: existing.data.status, reused: true });
      continue;
    }
    try {
      const topic = topics[index];
      const dossier = await researcher(topic, generator);
      const published = posts.filter(post => post.data.status === PUBLISHED && post.data.category === 'Roteiros');
      let article, errors = [];
      for (let attempt = 0; attempt < 3; attempt++) {
        const result = await generator(`Escreva um artigo ORIGINAL em português brasileiro para Estrada a Dois.
Pauta: ${JSON.stringify(topic)}. Categoria: ${slot.category}. Data de referência: ${localDate()}.
Manual editorial completo (siga o formato e a extensão; exemplos de números e recomendações do manual NÃO são evidência técnica):\n${manual}
Fontes realmente consultadas e fatos com evidência: ${JSON.stringify(dossier.sources)}.
Use somente os fatos suportados; não generalize um manual específico para todas as motos. NÃO transforme instruções de freio, motor, suspensão ou eletricidade em reparo doméstico: limite-se a inspeção com moto desligada, leitura do manual e encaminhamento à oficina.
NÃO invente uso, depoimento, teste, compra ou opinião de Jeanderson/Ana Paula. Não use primeira pessoa para alegar experiência. Não copie trechos da pesquisa; escreva com suas próprias palavras.
Título de 45–65 caracteres com palavra-chave no início; resumo de 140–160 caracteres; corpo de ${LIMITS[slot.category].join(' a ')} palavras. Alvo: ${Math.round((LIMITS[slot.category][0] + LIMITS[slot.category][1]) / 2)} palavras. Sem H1 no corpo, pois o site já o exibe. Pelo menos quatro seções H2, H3 opcionais. Parágrafos curtos, nenhuma imagem ou HTML no Markdown.
Em Dicas inclua checklist - [ ] e erro comum. Em Equipamentos inclua tabela comparativa objetiva e veredito por perfil, sem afirmar testes práticos. Em Manutenção diferencie o que observar do que precisa de oficina.
Links publicados disponíveis (escolha APENAS relevantes à seção e não repita o mesmo link): ${JSON.stringify(published.map(post => ({ title: post.data.title, url: `/blog/${post.slug}` })))}.
Em pelo menos DUAS seções do desenvolvimento, acrescente ao final: "💡 **Leia também nossos outros roteiros autorais:**" seguido de lista Markdown com UM artigo relacionado àquela seção. Não reúna esses links no final. Não inclua o CTA das redes no corpo: o template exibe botões rastreados.
Termine com "## Fontes consultadas" e links de TODAS as fontes fornecidas. Não adicione URLs inventadas, lojas, cupons ou notícias. Não use citações literais nem informações não confirmadas.
Retorne SOMENTE JSON: {"title":"...","excerpt":"...","body":"Markdown integral"}.
${errors.length ? `A tentativa anterior foi recusada por: ${errors.join(' ')}. Corrija esses pontos.` : ''}`);
        article = result.value;
        errors = validateArticle(article, slot.category, posts, dossier.sources);
        if (!errors.length) { dossier.writing_model = result.model; break; }
      }
      if (errors.length) throw new Error(errors.join(' '));
      const slug = `${slugify(article.title).slice(0, 90)}-${week}`;
      const postFile = path.join(root, POSTS, `${slug}.md`);
      if (fs.existsSync(postFile)) throw new Error('Já existe arquivo com este slug; nenhuma sobrescrita permitida.');
      const image = await createCover(root, slug, topic.subject);
      const frontmatter = {
        title: article.title, date: slot.planned_for, category: slot.category, status: DRAFT,
        image, image_alt: `Ilustração conceitual sobre ${topic.title.toLowerCase()}`,
        image_credit: 'Ilustração editorial própria do Estrada a Dois; representação conceitual, sem teste de produto.',
        excerpt: article.excerpt, editorial_id: slot.id, planned_for: slot.planned_for,
      };
      fs.mkdirSync(path.dirname(postFile), { recursive: true });
      fs.writeFileSync(postFile, matter.stringify(`${article.body.trim()}\n`, frontmatter, { lineWidth: -1 }));
      report.articles.push({ id: slot.id, title: article.title, category: slot.category, slug, planned_for: slot.planned_for, status: DRAFT, words: countWords(article.body), sources: dossier.sources, research_model: dossier.model, writing_model: dossier.writing_model, review_notes: dossier.review_notes, reused: false });
      posts = readPosts(root);
      console.log(`${slot.category}: rascunho salvo (${countWords(article.body)} palavras).`);
    } catch (error) {
      report.errors.push({ id: slot.id, category: slot.category, message: error.message });
      console.error(`${slot.category}: ${error.message}`);
    }
    writeJson(reportFile, report);
  }
  writeJson(reportFile, report);
  return report;
}

async function notifyBatch(root, week) {
  const report = readJson(path.join(root, REPORTS, `${week}.json`));
  // Reexecução sem novidades não repete o mesmo aviso.
  if (report.articles.every(item => item.reused) && !report.errors.length) return;
  const lines = report.articles.map(item => `${item.category}: ${item.title}\nSugestão: ${item.planned_for?.slice(0, 10)} às 10h47`);
  await notifyTelegram(`📝 Estrada a Dois — semana de ${week}\n\n${lines.join('\n\n')}\n\n${report.errors.length ? `⚠️ ${report.errors.length} categoria(s) com falha; veja a execução no GitHub.\n\n` : ''}${report.articles.length ? 'Os artigos estão em Rascunho. Revise texto, fontes e capa e publique manualmente pelo painel, como de costume. As datas são sugestões de calendário.' : 'Não foram criados rascunhos nesta execução.'}\nhttps://www.estradaadois.com/admin/`);
}

async function main() {
  const mode = process.argv[2] || 'generate';
  const week = weekInput();
  if (mode === 'notify') return notifyBatch(process.cwd(), week);
  if (mode === 'failure') return notifyTelegram(`⚠️ A rotina editorial do Estrada a Dois não concluiu. Nenhum rascunho foi aprovado automaticamente. Confira a execução: https://github.com/JeandersonSB/estrada-a-dois-blog/actions`);
  if (mode === 'plan') {
    const plan = readJson(PLAN);
    console.log(JSON.stringify({ week, slots: slotsForWeek(week), topics: plan.weeks[week] || 'Planejamento do próximo ciclo será criado na execução.' }, null, 2));
    return;
  }
  if (mode !== 'generate') throw new Error('Modo desconhecido. Use generate, plan, notify ou failure.');
  const report = await generateBatch({ week });
  if (report.errors.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
