import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Configurações
const API_KEY = process.env.GEMINI_API_KEY;
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const TARGET_COUNT = parseInt(process.env.NEWS_COUNT || '1', 10);

if (!API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não encontrada.");
  process.exit(1);
}

// 1. FEED PRINCIPAL: Mercado Brasileiro (gl=BR, hl=pt-BR) - Janela dos últimos 7 dias
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

// 2. FEED SECUNDÁRIO: Mercado Global (apenas fallback se faltar notícia do Brasil)
const QUERIES_GLOBAL = [
  'motorcycle launch when:7d',
  'motorcycle unveiled when:7d',
  'new motorcycle model when:7d'
];

// LIMITE MÁXIMO DE IDADE DA NOTÍCIA: 7 DIAS (168 HORAS)
const MAX_AGE_HOURS = 168;

// PORTAIS DE REFERÊNCIA PARA PRIORIZAÇÃO DE MELHORES RESULTADOS
const TOP_PORTALS = ['autoesporte', 'motor1', 'webmotors', 'motonline', 'motoo', 'estadao', 'uol', 'cnn', 'r7', 'noticiasautomotivas', 'garagem360', 'motociclismo', 'mobiauto'];

// FILTRO DE SEGURANÇA NACIONAL, POLICIAL E ACIDENTES (AMBOS OS MERCADOS)
const CRIME_POLICE_KEYWORDS_REGEX = /\b(acidente|acidentes|colisão|colisao|batida|morte|mortes|morre|morreu|morto|mortos|fatal|fatídico|ferido|feridos|tiro|tiros|baleado|baleada|assalto|assaltante|assalta|roubo|roubada|roubado|furto|furtam|furtada|apreensão|apreensao|apreendido|apreendida|preso|presos|prisão|prisao|detido|detida|polícia|policia|policial|policiais|criminoso|criminosos|crime|crimes|tráfico|trafico|drogas|suspeito|suspeitos|tragédia|tragedia|homicídio|homicidio|corpo|chacina|atropelado|atropelamento|leilão|leilao|leilões|leiloes|queda|caiu|cai\b|esborracha|capotar|capotamento|letreiro|resgate|vítima|vitima|vítimas|vitimas|perde\s+a\s+vida|amputada|amputado|sangue|feminicídio|feminicidio|arma|cadeira\s+de\s+rodas|bicicleta|ciclista|boko\s+haram|terrorist|terrorism|troops\s+arrest|militant|killed|death|fatal\s+crash|stolen|robbery|suspects?|homicide|thief|thieves|rolezinho|operacao|operação)\b/i;

// FILTRO ANTI-VENDA, GADGETS, CARROS, POLÍTICA E OFF-TOPIC (AMBOS OS MERCADOS)
const SALES_DOMAINS_AND_KEYWORDS = [
  'amazon.', 'ebay.', 'aliexpress.', 'shopee.', 'walmart.', 'bestbuy.', 'target.',
  'mercadolivre.', 'alibaba.', 'etsy.', 'rakuten.', 'wish.', 'shein.', 'temu.',
  'shop.', 'store.', 'deals.', 'coupons.', 'discount.', 'cart.', 'checkout.',
  'umlconnector', 'gearbest', 'banggood',
  'oficinadanet.com.br', 'tudocelular.com', 'tecmundo.com.br', 'canaltech.com.br'
];

const SALES_TITLE_REGEX = /\b(deal|deals|sale|sales|discount|discounts|save\s+\$|save\s+up\s+to|\$\d+|\d+%\s+off|coupon|coupons|buy\s+now|promo|promotion|promotional|best\s+price|cheap|under\s+\$|free\s+shipping|iphone|celular|smartphone|smartwatch|motorola|moto\s+g\d*|moto\s+e\d*|moto\s+edge|moto\s+snaps?|moto\s+360|mounjaro|geladeira|geladeiras|compre\s+já|desconto|liquidação|liquidacao|oferta|ofertas|for\s+sale|clearance|outlet|order\s+now|cashback|wholesale|affiliate|gta\s+online|chevrolet|carro|carros|suv|híbrido|hibrido|picape|caminhão|caminhao|ônibus|onibus|volvo|hyundai|changan|elantra|cs55|ram\s+cresce|nissan|renault|dolphin|s10|m2|m4|i5|vôlei|volei|basquete|dark\s+horse|investigado|candidatura|governo\s+do\s+estado|bolsonaro|lula|congresso\s+de\s+missões|tv\s+brasil|programação\s+semanal|banco|fatura|futebol|chile|ancelotti|willis)\b/i;

// RECONHECIMENTO POSITIVO DE CONTEÚDO DE MOTOCICLISMO
const MOTORCYCLE_POSITIVE_REGEX = /\b(moto|motos|motocicleta|motocicletas|motociclismo|motociclista|motociclistas|scooter|scooters|ciclomotor|honda|yamaha|royal\s+enfield|shineray|bmw\s+motorrad|triumph|kawasaki|suzuki|ducati|bajaj|cfmoto|voge|dafra|harley|kymco|trail|custom|naked|carenada|big\s+trail|pilotagem|duas\s+rodas|piloto|motovelocidade)\b/i;

const parser = new Parser();
const genAI = new GoogleGenerativeAI(API_KEY);

// 1. Testa se o link da fonte original está ativo e respondendo (200/300)
async function testarLinkAtivo(url) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
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
    console.log(`Link inativo ou timeout: ${err.message}`);
    return false;
  }
}

// 2. Tenta extrair a imagem real do site de origem (OpenGraph / Twitter card)
async function extrairImagemSiteOrigem(url) {
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
    
    if (!res.ok) {
      clearTimeout(timer);
      return null;
    }
    const html = await res.text();
    clearTimeout(timer);
    
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
                    html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
                    
    if (ogMatch && ogMatch[1]) {
      let img = ogMatch[1].trim();
      if (img.startsWith('//')) img = 'https:' + img;
      if (img.startsWith('http://') || img.startsWith('https://')) {
        if (!img.includes('googleusercontent.com') && !img.includes('favicon') && !img.includes('logo_small')) {
          console.log(`Imagem original extraída da matéria: ${img}`);
          return img;
        }
      }
    }
  } catch (e) {
    console.log(`Tentativa de extração direta sem sucesso (${e.message})`);
  } finally {
    clearTimeout(timer);
  }
  return null;
}

// 3. Busca imagem específica relacionada pelas palavras-chave do artigo (Wikimedia / Tagged)
async function buscarImagemPorPalavrasChave(termoBusca) {
  if (!termoBusca) return 'https://loremflickr.com/1200/600/motorcycle,superbike/all';
  
  try {
    const cleanKw = termoBusca.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    console.log(`Buscando imagem fotográfica relacionada para: "${cleanKw}"...`);
    
    const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanKw)}&gsrlimit=1&prop=pageimages&piprop=original&format=json`;
    const res = await fetch(url, { headers: { 'User-Agent': 'EstradaADoisBot/1.0' } });
    
    if (res.ok) {
      const data = await res.json();
      if (data?.query?.pages) {
        const pages = Object.values(data.query.pages);
        if (pages.length > 0 && pages[0]?.original?.source) {
          const src = pages[0].original.source;
          if (!src.endsWith('.svg') && !src.endsWith('.gif')) {
            console.log(`Imagem fotográfica encontrada na Wikipedia: ${src}`);
            return src;
          }
        }
      }
    }
  } catch (e) {
    console.log(`Aviso na busca por termo: ${e.message}`);
  }
  
  const tags = encodeURIComponent(termoBusca.toLowerCase().replace(/[^a-z0-9]+/g, ','));
  return `https://loremflickr.com/1200/600/${tags}/all`;
}

// 4. Envia notificação instantânea para o Telegram pessoal
async function enviarNotificacaoTelegram({ title, excerpt, date, slug, image }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("ℹ️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não definidos. Alerta no Telegram ignorado.");
    return;
  }

  const escapeHtml = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const mensagem = `🔔 <b>NOVO RASCUNHO GERADO PELO ROBÔ!</b>\n\n` +
    `📰 <b>Título:</b>\n${escapeHtml(title)}\n\n` +
    `🏷️ <b>Categoria:</b> Notícias (⏳ Rascunho)\n` +
    `📅 <b>Data:</b> ${escapeHtml(date)}\n\n` +
    (excerpt ? `📝 <b>Resumo:</b>\n<i>${escapeHtml(excerpt)}</i>\n\n` : '') +
    `👉 <a href="https://estrada-a-dois-blog.vercel.app/admin/"><b>Clique aqui para revisar e publicar no Painel</b></a>`;

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
    });

    const data = await res.json();
    if (data.ok) {
      console.log("📱 Notificação enviada para o Telegram com sucesso!");
    } else {
      console.warn("⚠️ Aviso da API do Telegram:", data.description);
    }
  } catch (err) {
    console.warn("⚠️ Erro ao enviar notificação para o Telegram:", err.message);
  }
}

async function processarItem(item, genAI, isBrazilianSource = true) {
  const tempSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 50);
  const now = new Date();
  const today = now.toISOString().slice(0, 19);

  console.log(`\n-----------------------------------------`);
  console.log(`[Origem: ${isBrazilianSource ? '🇧🇷 Brasil (Principal)' : '🌐 Global (Secundário)'}]`);
  console.log(`Processando notícia: "${item.title}"`);
  console.log(`Data original: ${item.pubDate}`);
  
  // 1. Tentar extrair a imagem do site original
  let imagemFinal = await extrairImagemSiteOrigem(item.link);

  const prompt = `
  Atue como um redator jornalista automotivo expert do blog "Estrada a Dois".
  O MERCADO PRINCIPAL DO BLOG É O MERCADO BRASILEIRO DE MOTOCICLISMO (lançamentos de motos no Brasil, montadoras nacionais, tecnologia, modelos e novidades de mercado), seguido por lançamentos mundiais de grande impacto.
  
  Aqui está uma notícia crua:
  Título: ${item.title}
  Resumo/Conteúdo Original: ${item.contentSnippet || item.content}
  Link da fonte: ${item.link}
  Origem: ${isBrazilianSource ? 'Mercado Brasileiro' : 'Mercado Internacional'}
  
  Sua tarefa:
  1. Identifique a moto, marca ou modelo PRINCIPAL da notícia em 2 ou 3 palavras em inglês/geral (Exemplo: "Honda Sahara 300", "Yamaha MT-09", "Royal Enfield Guerrilla 450", "Triumph Speed 400", "BMW R1300 GS", "CFMoto Brasil").
  2. Redija um artigo jornalístico completo e aprofundado em Português do Brasil (pt-BR), focado em SEO, explicando especificações, motor, proposta e impacto para o motociclista no mercado brasileiro.
  3. Não adicione tópicos de "viagem" ou "mototurismo", o foco é na MÁQUINA, TECNOLOGIA, MERCADO ou INDÚSTRIA.
  4. Não invente fatos, explique os termos técnicos.
  5. LINKAGEM INTERNA DE SEO (OBRIGATÓRIO): No final do texto, exatamente antes da linha da "Fonte:", insira SEMPRE um destaque em blockquote com uma recomendação de leitura interna para o leitor conhecer nossos roteiros reais de viagem (escolha UMA das opções abaixo que melhor se contextualizar):
     - > 💡 **Leia também:** [De R15 à Serra do Rio do Rastro: Um Sonho em Duas Rodas](/blog/de-r15-a-serra-do-rio-do-rastro-um-sonho-em)
     - > 💡 **Veja nosso diário de bordo:** [5 serras e 831 km de moto em um fim de semana](/blog/5-serras-e-831-km-de-moto-em-um-fim-de)
     - > 💡 **Confira esse roteiro:** [De R15 para as Cataratas: Roteiro de 2.012 km a Dois](/blog/de-r15-para-as-cataratas-roteiro-de)
     - > 💡 **Inspire-se na estrada:** [Rota 513, Letts Road e o Túnel de Bambus de moto](/blog/rota-513-letts-road-e-o-t-nel-de-bambus-um)
     - > 💡 **Conheça o casal:** [Sobre o projeto Estrada a Dois e nossas viagens](/sobre)
  
  REGRAS INEGOCIÁVEIS DE SEGURANÇA E CONTEÚDO:
  - REGRA 1 (ANTI-CRIME / SEGURANÇA): É TERMINANTEMENTE PROIBIDO gerar matérias sobre crimes, acidentes, mortes, colisões, roubos, furtos, apreensões policiais, leilões ou tragédias. Se a notícia for policial ou sobre acidente de trânsito, NÃO gere o artigo. Responda APENAS: "IGNORAR_CONTEUDO_INVALIDO".
  - REGRA 2 (ANTI-VENDA): É TERMINANTEMENTE PROIBIDO gerar conteúdo de catálogo de compras, links de lojas, preços promocionais, cupons ou chamadas de venda ("compre agora", "frete grátis"). Se a notícia for anúncio de e-commerce/produto (ou gadgets como celulares/relógios), NÃO gere o artigo. Responda APENAS: "IGNORAR_CONTEUDO_INVALIDO".
  - REGRA 3 (TEMPO E ATUALIDADE - ÚLTIMOS 7 DIAS): Esta notícia é recente (últimos 7 dias). É TERMINANTEMENTE PROIBIDO citar o ano de 2025 ou anos anteriores como lançamentos futuros. O conteúdo deve ser estritamente atual e condizente com a data da matéria.
  
  Retorne EXATAMENTE e SOMENTE o código Markdown no formato abaixo (ou "IGNORAR_CONTEUDO_INVALIDO" caso infrinja as regras):
  
  ---
  title: "[Seu Título SEO Atraente e Jornalístico em pt-BR]"
  date: "${today}"
  category: "Notícias"
  status: "⏳ Rascunho"
  image: "IMAGE_PLACEHOLDER"
  keywords_image: "[2 a 3 palavras da moto/marca]"
  excerpt: "[Resumo impactante de 2 a 3 linhas]"
  ---
  
  [Seu texto completo em pt-BR aqui, usando ## para subtítulos]

  > 💡 **Leia também:** [Roteiro Recomendado](/blog/slug-do-roteiro)

  Fonte: [Nome do Veículo Original](${item.link})
  `;

  try {
    let markdownContent = null;
    const modelCandidates = ['gemini-flash-latest', 'gemini-3.6-flash'];
    let lastError = null;

    for (const modelName of modelCandidates) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout de 45s na API do Gemini (${modelName})`)), 45000));
        const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
        markdownContent = result.response.text();
        if (markdownContent) break;
      } catch (err) {
        console.log(`Tentativa com ${modelName} falhou (${err.message}).`);
        lastError = err;
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!markdownContent) {
      throw lastError || new Error("Falha ao gerar conteúdo com todos os modelos disponíveis.");
    }
    
    markdownContent = markdownContent.replace(/^```markdown\n?/m, '').replace(/```$/m, '').trim();

    if (markdownContent.includes('IGNORAR_CONTEUDO_INVALIDO') || markdownContent.includes('IGNORAR_CONTEUDO_COMERCIAL')) {
      console.log(`[Filtro de Segurança] Gemini descartou conteúdo inválido: "${item.title}"`);
      return false;
    }

    // Extrair as palavras-chave sugeridas pelo Gemini para a imagem
    const kwMatch = markdownContent.match(/keywords_image:\s*["']?([^"'\n\r]+)["']?/i);
    const termoImagem = kwMatch ? kwMatch[1].trim() : item.title;
    
    if (!imagemFinal) {
      console.log(`Buscando imagem contextual para: "${termoImagem}"...`);
      imagemFinal = await buscarImagemPorPalavrasChave(termoImagem);
    }

    markdownContent = markdownContent
      .replace('IMAGE_PLACEHOLDER', imagemFinal)
      .replace(/keywords_image:\s*["']?[^"'\n\r]+["']?\r?\n?/i, '');

    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }
    const filePath = path.join(POSTS_DIR, `${tempSlug}.md`);
    fs.writeFileSync(filePath, markdownContent, 'utf8');
    
    console.log(`✅ Artigo rascunho salvo em: ${filePath}`);
    console.log(`🖼️ Imagem vinculada: ${imagemFinal}`);

    // Extrair título e resumo para o alerta do Telegram
    const titleMatch = markdownContent.match(/title:\s*["']?([^"'\n\r]+)["']?/i);
    const excerptMatch = markdownContent.match(/excerpt:\s*["']?([^"'\n\r]+)["']?/i);
    const postTitle = titleMatch ? titleMatch[1].trim() : item.title;
    const postExcerpt = excerptMatch ? excerptMatch[1].trim() : '';

    await enviarNotificacaoTelegram({
      title: postTitle,
      excerpt: postExcerpt,
      date: today,
      slug: tempSlug,
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

  // 1. Horário: janela estrita dos últimos 7 dias (168 horas)
  const pubTime = new Date(item.pubDate || item.isoDate).getTime();
  if (isNaN(pubTime)) {
    console.log(`[Filtro 7d] Ignorando (sem data válida): "${item.title}"`);
    return false;
  }
  const diffHours = (Date.now() - pubTime) / (1000 * 60 * 60);
  if (diffHours > MAX_AGE_HOURS || diffHours < -2) {
    console.log(`[Filtro 7d] Ignorando notícia antiga (${(diffHours / 24).toFixed(1)}d): "${item.title}"`);
    return false;
  }

  // 2. Filtro de ano antigo no título (evita notícias requentadas sobre 2025 ou anos anteriores)
  if (/\b(19\d\d|200\d|201\d|202[0-5])\b/.test(item.title)) {
    console.log(`[Filtro Ano Antigo] Ignorando notícia com ano passado no título: "${item.title}"`);
    return false;
  }

  // 3. Ignorar relatos de viagens pessoais
  if (/\bvolta\s+ao\s+mundo\b/i.test(item.title)) {
    return false;
  }

  // 4. Validação positiva: conteúdo DEVE ser expressamente sobre motocicletas
  if (!MOTORCYCLE_POSITIVE_REGEX.test(fullText)) {
    console.log(`[Filtro Temático] Ignorando notícia que não é sobre motocicletas: "${item.title}"`);
    return false;
  }

  // 5. Filtro de Segurança Nacional (Anti-Policial / Acidentes / Crimes)
  if (CRIME_POLICE_KEYWORDS_REGEX.test(fullText)) {
    console.log(`[Filtro Segurança/Polícia] Ignorando: "${item.title}"`);
    return false;
  }

  // 6. Filtro Anti-Venda / E-commerce / Gadgets / Carros / Off-topic
  if (SALES_TITLE_REGEX.test(fullText)) {
    console.log(`[Filtro Anti-Venda/Off-topic] Ignorando: "${item.title}"`);
    return false;
  }

  const isSalesDomain = SALES_DOMAINS_AND_KEYWORDS.some(k => item.link.toLowerCase().includes(k.toLowerCase()));
  if (isSalesDomain) {
    console.log(`[Filtro Anti-Venda] Ignorando link de e-commerce: "${item.link}"`);
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
    console.error(`Erro ao ler feed da query "${query}":`, e.message);
    return [];
  }
}

async function gerarNoticias() {
  console.log(`\n======================================================`);
  console.log(`Iniciando Robô Jornalista Estrada a Dois`);
  console.log(`Janela Temporal: Últimos 7 dias (máxima relevância e melhores buscas)`);
  console.log(`Prioridade 1 Absoluta: Mercado Brasileiro (gl=BR, hl=pt-BR)`);
  console.log(`Prioridade 2: Mercado Global (apenas fallback)`);
  console.log(`Meta: ${TARGET_COUNT} notícia(s)`);
  console.log(`======================================================\n`);

  // 1. Coleta e consolidação de notícias brasileiras
  console.log("Coletando e ranqueando notícias dos melhores portais do Brasil nos últimos 7 dias...");
  const seenTitles = new Set();
  const rawCandidatosBR = [];

  for (const q of QUERIES_BR) {
    const items = await coletarItensQuery(q, true);
    items.forEach((item, index) => {
      if (seenTitles.has(item.title)) return;
      seenTitles.add(item.title);

      if (itemValido(item)) {
        // Cálculo de Score de Relevância
        let score = 100 - index;
        const fullSource = `${item.source || ''} ${item.title || ''} ${item.link || ''}`.toLowerCase();
        if (TOP_PORTALS.some(p => fullSource.includes(p))) score += 35;
        if (/\b(lançamento|lancamento|nova|novo|novidade|inédita|inedita|chega\s+ao\s+brasil|revelada|apresenta|esgota|recorde|flagrada)\b/i.test(item.title)) score += 25;

        // Identificação de Marca
        const textToAnalyze = `${item.title} ${item.contentSnippet || ''}`.toLowerCase();
        let brand = 'Outras';
        if (/honda/i.test(textToAnalyze)) brand = 'Honda';
        else if (/yamaha/i.test(textToAnalyze)) brand = 'Yamaha';
        else if (/royal\s+enfield/i.test(textToAnalyze)) brand = 'Royal Enfield';
        else if (/bmw/i.test(textToAnalyze)) brand = 'BMW';
        else if (/kawasaki/i.test(textToAnalyze)) brand = 'Kawasaki';
        else if (/shineray/i.test(textToAnalyze)) brand = 'Shineray';
        else if (/bajaj/i.test(textToAnalyze)) brand = 'Bajaj';
        else if (/cfmoto/i.test(textToAnalyze)) brand = 'CFMoto';
        else if (/triumph/i.test(textToAnalyze)) brand = 'Triumph';
        else if (/suzuki/i.test(textToAnalyze)) brand = 'Suzuki';
        else if (/dafra/i.test(textToAnalyze)) brand = 'Dafra';
        else if (/aston\s+martin/i.test(textToAnalyze)) brand = 'Aston Martin';

        // Detecção de modelo para evitar artigos duplicados sobre o mesmo assunto
        const modelMatch = textToAnalyze.match(/\b(crosser|twister|himalayan|denver|enduro\s+park|chetak|klx\s*230|m\s*1000|amb\s*002|voge\s*800|hayabusa|sahara|hornet|cb1000|tiger|speed\s+400|scrambler)\b/);
        const modelKey = modelMatch ? modelMatch[1].replace(/\s+/g, '') : null;

        rawCandidatosBR.push({ ...item, isBR: true, score, brand, modelKey });
      }
    });
  }

  // Ordenar decrescente por relevância / melhores buscas
  rawCandidatosBR.sort((a, b) => b.score - a.score);

  // Seleção com diversidade editorial de marcas (máx. 2 por marca e sem repetir modelo)
  const candidatosBR = [];
  const brandCount = {};
  const modelKeysSeen = new Set();

  for (const c of rawCandidatosBR) {
    if (c.modelKey && modelKeysSeen.has(c.modelKey)) continue;
    if ((brandCount[c.brand] || 0) >= 2 && c.brand !== 'Outras') continue;

    brandCount[c.brand] = (brandCount[c.brand] || 0) + 1;
    if (c.modelKey) modelKeysSeen.add(c.modelKey);
    candidatosBR.push(c);
  }

  console.log(`Encontradas ${candidatosBR.length} notícias de alto impacto selecionadas do Brasil.`);

  // 2. Se a meta não for atingida com o Brasil, busca fallback global
  let candidatos = [...candidatosBR];
  if (candidatos.length < TARGET_COUNT) {
    console.log(`Meta não atingida (${candidatos.length}/${TARGET_COUNT}). Buscando notícias globais complementares...`);
    let rawItensGlobal = [];
    for (const q of QUERIES_GLOBAL) {
      const items = await coletarItensQuery(q, false);
      rawItensGlobal = rawItensGlobal.concat(items);
    }
    for (const item of rawItensGlobal) {
      if (seenTitles.has(item.title)) continue;
      seenTitles.add(item.title);
      if (itemValido(item)) {
        candidatos.push({ ...item, isBR: false });
      }
    }
  }

  if (candidatos.length === 0) {
    console.log("Nenhuma notícia qualificada encontrada.");
    return;
  }

  console.log(`Total de candidatos selecionados: ${candidatos.length}. Iniciando geração com Gemini...`);
  let geradasCount = 0;

  for (const item of candidatos) {
    if (geradasCount >= TARGET_COUNT) break;

    const tempSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 50);
    
    if (fs.existsSync(path.join(POSTS_DIR, `${tempSlug}.md`))) {
      continue; // Já processada
    }

    console.log(`Verificando link: ${item.link}`);
    const linkAtivo = await testarLinkAtivo(item.link);
    if (!linkAtivo) {
      console.log(`Link inativo. Pulando para o próximo...`);
      continue;
    }

    const sucesso = await processarItem(item, genAI, item.isBR);
    if (sucesso) {
      geradasCount++;
      console.log(`Progresso: ${geradasCount}/${TARGET_COUNT} notícia(s) gerada(s).`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`Processo concluído: ${geradasCount} nova(s) notícia(s) gerada(s).`);
  console.log(`======================================================\n`);
}

gerarNoticias();
