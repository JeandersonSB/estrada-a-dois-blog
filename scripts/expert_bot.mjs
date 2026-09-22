import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Configurações e variáveis de ambiente
const API_KEY = process.env.GEMINI_API_KEY;
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

if (!API_KEY) {
  console.error("❌ ERRO: GEMINI_API_KEY não encontrada no ambiente.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);

// =========================================================================
// GERADOR INTELIGENTE DE SLUGS (SEM CORTAR PALAVRAS, SEM STOPWORDS, TRANSLITERADO)
// =========================================================================

function gerarSlugInteligente(texto, maxLen = 65) {
  if (!texto) return '';

  let s = String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (s.length <= maxLen) {
    return limparFimSlug(s);
  }

  let sub = s.substring(0, maxLen);
  const lastHyphen = sub.lastIndexOf('-');
  if (lastHyphen > 25) {
    sub = sub.substring(0, lastHyphen);
  }

  return limparFimSlug(sub);
}

function limparFimSlug(slug) {
  let res = slug.replace(/^-+|-+$/g, '');

  const danglingWords = [
    'de', 'da', 'do', 'das', 'dos',
    'em', 'no', 'na', 'nos', 'nas',
    'com', 'para', 'por', 'sem',
    'e', 'a', 'o', 'as', 'os', 'um', 'uma',
    'se', 'que', 'qual', 'veja', 'como', 'ao', 'aos', 'sobre'
  ];

  let changed = true;
  while (changed) {
    changed = false;
    res = res.replace(/^-+|-+$/g, '');
    for (const w of danglingWords) {
      if (res.endsWith(`-${w}`)) {
        res = res.substring(0, res.length - (w.length + 1));
        changed = true;
      }
    }
  }

  return res.replace(/^-+|-+$/g, '');
}

// Baixa e otimiza a imagem localmente (Vercel CDN, garante < 200 KB para WhatsApp)
async function salvarEOtimizarImagemLocal(imageUrl, slug) {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) return imageUrl;
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const imagesDir = path.join(process.cwd(), 'public', 'images', 'blog');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const fileName = `${slug}.webp`;
    const targetPath = path.join(imagesDir, fileName);

    const meta = await sharp(buffer).metadata();
    if (!meta.width || meta.width < 400 || !meta.height || meta.height < 250) {
      throw new Error(`Imagem pequena demais (${meta.width}x${meta.height})`);
    }

    const optimizedBuffer = await sharp(buffer)
      .rotate()
      .resize(1200, 675, { fit: 'cover' })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    fs.writeFileSync(targetPath, optimizedBuffer);
    console.log(`🖼️ Imagem baixada e otimizada localmente: /images/blog/${fileName} (${(optimizedBuffer.length / 1024).toFixed(0)} KB)`);
    return `/images/blog/${fileName}`;
  } catch (err) {
    console.warn(`Aviso ao salvar imagem local (${err.message}). Mantendo URL original.`);
    return imageUrl;
  }
}

// 1. Determina a categoria a ser gerada
function determinarCategoria() {
  const envCat = (process.env.CATEGORY || 'auto').trim();
  
  if (['Dicas', 'Equipamentos', 'Manutenção'].includes(envCat)) {
    return envCat;
  }

  // Se for 'auto', seleciona pelo dia da semana (Domingo=0, Segunda=1, Terça=2, Quarta=3, Quinta=4, Sexta=5, Sábado=6)
  // Segunda (1): Dicas
  // Quarta (3): Equipamentos
  // Sexta (5): Manutenção
  const day = new Date().getDay();
  if (day === 1) return 'Dicas';
  if (day === 3) return 'Equipamentos';
  if (day === 5) return 'Manutenção';

  // Fallback para outros dias da semana
  const rotativo = ['Dicas', 'Equipamentos', 'Manutenção'];
  return rotativo[day % 3];
}

// 2. Lê os títulos dos artigos já existentes para evitar qualquer duplicidade
function listarArtigosExistentes() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
  const titulos = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(POSTS_DIR, file), 'utf8');
      const match = content.match(/title:\s*["']?([^"'\r\n]+)["']?/i);
      if (match && match[1]) {
        titulos.push(match[1].trim());
      }
    } catch {}
  }
  return titulos;
}

// 3. Busca imagem contextualizada
async function buscarImagemPorPalavrasChave(termoBusca) {
  if (!termoBusca) return 'https://loremflickr.com/1200/600/motorcycle,touring/all';
  
  try {
    const cleanKw = termoBusca.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    console.log(`🔍 Buscando imagem contextual para: "${cleanKw}"...`);
    
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanKw)}&gsrlimit=1&prop=pageimages&piprop=original&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EstradaADoisExpertBot/1.0' } });
    
    if (res.ok) {
      const data = await res.json();
      if (data?.query?.pages) {
        const pages = Object.values(data.query.pages);
        if (pages.length > 0 && pages[0]?.original?.source) {
          const src = pages[0].original.source;
          if (!src.endsWith('.svg') && !src.endsWith('.gif')) {
            console.log(`✅ Imagem encontrada: ${src}`);
            return src;
          }
        }
      }
    }
  } catch (e) {
    console.log(`Aviso na busca de imagem: ${e.message}`);
  }
  
  const tags = encodeURIComponent(termoBusca.toLowerCase().replace(/[^a-z0-9]+/g, ','));
  return `https://loremflickr.com/1200/600/${tags}/all`;
}

// 4. Envia notificação instantânea para o Telegram
async function enviarNotificacaoTelegram({ title, category, excerpt, date }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("ℹ️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não definidos. Alerta ignorado.");
    return;
  }

  const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const emojis = {
    'Dicas': '💡',
    'Equipamentos': '🛡️',
    'Manutenção': '🔧'
  };

  const emoji = emojis[category] || '📝';

  const mensagem = `📬 <b>NOVO RASCUNHO ESPECIALISTA GERADO!</b>\n\n` +
    `${emoji} <b>Categoria:</b> ${escapeHtml(category)} (⏳ Rascunho)\n` +
    `📌 <b>Título:</b>\n<b>${escapeHtml(title)}</b>\n\n` +
    `📅 <b>Data:</b> ${escapeHtml(date)}\n\n` +
    (excerpt ? `📝 <b>Resumo:</b>\n<i>${escapeHtml(excerpt)}</i>\n\n` : '') +
    `👉 <a href="https://www.estradaadois.com/admin/"><b>Clique aqui para revisar e publicar no Painel</b></a>`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensagem,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (data.ok) {
      console.log("📱 Notificação enviada para o Telegram com sucesso!");
    } else {
      console.warn("⚠️ Resposta da API do Telegram:", data);
    }
  } catch (err) {
    console.error("❌ Erro ao enviar para o Telegram:", err.message);
  }
}

// 5. Gera o artigo completo para a categoria indicada
async function gerarArtigo(categoria) {
  const titulosExistentes = listarArtigosExistentes();
  const today = new Date().toISOString().split('T')[0];

  console.log(`\n======================================================`);
  console.log(`🤖 ROBÔ ESPECIALISTA INICIANDO`);
  console.log(`📌 Categoria Selecionada: "${categoria}"`);
  console.log(`📚 Total de artigos já existentes no blog: ${titulosExistentes.length}`);
  console.log(`======================================================\n`);

  let instrucoesCategoria = '';

  if (categoria === 'Dicas') {
    instrucoesCategoria = `
    CATEGORIA: DICAS (Foco em viagens de moto, casais, garupa, roteiros e segurança)
    - Pautas recomendadas: técnicas de pilotagem com chuva/neblina/vento lateral, planejamento de custos e pedágios, ergonomia e paradas para não cansar o casal, comunicação e sinais, o que checar na hospedagem de mototuristas, postura em curvas fechadas de serra com peso, kit de primeiros socorros para estrada.
    - Extensão: 800 a 1.200 palavras.
    - Tom de voz: Amigável, experiente, didático e motivador (com o DNA do casal Estrada a Dois).
    - Formatação: Subtítulos ## claros, tópicos numerados ou listas com marcadores, e um Checklist Rápido para Salvar no Celular ao final.
    `;
  } else if (categoria === 'Equipamentos') {
    instrucoesCategoria = `
    CATEGORIA: EQUIPAMENTOS (Foco em proteção, tecnologia e comparativos honestos)
    - Pautas recomendadas: intercomunicadores para capacete (Mesh vs Bluetooth), jaquetas de verão vs 4 estações, protetores cervicais/neck brace, tipos de travas de moto para viagem (disco vs corrente), suportes de celular antivibração, viseiras fotocromáticas vs óculos solar interno, calças técnicas de cordura vs jeans com kevlar, capas de chuva de PVC vs nylon ripstop.
    - Extensão: 900 a 1.400 palavras.
    - Tom de voz: Técnico, responsável, focado em segurança e normas (Inmetro, ECE 22.06, EN 17092, etc.).
    - Formatação: OBRIGATÓRIO incluir uma Tabela Comparativa Resumida em Markdown (| Critério | Opção A | Opção B |) e uma seção de "O Veredito" ao final.
    - Proibição: NUNCA usar tom comercial de catálogo ("compre com desconto", "link de compra"). Mantenha foco 100% editorial e educativo.
    `;
  } else if (categoria === 'Manutenção') {
    instrucoesCategoria = `
    CATEGORIA: MANUTENÇÃO (Foco em cuidados preventivos e mecânica essencial)
    - Pautas recomendadas: como checar e quando trocar as pastilhas de freio, importância do fluido de freio DOT 4/5.1 (e o perigo da umidade), cuidados com a bateria da moto em viagens longas, folga da manete de embreagem e cabos, filtro de ar da moto na poeira/estrada de terra, como detectar vazamento de retentor de bengala/garfo, velas de ignição (comum vs iridium).
    - Extensão: 800 a 1.200 palavras.
    - Tom de voz: Prático, seguro e responsável.
    - Formatação: OBRIGATÓRIO incluir lista de ferramentas/produtos necessários, passo a passo em etapas e um aviso claro de segurança ("Se envolver desmontagem complexa, consulte seu mecânico de confiança").
    `;
  }

  const prompt = `
  Você é o especialista sênior em motociclismo e redator chefe do blog "Estrada a Dois".
  O blog pertence ao casal Jeanderson e Ana Paula, apaixonados por viagens de moto, mototurismo responsável e segurança sobre duas rodas.

  ${instrucoesCategoria}

  IMPORTANTE - TÍTULOS E TEMAS QUE JÁ FORAM PUBLICADOS NO BLOG (NÃO REPITA NENHUM DESTES TEMAS):
  ${titulosExistentes.map(t => `- ${t}`).join('\n')}

  SUA TAREFA:
  1. Escolha um tema NOVO, altamente relevante e muito pesquisado por motociclistas brasileiros no Google sobre a categoria "${categoria}".
  2. Crie um título cativante e otimizado para SEO (entre 45 e 65 caracteres).
  3. Redija o artigo completo em Português do Brasil com excelente profundidade e valor prático.
  4. LINKAGEM INTERNA (SEO): No meio ou no final do texto, insira naturalmente de 1 a 2 links para artigos do nosso blog, utilizando um dos seguintes roteiros reais do casal ou guias:
     - [De R15 à Serra do Rio do Rastro: Um Sonho em Duas Rodas](/blog/de-r15-a-serra-do-rio-do-rastro-um-sonho-em)
     - [De R15 para as Cataratas: Roteiro de 2.012 km a Dois](/blog/de-r15-para-as-cataratas-roteiro-de)
     - [Paraguai de moto: nossa viagem de 3 dias pela Rota Biker](/blog/paraguai-de-moto-nossa-viagem-de-3-dias-pela-rota-biker)
     - [5 serras e 831 km de moto em um fim de semana](/blog/5-serras-e-831-km-de-moto-em-um-fim-de)
     - [Viajar de moto com garupa: 7 cuidados antes de sair](/blog/viajar-de-moto-com-garupa-7-cuidados-antes-de-sair)
     - [Bagagem para viagem de moto: 7 passos para o casal](/blog/bagagem-para-viagem-de-moto-casal)
     - [Chuva em viagem de moto: 7 cuidados antes de sair](/blog/chuva-em-viagem-de-moto-7-cuidados-antes-de-sair)
     - [Como limpar e lubrificar a corrente da moto corretamente](/blog/como-limpar-e-lubrificar-a-corrente-da-moto-corretamente)

  REGRAS DE CONFORMIDADE ADSENSE & SEGURANÇA:
  - NUNCA mencione acidentes fatais, mortes ou crimes.
  - NUNCA use links comerciais de afiliados ou cupons de lojas.
  - Parágrafos curtos e dinâmicos (máximo 3 a 4 linhas por parágrafo).

  RETORNE APENAS O CÓDIGO MARKDOWN NO SEGUINTE FORMATO EXATO:
  ---
  title: "[Seu Título SEO Atraente em pt-BR]"
  date: "${today}"
  category: "${categoria}"
  status: "⏳ Rascunho"
  image: "IMAGE_PLACEHOLDER"
  keywords_image: "[2 a 3 palavras-chave da moto/equipamento em inglês ou português para busca fotográfica]"
  excerpt: "[Resumo impactante de 2 a 3 linhas com até 155 caracteres]"
  ---

  # [Título Completo do Artigo]

  [Texto completo do artigo estruturado com ## e ###]
  `;

  try {
    let markdownContent = null;
    const modelCandidates = [
      'gemini-3.6-flash',
      'gemini-flash-latest'
    ];
    let lastError = null;

    for (const modelName of modelCandidates) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🧠 Solicitando redação ao modelo: ${modelName} (tentativa ${attempt}/3)...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout de 50s no modelo ${modelName}`)), 50000));
          const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
          markdownContent = result.response.text();
          if (markdownContent) break;
        } catch (err) {
          console.log(`⚠️ Tentativa ${attempt} com ${modelName} falhou: ${err.message}`);
          lastError = err;
          // Se for 404 (modelo não existe), não adianta tentar novamente este modelo
          if (err.message && err.message.includes('404')) {
            break;
          }
          // Para 503 (alta demanda) ou timeout, aguardar com backoff antes de tentar novamente
          const waitTime = attempt * 3000;
          console.log(`⏳ Aguardando ${waitTime / 1000}s antes da próxima tentativa...`);
          await new Promise(r => setTimeout(r, waitTime));
        }
      }
      if (markdownContent) break;
    }

    if (!markdownContent) {
      throw lastError || new Error("Falha ao gerar o artigo com os modelos disponíveis.");
    }

    markdownContent = markdownContent.replace(/^```markdown\n?/m, '').replace(/```$/m, '').trim();

    // Extrair dados do Frontmatter
    const titleMatch = markdownContent.match(/title:\s*["']?([^"'\r\n]+)["']?/i);
    const title = titleMatch ? titleMatch[1].trim() : `Novo Guia de ${categoria}`;

    const excerptMatch = markdownContent.match(/excerpt:\s*["']?([^"'\r\n]+)["']?/i);
    const excerpt = excerptMatch ? excerptMatch[1].trim() : '';

    const kwMatch = markdownContent.match(/keywords_image:\s*["']?([^"'\r\n]+)["']?/i);
    const termoImagem = kwMatch ? kwMatch[1].trim() : `motorcycle ${categoria.toLowerCase()}`;

    // Gerar slug amigável e inteligente (palavras completas, sem stopwords no fim)
    const slug = gerarSlugInteligente(title, 65);

    // Buscar e otimizar imagem fotográfica para o blog (< 200 KB para WhatsApp)
    let imagemFinal = await buscarImagemPorPalavrasChave(termoImagem);
    if (imagemFinal && imagemFinal.startsWith('http')) {
      console.log(`Otimizando imagem para o blog e WhatsApp: ${imagemFinal}`);
      imagemFinal = await salvarEOtimizarImagemLocal(imagemFinal, slug);
    }

    // Substituir placeholder de imagem e limpar campo temporário
    markdownContent = markdownContent
      .replace('IMAGE_PLACEHOLDER', imagemFinal)
      .replace(/keywords_image:\s*["']?[^"'\r\n]+["']?\r?\n?/i, '');

    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }

    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    fs.writeFileSync(filePath, markdownContent, 'utf8');

    console.log(`\n🎉 Artigo gerado com sucesso!`);
    console.log(`📄 Arquivo salvo: content/posts/${slug}.md`);
    console.log(`📌 Título: "${title}"`);

    // Enviar alerta no Telegram
    await enviarNotificacaoTelegram({
      title,
      category: categoria,
      excerpt,
      date: today,
    });

    return true;
  } catch (err) {
    console.error("💥 Erro ao gerar artigo especialista:", err.message);
    process.exit(1);
  }
}

async function main() {
  const envCat = (process.env.CATEGORY || 'auto').trim();
  
  if (envCat === 'Todas') {
    console.log("🚀 Modo 'Todas' ativado: Gerando 1 artigo para cada uma das 3 categorias...");
    await gerarArtigo('Dicas');
    await new Promise(r => setTimeout(r, 3000));
    await gerarArtigo('Equipamentos');
    await new Promise(r => setTimeout(r, 3000));
    await gerarArtigo('Manutenção');
  } else {
    const categoria = determinarCategoria();
    await gerarArtigo(categoria);
  }
}

main();

