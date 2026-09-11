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

// 1. FEED PRINCIPAL: Mercado Brasileiro (gl=BR, hl=pt-BR)
// Consultas diretas e eficazes que trazem os portais e lançamentos do Brasil
const QUERIES_BR = [
  'motos lancamento',
  'motos brasil lancamento',
  'motociclismo brasil',
  'honda motos brasil',
  'yamaha motos brasil',
  'royal enfield brasil'
];

// 2. FEED SECUNDÁRIO: Mercado Global (apenas fallback se faltar notícia do Brasil)
const QUERIES_GLOBAL = [
  'motorcycle launch',
  'motorcycle unveiled',
  'new motorcycle model'
];

// FILTRO DE SEGURANÇA NACIONAL E POLICIAL (AMBOS OS MERCADOS)
const CRIME_POLICE_KEYWORDS_REGEX = /\b(acidente|acidentes|colisão|colisao|batida|morte|mortes|morre|morreu|morto|mortos|fatal|fatídico|ferido|feridos|tiro|tiros|baleado|baleada|assalto|assaltante|roubo|roubada|roubado|furto|furtada|apreensão|apreensao|apreendido|apreendida|preso|presos|prisão|prisao|polícia|policia|policial|policiais|criminoso|criminosos|crime|crimes|tráfico|trafico|drogas|suspeito|suspeitos|tragédia|tragedia|homicídio|homicidio|corpo|chacina|atropelado|atropelamento|leilão|leilao|leilões|leiloes|boko\s+haram|terrorist|terrorism|troops\s+arrest|militant|killed|death|fatal\s+crash|stolen|robbery|suspects?|homicide|thief|thieves)\b/i;

// FILTRO ANTI-VENDA E ANTI-ECOMMERCE (AMBOS OS MERCADOS)
const SALES_DOMAINS_AND_KEYWORDS = [
  'amazon.', 'ebay.', 'aliexpress.', 'shopee.', 'walmart.', 'bestbuy.', 'target.',
  'mercadolivre.', 'alibaba.', 'etsy.', 'rakuten.', 'wish.', 'shein.', 'temu.',
  'shop.', 'store.', 'deals.', 'coupons.', 'discount.', 'cart.', 'checkout.',
  'umlconnector', 'gearbest', 'banggood'
];

const SALES_TITLE_REGEX = /\b(deal|deals|sale|sales|discount|discounts|save\s+\$|save\s+up\s+to|\$\d+|\d+%\s+off|coupon|coupons|buy\s+now|promo|promotion|promotional|best\s+price|cheap|under\s+\$|free\s+shipping|iphone|celular|smartphone|smartwatch|moto\s+360|motorola|mounjaro|geladeira|geladeiras|compre\s+já|desconto|liquidação|liquidacao|oferta|ofertas|for\s+sale|clearance|outlet|order\s+now|cashback|wholesale|affiliate)\b/i;

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

async function processarItem(item, model, isBrazilianSource = true) {
  const tempSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 50);
  const today = new Date().toISOString().split('T')[0];

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
  
  REGRAS INEGOCIÁVEIS DE SEGURANÇA E CONTEÚDO:
  - REGRA 1 (ANTI-CRIME / SEGURANÇA): É TERMINANTEMENTE PROIBIDO gerar matérias sobre crimes, acidentes, mortes, colisões, roubos, furtos, apreensões policiais, leilões ou tragédias. Se a notícia for policial ou sobre acidente de trânsito, NÃO gere o artigo. Responda APENAS: "IGNORAR_CONTEUDO_INVALIDO".
  - REGRA 2 (ANTI-VENDA): É TERMINANTEMENTE PROIBIDO gerar conteúdo de catálogo de compras, links de lojas, preços promocionais, cupons ou chamadas de venda ("compre agora", "frete grátis"). Se a notícia for anúncio de e-commerce/produto (ou gadgets como celulares/relógios), NÃO gere o artigo. Responda APENAS: "IGNORAR_CONTEUDO_INVALIDO".
  
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
  
  [Seu texto completo em pt-BR aqui, usando ## para subtítulos. No final, adicione "Fonte: [Nome do Veículo Original](${item.link})"]
  `;

  try {
    let markdownContent = null;
    for (let tentativa = 1; tentativa <= 4; tentativa++) {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 45s na API do Gemini')), 45000));
        const result = await Promise.race([model.generateContent(prompt), timeoutPromise]);
        markdownContent = result.response.text();
        break;
      } catch (err) {
        console.log(`Tentativa ${tentativa}/4 falhou (${err.message}). Aguardando 3s...`);
        if (tentativa === 4) throw err;
        await new Promise(r => setTimeout(r, 3000));
      }
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
    return true;
  } catch (error) {
    console.error("Erro ao gerar artigo com a API:", error);
    return false;
  }
}

function itemValido(item) {
  const fullText = `${item.title} ${item.contentSnippet || ''} ${item.content || ''}`;

  // 1. Filtro de Segurança Nacional (Anti-Policial / Acidentes / Crimes)
  if (CRIME_POLICE_KEYWORDS_REGEX.test(fullText)) {
    console.log(`[Filtro Segurança/Polícia] Ignorando: "${item.title}"`);
    return false;
  }

  // 2. Filtro Anti-Venda / E-commerce / Gadgets
  if (SALES_TITLE_REGEX.test(fullText)) {
    console.log(`[Filtro Anti-Venda] Ignorando produto comercial/gadget: "${item.title}"`);
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
  console.log(`Prioridade 1 Absoluta: Mercado Brasileiro (gl=BR, hl=pt-BR)`);
  console.log(`Prioridade 2: Mercado Global (apenas fallback)`);
  console.log(`Meta: ${TARGET_COUNT} notícia(s)`);
  console.log(`======================================================\n`);

  // 1. Coleta e consolidação de notícias brasileiras
  console.log("Coletando notícias de múltiplos termos do mercado brasileiro...");
  let rawItensBR = [];
  for (const q of QUERIES_BR) {
    const items = await coletarItensQuery(q, true);
    rawItensBR = rawItensBR.concat(items);
  }

  // Deduplicação por título
  const seenTitles = new Set();
  const candidatosBR = [];
  for (const item of rawItensBR) {
    if (seenTitles.has(item.title)) continue;
    seenTitles.add(item.title);
    if (itemValido(item)) {
      candidatosBR.push({ ...item, isBR: true });
    }
  }

  console.log(`Encontradas ${candidatosBR.length} notícias válidas e filtradas do Brasil.`);

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
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
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

    const sucesso = await processarItem(item, model, item.isBR);
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
