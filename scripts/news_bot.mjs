import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Configuracoes
const API_KEY = process.env.GEMINI_API_KEY;
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

function calcularMetaNoticias() {
  const envVal = process.env.NEWS_COUNT ? parseInt(process.env.NEWS_COUNT, 10) : null;
  if (envVal && !isNaN(envVal) && envVal > 0) {
    return envVal;
  }

  // Se nao foi fixado manualmente, checar a ultima noticia postada no blog
  try {
    if (fs.existsSync(POSTS_DIR)) {
      const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
      let ultimaData = 0;
      for (const f of files) {
        const c = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
        if (c.includes('Notícias') || c.includes('Noticias')) {
          const d = c.match(/date:\s*["']?([^"'\r\n]+)["']?/);
          if (d && d[1]) {
            const time = new Date(d[1]).getTime();
            if (time > ultimaData) ultimaData = time;
          }
        }
      }
      if (ultimaData > 0) {
        const diffHoras = (Date.now() - ultimaData) / (1000 * 60 * 60);
        if (diffHoras >= 3.5) {
          console.log(`⏱️ Última notícia gerada há ${diffHoras.toFixed(1)}h (compensando intervalo). Meta ajustada para 2 notícias.`);
          return 2;
        }
      }
    }
  } catch (e) {
    console.log('Aviso ao checar compensacao de noticias:', e.message);
  }
  return 1;
}

if (!API_KEY) {
  console.error("ERRO: GEMINI_API_KEY nao encontrada.");
  process.exit(1);
}

// 1. FEED PRINCIPAL: Mercado Brasileiro (gl=BR, hl=pt-BR) - Janela dos ultimos 7 dias
const QUERIES_BR = [
  'motos lancamento when:7d',
  'motos brasil lancamento when:7d',
  'motos brasil when:7d',
  'motociclismo brasil when:7d',
  'honda motos brasil when:7d',
  'yamaha motos brasil when:7d',
  'royal enfield brasil when:7d',
  'shineray motos brasil when:7d',
  'bmw motorrad brasil when:7d',
  'triumph motos brasil when:7d',
  'kawasaki motos brasil when:7d',
  'duas rodas motos brasil when:7d'
];

// 2. FEED SECUNDARIO: Mercado Global (apenas fallback)
const QUERIES_GLOBAL = [
  'motorcycle launch when:7d',
  'motorcycle unveiled when:7d',
  'new motorcycle model when:7d'
];

const MAX_AGE_HOURS = 168;

const TOP_PORTALS = ['autoesporte', 'motor1', 'webmotors', 'motonline', 'motoo', 'estadao', 'uol', 'cnn', 'r7', 'noticiasautomotivas', 'garagem360', 'motociclismo', 'mobiauto'];

const CRIME_POLICE_KEYWORDS_REGEX = /\b(acidente|acidentes|colisao|colisão|batida|morte|mortes|morre|morreu|morto|mortos|fatal|fatidico|fatídico|ferido|feridos|tiro|tiros|baleado|baleada|assalto|assaltante|assalta|roubo|roubada|roubado|furto|furtam|furtada|apreensao|apreensão|apreendido|apreendida|preso|presos|prisao|prisão|detido|detida|policia|polícia|policial|policiais|criminoso|criminosos|crime|crimes|trafico|tráfico|drogas|suspeito|suspeitos|tragedia|tragédia|homicidio|homicídio|corpo|chacina|atropelado|atropelamento|leilao|leilão|leiloes|leilões|queda|caiu|cai\b|esborracha|capotar|capotamento|letreiro|resgate|vitima|vítima|vitimas|vítimas|perde\s+a\s+vida|amputada|amputado|sangue|feminicidio|feminicídio|arma|cadeira\s+de\s+rodas|bicicleta|ciclista|boko\s+haram|terrorist|terrorism|troops\s+arrest|militant|killed|death|fatal\s+crash|stolen|robbery|suspects?|homicide|thief|thieves|rolezinho|operacao|operação)\b/i;

const SALES_DOMAINS_AND_KEYWORDS = [
  'amazon.', 'ebay.', 'aliexpress.', 'shopee.', 'walmart.', 'bestbuy.', 'target.',
  'mercadolivre.', 'alibaba.', 'etsy.', 'rakuten.', 'wish.', 'shein.', 'temu.',
  'shop.', 'store.', 'deals.', 'coupons.', 'discount.', 'cart.', 'checkout.',
  'umlconnector', 'gearbest', 'banggood',
  'oficinadanet.com.br', 'tudocelular.com', 'tecmundo.com.br', 'canaltech.com.br'
];

const SALES_TITLE_REGEX = /\b(deal|deals|sale|sales|discount|discounts|save\s+\$|save\s+up\s+to|\$\d+|\d+%\s+off|coupon|coupons|buy\s+now|promo|promotion|promotional|best\s+price|cheap|under\s+\$|free\s+shipping|iphone|celular|smartphone|smartwatch|motorola|moto\s+g\d*|moto\s+e\d*|moto\s+edge|moto\s+snaps?|moto\s+360|mounjaro|geladeira|geladeiras|compre\s+j[aá]|desconto|liquidacao|liquidação|oferta|ofertas|for\s+sale|clearance|outlet|order\s+now|cashback|wholesale|affiliate|gta\s+online|chevrolet|carro|carros|suv|hibrido|híbrido|picape|caminhao|caminhão|onibus|ônibus|volvo|hyundai|changan|elantra|cs55|ram\s+cresce|nissan|renault|dolphin|s10|m2|m4|i5|volei|vôlei|basquete|dark\s+horse|investigado|candidatura|governo\s+do\s+estado|bolsonaro|lula|congresso\s+de\s+missoes|congresso\s+de\s+missões|tv\s+brasil|programacao\s+semanal|programação\s+semanal|banco|fatura|futebol|chile|ancelotti|willis)\b/i;

const MOTORCYCLE_POSITIVE_REGEX = /\b(moto|motos|motocicleta|motocicletas|motociclismo|motociclista|motociclistas|scooter|scooters|ciclomotor|honda|yamaha|royal\s+enfield|shineray|bmw\s+motorrad|triumph|kawasaki|suzuki|ducati|bajaj|cfmoto|voge|dafra|harley|kymco|trail|custom|naked|carenada|big\s+trail|pilotagem|duas\s+rodas|piloto|motovelocidade)\b/i;

const parser = new Parser({ timeout: 8000 });
const genAI = new GoogleGenerativeAI(API_KEY);

// 1. Testa se o link da fonte original esta ativo e respondendo (200/300)
async function testarLinkAtivo(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timer);
    return res.status >= 200 && res.status < 400;
  } catch (err) {
    return false;
  }
}

// 2. Extrai imagem real do site de origem (evita intermediários como Google News)
async function extrairImagemSiteOrigem(url) {
  if (!url || url.includes('news.google.com') || url.includes('google.com')) {
    return null; // Google News não serve imagem da matéria, apenas ícone do app
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();

    const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"'>]+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"'>]+)["']\s+property=["']og:image["']/i);
    if (ogMatch && ogMatch[1]) {
      const img = ogMatch[1].trim();
      if (img.startsWith('http') &&
          !img.includes('googleusercontent.com') &&
          !img.includes('gstatic.com') &&
          !img.includes('google.com') &&
          !img.includes('default') &&
          !img.includes('logo') &&
          !img.includes('avatar') &&
          !img.includes('favicon') &&
          !img.includes('placeholder')) {
        return img;
      }
    }

    const twMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"'>]+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"'>]+)["']\s+name=["']twitter:image["']/i);
    if (twMatch && twMatch[1]) {
      const img = twMatch[1].trim();
      if (img.startsWith('http') &&
          !img.includes('googleusercontent.com') &&
          !img.includes('gstatic.com') &&
          !img.includes('google.com') &&
          !img.includes('default') &&
          !img.includes('logo') &&
          !img.includes('avatar') &&
          !img.includes('favicon') &&
          !img.includes('placeholder')) {
        return img;
      }
    }
    return null;
  } catch (err) {
    clearTimeout(timer);
    return null;
  }
}

// 3. Busca de imagem real contextual com fotos fotográficas de alta resolução
const FOTOS_MOTO_CURADAS = {
  custom: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1200&auto=format&fit=crop&q=80',
  trail: 'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=1200&auto=format&fit=crop&q=80',
  sport: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=1200&auto=format&fit=crop&q=80',
  street: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=1200&auto=format&fit=crop&q=80',
  scooter: 'https://images.unsplash.com/photo-1558981420-87aa9210d992?w=1200&auto=format&fit=crop&q=80'
};

async function buscarImagemPorPalavrasChave(termoBusca) {
  if (!termoBusca) return FOTOS_MOTO_CURADAS.street;

  // 1. Tentar busca no Wikimedia Commons por fotos reais de motos
  const termosTeste = [
    termoBusca.replace(/\b(2025|2026|2027|nova|novo|lancamento|recorde)\b/gi, '').trim(),
    termoBusca.split(' ').slice(0, 2).join(' ')
  ];

  for (const t of termosTeste) {
    if (!t || t.length < 3) continue;
    try {
      const cleanKw = t.replace(/[^a-zA-Z0-9\s]/g, '').trim();
      const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanKw + ' motorcycle')}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url|size|mime&format=json`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'EstradaADoisBot/1.0 (contato@estradaadois.com)' },
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.query?.pages) {
          const pages = Object.values(data.query.pages);
          for (const page of pages) {
            const info = page.imageinfo?.[0];
            if (info && info.mime && info.mime.startsWith('image/jpeg') && info.width >= 600) {
              const urlFoto = info.url;
              if (!urlFoto.includes('logo') && !urlFoto.includes('flag') && !urlFoto.includes('icon')) {
                console.log(`[Imagem] Foto encontrada no Wikimedia Commons para "${t}": ${urlFoto}`);
                return urlFoto;
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn(`[Imagem] Falha na busca Commons para "${t}": ${e.message}`);
    }
  }

  // 2. Classificação contextual por estilo para fotos premium do Unsplash
  const termoLower = termoBusca.toLowerCase();
  if (/\b(custom|classic|meteor|hunter|bullet|interceptor|cruiser|harley|chopper|denver)\b/.test(termoLower)) {
    return FOTOS_MOTO_CURADAS.custom;
  }
  if (/\b(trail|adventure|himalayan|bros|sahara|crosser|lander|tenere|ténéré|gs|tiger|off-road|dakkar|transalp)\b/.test(termoLower)) {
    return FOTOS_MOTO_CURADAS.trail;
  }
  if (/\b(sport|ninja|cbr|zx|r1|r3|r7|r9|panigale|hayabusa|superbike|naked|mt-03|mt-07|mt-09|z900|streetfighter)\b/.test(termoLower)) {
    return FOTOS_MOTO_CURADAS.sport;
  }
  if (/\b(scooter|nmax|pcx|adv|cruisym|burgman|sh150|elite|vespa)\b/.test(termoLower)) {
    return FOTOS_MOTO_CURADAS.scooter;
  }
  return FOTOS_MOTO_CURADAS.street;
}

// 3.1 Baixa, valida resolução e otimiza a imagem localmente (1200x675 cover, WebP)
async function salvarEOtimizarImagemLocal(imageUrl, slug) {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validação estrita de dimensões: descarta ícones e imagens minúsculas (< 400x250)
    const meta = await sharp(buffer).metadata();
    if (!meta.width || meta.width < 400 || !meta.height || meta.height < 250) {
      throw new Error(`Imagem pequena demais (${meta.width}x${meta.height}) - provável ícone ou thumbnail descartado`);
    }

    const imagesDir = path.join(process.cwd(), 'public', 'images', 'blog');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const fileName = `${slug}.webp`;
    const targetPath = path.join(imagesDir, fileName);

    const optimizedBuffer = await sharp(buffer)
      .rotate()
      .resize(1200, 675, { fit: 'cover' })
      .webp({ quality: 80, effort: 4 })
      .toBuffer();

    fs.writeFileSync(targetPath, optimizedBuffer);
    console.log(`🖼️ Imagem baixada e otimizada localmente: /images/blog/${fileName} (${(optimizedBuffer.length / 1024).toFixed(0)} KB)`);
    return `/images/blog/${fileName}`;
  } catch (err) {
    console.warn(`Aviso ao salvar imagem local (${err.message}). Usando fallback de fotografia de moto.`);
    try {
      const fallbackUrl = FOTOS_MOTO_CURADAS.street;
      const res = await fetch(fallbackUrl);
      const buffer = Buffer.from(await res.arrayBuffer());
      const fileName = `${slug}.webp`;
      const targetPath = path.join(process.cwd(), 'public', 'images', 'blog', fileName);
      const optimized = await sharp(buffer)
        .rotate()
        .resize(1200, 675, { fit: 'cover' })
        .webp({ quality: 80, effort: 4 })
        .toBuffer();
      fs.writeFileSync(targetPath, optimized);
      console.log(`🖼️ Imagem curada aplicada: /images/blog/${fileName} (${(optimized.length / 1024).toFixed(0)} KB)`);
      return `/images/blog/${fileName}`;
    } catch (fbErr) {
      return imageUrl;
    }
  }
}

// 4. Envia notificacao instantanea para o Telegram
async function enviarNotificacaoTelegram({ title, excerpt, date, slug, image }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("ℹ️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID nao definidos. Alerta no Telegram ignorado.");
    return;
  }

  const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const mensagem = `📰 <b>NOVO RASCUNHO GERADO PELO ROBÔ!</b>\n\n` +
    `📌 <b>Título:</b>\n${escapeHtml(title)}\n\n` +
    `📂 <b>Categoria:</b> Notícias (⏳ Rascunho)\n` +
    `📅 <b>Data:</b> ${escapeHtml(date)}\n\n` +
    (excerpt ? `📝 <b>Resumo:</b>\n<i>${escapeHtml(excerpt)}</i>\n\n` : '') +
    `🔗 <a href="https://www.estradaadois.com/admin/"><b>Clique aqui para revisar e publicar no Painel</b></a>`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: mensagem,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
      }),
      signal: AbortSignal.timeout(8000)
    });

    const data = await res.json();
    if (data.ok) {
      console.log("✅ Notificação enviada para o Telegram com sucesso!");
    } else {
      console.warn("⚠️ Aviso da API do Telegram:", data.description);
    }
  } catch (err) {
    console.warn("⚠️ Erro ao enviar notificacao para o Telegram:", err.message);
  }
}

// =========================================================================
// GERADOR INTELIGENTE DE SLUGS (SEM CORTAR PALAVRAS, SEM STOPWORDS, TRANSLITERADO)
// =========================================================================

function gerarSlugInteligente(texto, maxLen = 65) {
  if (!texto) return '';

  // 1. TransliteraÃ§Ã£o e remoÃ§Ã£o de acentos/cedilhas (Ã§ -> c, Ã£ -> a, etc.)
  let s = String(texto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  // 2. Se jÃ¡ couber no limite, apenas limpa palavras soltas no fim
  if (s.length <= maxLen) {
    return limparFimSlug(s);
  }

  // 3. Corte respeitando fronteira de palavras (nunca corta uma palavra ao meio)
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
// =========================================================================
// SISTEMA EDITORIAL INTELIGENTE ANTI-DUPLICIDADE DE TEMAS
// =========================================================================

const STOPWORDS_ANTI_DUPLICADOS = new Set([
  'de', 'em', 'no', 'na', 'do', 'da', 'dos', 'das', 'os', 'as', 'ao', 'aos',
  'um', 'uma', 'uns', 'umas', 'para', 'com', 'por', 'pela', 'pelo', 'pelos', 'pelas',
  'sobre', 'entre', 'contra', 'ate', 'atraves', 'que', 'se', 'ja', 'ou', 'so',
  'este', 'esta', 'esse', 'essa', 'estes', 'estas', 'esses', 'essas',
  'seu', 'sua', 'seus', 'suas', 'meu', 'minha', 'nosso', 'nossa',
  'foi', 'sao', 'ser', 'ter', 'tera', 'terao', 'tem', 'temos', 'estao', 'estar',
  'mais', 'menos', 'como', 'quando', 'onde', 'qual', 'quais', 'quem',
  'novo', 'nova', 'novos', 'novas', 'novidade', 'novidades',
  'moto', 'motos', 'motocicleta', 'motocicletas', 'motociclismo', 'brasil',
  'chega', 'chegam', 'ganha', 'ganham', 'revela', 'revelam', 'apresenta', 'apresentam',
  'veja', 'confira', 'conheca', 'saiba', 'tudo', 'detalhes', 'fotos', 'galeria',
  'oficial', 'oficialmente', 'esperar', 'pode', 'anos', 'meses', 'dias'
]);

function extrairTokensAntiDuplicidade(texto) {
  if (!texto) return new Set();
  return new Set(
    texto.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 2 && !STOPWORDS_ANTI_DUPLICADOS.has(w))
  );
}

function carregarTodosPostsExistentes() {
  if (!fs.existsSync(POSTS_DIR)) return [];
  try {
    const files = fs.readdirSync(POSTS_DIR).filter(f => f.endsWith('.md'));
    const posts = [];
    for (const f of files) {
      try {
        const content = fs.readFileSync(path.join(POSTS_DIR, f), 'utf8');
        const titleMatch = content.match(/title:\s*["']?([^"'\r\n]+)["']?/i);
        const dateMatch = content.match(/date:\s*["']?([^"'\r\n]+)["']?/i);
        const title = titleMatch ? titleMatch[1].trim() : '';
        const dateStr = dateMatch ? dateMatch[1].trim() : '';
        const time = dateStr ? new Date(dateStr).getTime() : 0;
        if (title) {
          posts.push({
            slug: f.replace('.md', ''),
            title,
            date: dateStr,
            time,
            tokens: extrairTokensAntiDuplicidade(title)
          });
        }
      } catch (err) {}
    }
    posts.sort((a, b) => b.time - a.time);
    return posts;
  } catch (e) {
    console.warn("Aviso ao carregar posts:", e.message);
    return [];
  }
}

function verificarDuplicidadeTematica(tituloCandidato, todosPosts) {
  const candTokens = Array.from(extrairTokensAntiDuplicidade(tituloCandidato));
  if (candTokens.length === 0) return null;

  for (const post of todosPosts) {
    const overlap = candTokens.filter(t => post.tokens.has(t));
    const unionSize = new Set([...candTokens, ...post.tokens]).size;
    const jaccard = unionSize > 0 ? overlap.length / unionSize : 0;

    if (overlap.length >= 3 || (overlap.length >= 2 && jaccard >= 0.28)) {
      return {
        postExistente: post.title,
        overlap,
        jaccard
      };
    }
  }
  return null;
}

// Triagem editorial com IA: escolhe candidatos estritamente inéditos
async function selecionarCandidatosIneditos(candidatosDisponiveis, postsRecentes, targetCount, genAI) {
  if (!candidatosDisponiveis || candidatosDisponiveis.length === 0) return [];
  if (!postsRecentes || postsRecentes.length === 0) return candidatosDisponiveis.slice(0, targetCount);

  const listaRecentes = postsRecentes.slice(0, 35).map((p, i) => `${i + 1}. "${p.title}"`).join('\n');
  const listaCandidatos = candidatosDisponiveis.slice(0, 10).map((c, i) => `[${i + 1}] "${c.title}"`).join('\n');

  const promptTriagem = `
Voce e o Editor-Chefe do portal de motociclismo "Estrada a Dois".
Abaixo estao as ultimas materias publicadas no portal e a lista de novas noticias candidatas coletadas dos portais do setor.

DIRETRIZES RIGIDAS DE DECISAO EDITORIAL:
1. VARIABILIDADE E INEDITISMO: O leitor nao quer ver materias repetidas sobre o mesmo modelo, lancamento ou evento que ja cobrimos recentemente.
2. SE UM CANDIDATO COBRE O MESMO FATO/MODELO/EVENTO JA PUBLICADO NO BLOG (mesmo que com palavras diferentes de outro portal): REJEITE O CANDIDATO!
3. DIVERSIDADE DE MARCAS: Priorize modelos e marcas que nao foram abordados nos ultimos dias.
4. Se NENHUM candidato for uma novidade real ou todos forem repeticoes de temas ja cobertos, responda ESTRITAMENTE:
SELECAO: NENHUM

MATERIAS RECENTES JA PUBLICADAS NO BLOG:
${listaRecentes}

CANDIDATOS COLETADOS:
${listaCandidatos}

Sua missao: Selecione ate ${targetCount} numero(s) dos candidatos que sao NOTICIAS REALMENTE INEDITAS para o blog.
Responda ESTRITAMENTE no formato:
SELECAO: [numeros separados por virgula, ex: 1, 3] ou SELECAO: NENHUM
`;

  const modelCandidates = [
    'gemini-3.6-flash',
    'gemini-flash-latest'
  ];

  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout triagem')), 12000));
      const res = await Promise.race([model.generateContent(promptTriagem), timeoutPromise]);
      const texto = res.response.text().trim();
      console.log(`[Editor-Chefe IA] Resposta da triagem: ${texto}`);

      if (texto.includes('NENHUM')) {
        console.log(`[Editor-Chefe IA] Todos os candidatos analisados sao repeticoes de temas ja publicados.`);
        return [];
      }

      const match = texto.match(/SELECAO:\s*([0-9,\s]+)/i);
      if (match && match[1]) {
        const indexes = match[1].split(',').map(n => parseInt(n.trim(), 10) - 1).filter(n => !isNaN(n) && n >= 0 && n < candidatosDisponiveis.length);
        if (indexes.length > 0) {
          const selecionados = indexes.slice(0, targetCount).map(idx => candidatosDisponiveis[idx]);
          console.log(`[Editor-Chefe IA] Selecionado(s) ${selecionados.length} candidato(s) inédito(s):`);
          selecionados.forEach(s => console.log(`  - "${s.title}"`));
          return selecionados;
        }
      }
      break;
    } catch (err) {
      console.warn(`Tentativa de triagem com ${modelName} falhou: ${err.message}`);
    }
  }

  // Se a IA respondeu NENHUM ou formato inválido, NÃO force candidatos duplicados
  return [];
}

// 5. Redige e publica o artigo
async function processarItem(item, genAI, isBrazilianSource = true) {
  const initialSlug = gerarSlugInteligente(item.title, 65);
  const now = new Date();
  const today = now.toISOString().slice(0, 19);

  console.log(`\n-----------------------------------------`);
  console.log(`[Origem: ${isBrazilianSource ? '🇧🇷 Brasil (Principal)' : '🌐 Global (Secundário)'}]`);
  console.log(`Processando notícia: "${item.title}"`);
  console.log(`Data original: ${item.pubDate}`);

  let imagemFinal = await extrairImagemSiteOrigem(item.link);

  const prompt = `
  Atue como um redator jornalista automotivo expert do blog "Estrada a Dois".
  O MERCADO PRINCIPAL DO BLOG E O MERCADO BRASILEIRO DE MOTOCICLISMO (lancamentos de motos no Brasil, montadoras nacionais, tecnologia, modelos e novidades de mercado), seguido por lancamentos mundiais de grande impacto.
  
  Aqui esta uma noticia crua:
  Titulo: ${item.title}
  Resumo/Conteudo Original: ${item.contentSnippet || item.content}
  Fonte Original: ${item.source || 'Portal Automotivo'}
  Origem: ${isBrazilianSource ? 'Mercado Brasileiro' : 'Mercado Internacional'}
  
  Sua tarefa:
  1. Identifique a moto, marca ou modelo PRINCIPAL da noticia em 2 ou 3 palavras em ingles/geral (Exemplo: "Honda Sahara 300", "Yamaha MT-09", "Royal Enfield Guerrilla 450", "Triumph Speed 400", "BMW R1300 GS", "CFMoto Brasil").
  2. Redija um artigo jornalistico completo e aprofundado em Portugues do Brasil (pt-BR), focado em SEO, explicando especificacoes, motor, proposta e impacto para o motociclista no mercado brasileiro.
  3. Nao adicione topicos de "viagem" ou "mototurismo", o foco e na MAQUINA, TECNOLOGIA, MERCADO ou INDUSTRIA.
  4. Nao invente fatos, explique os termos tecnicos.
  5. LINKAGEM INTERNA DE SEO (OBRIGATORIO): No final do texto, exatamente antes da linha da "Fonte:", insira SEMPRE um destaque em blockquote com uma recomendacao de leitura interna para o leitor conhecer nossos roteiros reais de viagem (escolha UMA das opcoes abaixo que melhor se contextualizar):
     - > 🏍️ **Leia também:** [De R15 à Serra do Rio do Rastro: Um Sonho em Duas Rodas](/blog/de-r15-a-serra-do-rio-do-rastro-um-sonho-em)
     - > 🏍️ **Veja nosso diário de bordo:** [5 serras e 831 km de moto em um fim de semana](/blog/5-serras-e-831-km-de-moto-em-um-fim-de)
     - > 🏍️ **Confira esse roteiro:** [De R15 para as Cataratas: Roteiro de 2.012 km a Dois](/blog/de-r15-para-as-cataratas-roteiro-de)
     - > 🏍️ **Inspire-se na estrada:** [Rota 513, Letts Road e o Túnel de Bambus de moto](/blog/rota-513-letts-road-e-o-t-nel-de-bambus-um)
     - > 🏍️ **Conheça o casal:** [Sobre o projeto Estrada a Dois e nossas viagens](/sobre)
  6. REGRA RIGIDA DA FONTE: No final do artigo, insira exatamente "Fonte: [Nome do Veiculo/Portal]" em texto puro. NUNCA adicione link markdown nem URLs na fonte! Exemplo correto: "Fonte: Autoesporte" ou "Fonte: Motor1 Brasil".
  
  REGRAS INEGOCIAVEIS DE SEGURANCA E CONTEUDO:
  - REGRA 1 (ANTI-CRIME / SEGURANCA): E TERMINANTEMENTE PROIBIDO gerar materias sobre crimes, acidentes, mortes, colisoes, roubos, furtos, apreensoes policiais, leiloes ou tragedias. Responda APENAS: "IGNORAR_CONTEUDO_INVALIDO".
  - REGRA 2 (ANTI-VENDA): E TERMINANTEMENTE PROIBIDO gerar conteudo de catalogo de compras, links de lojas, precos promocionais, cupons ou chamadas de venda. Responda APENAS: "IGNORAR_CONTEUDO_INVALIDO".
  - REGRA 3 (TEMPO E ATUALIDADE - ULTIMOS 7 DIAS): Esta noticia e recente (ultimos 7 dias). E TERMINANTEMENTE PROIBIDO citar o ano de 2025 ou anos anteriores como lancamentos futuros.
  
  Retorne EXATAMENTE e SOMENTE o codigo Markdown no formato abaixo (ou "IGNORAR_CONTEUDO_INVALIDO" caso infrinja as regras):
  
  ---
  title: "[Seu Titulo SEO Atraente e Jornalistico em pt-BR]"
  slug: "[slug-curto-e-objetivo-focado-na-moto-e-acao-ex-royal-enfield-classic-350-nova-cor-branca]"
  date: "${today}"
  category: "Notícias"
  status: "⏳ Rascunho"
  image: "IMAGE_PLACEHOLDER"
  keywords_image: "[2 a 3 palavras da moto/marca]"
  excerpt: "[Resumo impactante de 2 a 3 linhas]"
  ---
  
  [Seu texto completo em pt-BR aqui, usando ## para subtitulos]
  
  > 🏍️ **Leia também:** [Roteiro Recomendado](/blog/slug-do-roteiro)
  
  Fonte: Nome do Portal em Texto Puro
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
          console.log(`🤖 Solicitando redação ao modelo: ${modelName} (tentativa ${attempt}/3)...`);
          const model = genAI.getGenerativeModel({ model: modelName });
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout de 45s na API do Gemini (${modelName})`)), 45000));
          const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
          markdownContent = result.response.text();
          if (markdownContent) break;
        } catch (err) {
          console.log(`⚠️ Tentativa ${attempt} com ${modelName} falhou: ${err.message}`);
          lastError = err;
          if (err.message && err.message.includes('404')) {
            break;
          }
          const waitTime = attempt * 3000;
          await new Promise(r => setTimeout(r, waitTime));
        }
      }
      if (markdownContent) break;
    }

    if (!markdownContent) {
      throw lastError || new Error("Falha ao gerar conteudo com todos os modelos disponiveis.");
    }

    markdownContent = markdownContent.replace(/^```markdown\n?/m, '').replace(/```$/m, '').trim();

    if (markdownContent.includes('IGNORAR_CONTEUDO_INVALIDO') || markdownContent.includes('IGNORAR_CONTEUDO_COMERCIAL')) {
      console.log(`[Filtro de Seguranca] Gemini descartou conteudo invalido: "${item.title}"`);
      return false;
    }

    const titleMatch = markdownContent.match(/title:\s*["']?([^"'\n\r]+)["']?/i);
    const excerptMatch = markdownContent.match(/excerpt:\s*["']?([^"'\n\r]+)["']?/i);
    const slugMatch = markdownContent.match(/slug:\s*["']?([^"'\n\r]+)["']?/i);
    const kwMatch = markdownContent.match(/keywords_image:\s*["']?([^"'\n\r]+)["']?/i);

    const postTitle = titleMatch ? titleMatch[1].trim() : item.title;
    const postExcerpt = excerptMatch ? excerptMatch[1].trim() : '';
    const termoImagem = kwMatch ? kwMatch[1].trim() : item.title;

    // Determina o slug inteligente: usa o sugerido pelo Gemini ou gera do título SEO final aprovado
    let finalSlug = slugMatch && slugMatch[1].trim() ? gerarSlugInteligente(slugMatch[1].trim(), 65) : '';
    if (!finalSlug || finalSlug.length < 8) {
      finalSlug = gerarSlugInteligente(postTitle, 65) || initialSlug;
    }

    if (!imagemFinal) {
      console.log(`Buscando imagem contextual para: "${termoImagem}"...`);
      imagemFinal = await buscarImagemPorPalavrasChave(termoImagem);
    }

    if (imagemFinal && imagemFinal.startsWith('http')) {
      console.log(`Otimizando imagem para o blog e WhatsApp: ${imagemFinal}`);
      imagemFinal = await salvarEOtimizarImagemLocal(imagemFinal, finalSlug);
    }

    // Limpeza da Fonte e campos temporários do frontmatter
    markdownContent = markdownContent
      .replace('IMAGE_PLACEHOLDER', imagemFinal)
      .replace(/slug:\s*["']?[^"'\n\r]+["']?\r?\n?/i, '')
      .replace(/Fonte:\s*\[([^\]]+)\]\([^)]+\)/gi, 'Fonte: $1')
      .replace(/Fonte:\s*https?:\/\/[^\s\r\n]+/gi, 'Fonte: Portal Noticioso')
      .replace(/keywords_image:\s*["']?[^"'\n\r]+["']?\r?\n?/i, '');

    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }
    const filePath = path.join(POSTS_DIR, `${finalSlug}.md`);
    fs.writeFileSync(filePath, markdownContent, 'utf8');

    console.log(`✅ Artigo rascunho salvo em: ${filePath}`);
    console.log(`🖼️ Imagem vinculada: ${imagemFinal}`);
    console.log(`🔗 Slug final inteligente: ${finalSlug}`);

    await enviarNotificacaoTelegram({
      title: postTitle,
      excerpt: postExcerpt,
      date: today,
      slug: finalSlug,
      image: imagemFinal
    });

    return true;
  } catch (error) {
    console.error("Erro ao gerar artigo com a API:", error);
    return false;
  }
}

function itemValido(item) {
  const fullText = `${item.title} ${item.contentSnippet || ''} ${item.content || ''}`;

  const pubTime = new Date(item.pubDate || item.isoDate).getTime();
  if (isNaN(pubTime)) {
    return false;
  }
  const diffHours = (Date.now() - pubTime) / (1000 * 60 * 60);
  if (diffHours > MAX_AGE_HOURS || diffHours < -2) {
    return false;
  }

  if (/\b(19\d\d|200\d|201\d|202[0-5])\b/.test(item.title)) {
    return false;
  }

  if (/\bvolta\s+ao\s+mundo\b/i.test(item.title)) {
    return false;
  }

  if (!MOTORCYCLE_POSITIVE_REGEX.test(fullText)) {
    return false;
  }

  if (CRIME_POLICE_KEYWORDS_REGEX.test(fullText)) {
    return false;
  }

  if (SALES_TITLE_REGEX.test(fullText)) {
    return false;
  }

  const isSalesDomain = SALES_DOMAINS_AND_KEYWORDS.some(k => item.link.toLowerCase().includes(k.toLowerCase()));
  if (isSalesDomain) {
    return false;
  }

  return true;
}

async function coletarItensQuery(query, isBR = true) {
  const langParams = isBR ? '&hl=pt-BR&gl=BR&ceid=BR:pt-419' : '&hl=en-US&gl=US';
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}${langParams}`;
  try {
    const feed = await parser.parseURL(url);
    return feed.items || [];
  } catch (e) {
    return [];
  }
}

async function gerarNoticias() {
  const targetCount = calcularMetaNoticias();
  const todosPosts = carregarTodosPostsExistentes();

  console.log(`\n======================================================`);
  console.log(`Iniciando Robô Jornalista Estrada a Dois`);
  console.log(`Janela Temporal: Últimos 7 dias`);
  console.log(`Prioridade 1: Mercado Brasileiro (gl=BR, hl=pt-BR)`);
  console.log(`Prioridade 2: Mercado Global (fallback)`);
  console.log(`Meta: ${targetCount} notícia(s)`);
  console.log(`Artigos existentes carregados no controle anti-duplicidade: ${todosPosts.length}`);
  console.log(`======================================================\n`);

  console.log("Coletando notícias dos melhores portais do Brasil...");
  const seenTitles = new Set();
  const rawCandidatosBR = [];

  for (const q of QUERIES_BR) {
    const items = await coletarItensQuery(q, true);
    items.forEach((item, index) => {
      if (seenTitles.has(item.title)) return;
      seenTitles.add(item.title);

      if (itemValido(item)) {
        const dup = verificarDuplicidadeTematica(item.title, todosPosts);
        if (dup) {
          // Descarte silencioso de temas repetidos já abordados no blog
          return;
        }

        let score = 100 - index;
        const fullSource = `${item.source || ''} ${item.title || ''} ${item.link || ''}`.toLowerCase();
        if (TOP_PORTALS.some(p => fullSource.includes(p))) score += 35;
        if (/\b(lancamento|lançamento|nova|novo|novidade|inedita|inédita|chega\s+ao\s+brasil|revelada|apresenta|esgota|recorde|flagrada)\b/i.test(item.title)) score += 25;

        rawCandidatosBR.push({ ...item, isBR: true, score });
      }
    });
  }

  rawCandidatosBR.sort((a, b) => b.score - a.score);

  // Filtrar links ativos e validar slugs
  const candidatosValidos = [];
  for (const item of rawCandidatosBR) {
    if (candidatosValidos.length >= 10) break;

    const initialSlug = gerarSlugInteligente(item.title, 65);
    if (fs.existsSync(path.join(POSTS_DIR, `${initialSlug}.md`))) continue;

    const linkAtivo = await testarLinkAtivo(item.link);
    if (linkAtivo) {
      candidatosValidos.push(item);
    }
  }

  // Fallback complementar com notícias globais caso o mercado brasileiro esteja sem novidades
  if (candidatosValidos.length < targetCount) {
    console.log(`Poucos candidatos no Brasil (${candidatosValidos.length}/${targetCount}). Buscando novidades globais complementares...`);
    let rawItensGlobal = [];
    for (const q of QUERIES_GLOBAL) {
      const items = await coletarItensQuery(q, false);
      rawItensGlobal = rawItensGlobal.concat(items);
    }
    for (const item of rawItensGlobal) {
      if (seenTitles.has(item.title)) continue;
      seenTitles.add(item.title);
      if (itemValido(item)) {
        const dup = verificarDuplicidadeTematica(item.title, todosPosts);
        if (dup) continue;

        const initialSlug = gerarSlugInteligente(item.title, 65);
        if (fs.existsSync(path.join(POSTS_DIR, `${initialSlug}.md`))) continue;
        const linkAtivo = await testarLinkAtivo(item.link);
        if (linkAtivo) {
          candidatosValidos.push({ ...item, isBR: false });
        }
      }
      if (candidatosValidos.length >= 10) break;
    }
  }

  console.log(`Candidatos com links ativos selecionados para triagem: ${candidatosValidos.length}`);

  if (candidatosValidos.length === 0) {
    console.log("ℹ️ Nenhum candidato inédito com link ativo encontrado hoje. Evitando acúmulo de rascunhos duplicados.");
    return;
  }

  // Triagem editorial inteligente com Gemini
  const selecionados = await selecionarCandidatosIneditos(candidatosValidos, todosPosts, targetCount, genAI);

  if (!selecionados || selecionados.length === 0) {
    console.log("ℹ️ Todos os candidatos analisados foram classificados como repetições de temas já abordados.");
    console.log("🛑 Nenhuma matéria duplicada será gerada para não acumular rascunhos no painel.");
    return;
  }

  let geradasCount = 0;

  for (const item of selecionados) {
    if (geradasCount >= targetCount) break;

    console.log(`\n📰 Processando candidato inédito: "${item.title}"...`);
    const sucesso = await processarItem(item, genAI, item.isBR);
    if (sucesso) {
      geradasCount++;
      console.log(`Progresso: ${geradasCount}/${targetCount} notícia(s) gerada(s).`);
      if (geradasCount < targetCount) {
        await new Promise(r => setTimeout(r, 3000));
      }
    } else {
      console.log(`⚠️ Candidato não aprovado ou descartado. Prosseguindo...`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`Processo concluído: ${geradasCount} nova(s) notícia(s) gerada(s).`);
  console.log(`======================================================\n`);
}

gerarNoticias();


