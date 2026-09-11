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
// Foco total em lançamentos, novos modelos e novidades de montadoras no Brasil
const RSS_URL_BR = 'https://news.google.com/rss/search?q=(moto+OR+motos+OR+motociclismo+OR+motocicleta)+AND+(lan%C3%A7amento+OR+lan%C3%A7a+OR+lan%C3%A7ou+OR+chega+ao+brasil+OR+novo+modelo+OR+nova+linha+OR+montadora+OR+tecnologia)+-acidente+-acidentes+-colisao+-batida+-morte+-morre+-morreu+-morto+-mortos+-fatal+-ferido+-feridos+-tiro+-tiros+-baleado+-assalto+-roubo+-furto+-apreensao+-preso+-policia+-policial+-crime+-trafico+-tragedia+-viagem+-passeio+-dicas+-deal+-desconto+-promocao+-cupom+-preco+-comprar+-loja&hl=pt-BR&gl=BR&ceid=BR:pt-419';

// 2. FEED SECUNDÁRIO: Mercado Global (apenas como fallback se não houver matéria nacional no período)
const RSS_URL_GLOBAL = 'https://news.google.com/rss/search?q=(motorcycle+OR+motorcycles+OR+motociclismo)+AND+(launch+OR+unveil+OR+unveiled+OR+reveal+OR+revealed+OR+debut+OR+concept+OR+manufacturer+OR+technology)+-crash+-accident+-fatal+-killed+-death+-dies+-dead+-shooting+-shot+-arrest+-police+-crime+-boko+-terrorist+-theft+-stolen+-robbery+-drug+-deal+-deals+-sale+-sales+-discount+-price+-buy+-shop+-store+-coupon+-promo+-wholesale+-amazon+-aliexpress+-ebay+-shopee+-walmart&hl=en-US&gl=US';

// FILTRO DE SEGURANÇA NACIONAL E POLICIAL (AMBOS OS MERCADOS)
// Impede acidentes, mortes, crimes, apreensões, assaltos e tragédias
const CRIME_POLICE_KEYWORDS_REGEX = /\b(acidente|acidentes|colisão|colisao|batida|morte|mortes|morre|morreu|morto|mortos|fatal|fatídico|ferido|feridos|tiro|tiros|baleado|baleada|assalto|assaltante|roubo|roubada|roubado|furto|furtada|apreensão|apreensao|apreendido|apreendida|preso|presos|prisão|prisao|polícia|policia|policial|policiais|criminoso|criminosos|crime|crimes|tráfico|trafico|drogas|suspeito|suspeitos|tragédia|tragedia|homicídio|homicidio|corpo|chacina|atropelado|atropelamento|boko\s+haram|terrorist|terrorism|troops\s+arrest|militant|killed|death|fatal\s+crash|stolen|robbery|suspects?|homicide)\b/i;

// FILTRO ANTI-VENDA E ANTI-ECOMMERCE (AMBOS OS MERCADOS)
const SALES_DOMAINS_AND_KEYWORDS = [
  'amazon.', 'ebay.', 'aliexpress.', 'shopee.', 'walmart.', 'bestbuy.', 'target.',
  'mercadolivre.', 'alibaba.', 'etsy.', 'rakuten.', 'wish.', 'shein.', 'temu.',
  'shop.', 'store.', 'deals.', 'coupons.', 'discount.', 'cart.', 'checkout.',
  'umlconnector', 'gearbest', 'banggood'
];

const SALES_TITLE_REGEX = /\b(deal|deals|sale|sales|discount|discounts|save\s+\$|save\s+up\s+to|\$\d+|\d+%\s+off|coupon|coupons|buy\s+now|promo|promotion|promotional|best\s+price|cheap|under\s+\$|free\s+shipping|size\s+\d+|helmet\s+with|for\s+sale|clearance|outlet|order\s+now|cashback|wholesale|affiliate|compre\s+já|desconto|liquidação|liquidacao|oferta|ofertas)\b/i;

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
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
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
    console.log(`Tentativa de extração direta sem sucesso: ${e.message}`);
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
  O MERCADO PRINCIPAL DO BLOG É O MERCADO BRASILEIRO DE MOTOCICLISMO (lançamentos de motos no Brasil, montadoras nacionais, tecnologia e novidades de mercado), seguido por lançamentos mundiais de grande impacto.
  
  Aqui está uma notícia crua:
  Título: ${item.title}
  Resumo/Conteúdo Original: ${item.contentSnippet || item.content}
  Link da fonte: ${item.link}
  Origem: ${isBrazilianSource ? 'Mercado Brasileiro' : 'Mercado Internacional'}
  
  Sua tarefa:
  1. Identifique a moto, marca ou modelo PRINCIPAL da notícia em 2 ou 3 palavras em inglês/geral (Exemplo: "Honda Sahara 300", "Yamaha MT-09", "Royal Enfield Guerrilla 450", "Triumph Speed 400", "BMW R1300 GS").
  2. Redija um artigo jornalístico completo e aprofundado em Português do Brasil (pt-BR), focado em SEO, explicando especificações, motor, proposta e impacto para o motociclista.
  3. Não adicione tópicos de "viagem" ou "mototurismo", o foco é na MÁQUINA, TECNOLOGIA, MERCADO ou INDÚSTRIA.
  4. Não invente fatos, explique os termos técnicos.
  
  REGRAS INEGOCIÁVEIS DE SEGURANÇA E CONTEÚDO:
  - REGRA 1 (ANTI-CRIME / SEGURANÇA): É TERMINANTEMENTE PROIBIDO gerar matérias sobre crimes, acidentes, mortes, colisões, roubos, furtos, apreensões policiais ou tragédias. Se a notícia for policial ou sobre acidente de trânsito, NÃO gere o artigo. Responda APENAS: "IGNORAR_CONTEUDO_INVALIDO".
  - REGRA 2 (ANTI-VENDA): É TERMINANTEMENTE PROIBIDO gerar conteúdo de catálogo de compras, links de lojas, preços promocionais, cupons ou chamadas de venda ("compre agora", "frete grátis"). Se a notícia for anúncio de e-commerce/produto, NÃO gere o artigo. Responda APENAS: "IGNORAR_CONTEUDO_INVALIDO".
  
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
        const result = await model.generateContent(prompt);
        markdownContent = result.response.text();
        break;
      } catch (err) {
        console.log(`Tentativa ${tentativa}/4 falhou (${err.message}). Aguardando 4s...`);
        if (tentativa === 4) throw err;
        await new Promise(r => setTimeout(r, 4000));
      }
    }
    
    markdownContent = markdownContent.replace(/^```markdown\n?/m, '').replace(/```$/m, '').trim();

    if (markdownContent.includes('IGNORAR_CONTEUDO_INVALIDO') || markdownContent.includes('IGNORAR_CONTEUDO_COMERCIAL')) {
      console.log(`[Filtro de Segurança] Gemini descartou conteúdo inválido (policial, acidente ou venda): "${item.title}"`);
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

async function coletarItens(url, maxHoras) {
  try {
    const feed = await parser.parseURL(url);
    if (!feed.items || feed.items.length === 0) return [];

    const janelaTempo = maxHoras * 60 * 60 * 1000;
    const agora = new Date();

    const itensFiltrados = feed.items.filter(item => {
      const pubDate = new Date(item.pubDate);
      return (agora - pubDate) <= janelaTempo;
    });

    return itensFiltrados.length > 0 ? itensFiltrados : feed.items;
  } catch (e) {
    console.error(`Erro ao ler feed RSS (${url}):`, e.message);
    return [];
  }
}

function itemValido(item) {
  const fullText = `${item.title} ${item.contentSnippet || ''} ${item.content || ''}`;

  // 1. Filtro de Segurança Nacional (Anti-Policial / Acidentes / Crimes)
  if (CRIME_POLICE_KEYWORDS_REGEX.test(fullText)) {
    console.log(`[Filtro Segurança/Polícia] Ignorando notícia policial/acidente: "${item.title}"`);
    return false;
  }

  // 2. Filtro Anti-Venda / E-commerce
  if (SALES_TITLE_REGEX.test(item.title)) {
    console.log(`[Filtro Anti-Venda] Ignorando produto comercial: "${item.title}"`);
    return false;
  }

  const isSalesDomain = SALES_DOMAINS_AND_KEYWORDS.some(k => item.link.toLowerCase().includes(k.toLowerCase()));
  if (isSalesDomain) {
    console.log(`[Filtro Anti-Venda] Ignorando link de e-commerce: "${item.link}"`);
    return false;
  }

  return true;
}

async function gerarNoticias() {
  console.log(`\n======================================================`);
  console.log(`Iniciando Robô Jornalista Estrada a Dois`);
  console.log(`Prioridade 1: Mercado Brasileiro (gl=BR, hl=pt-BR)`);
  console.log(`Prioridade 2: Mercado Global (apenas fallback)`);
  console.log(`Meta: ${TARGET_COUNT} notícia(s)`);
  console.log(`======================================================\n`);

  const maxHoras = parseInt(process.env.MAX_HOURS || '36', 10);
  
  // 1. Busca primeiro no mercado brasileiro (Prioridade Máxima)
  console.log("Coletando notícias do mercado brasileiro...");
  const itensBR = await coletarItens(RSS_URL_BR, maxHoras);
  const candidatosBR = itensBR.filter(itemValido).map(item => ({ ...item, isBR: true }));

  console.log(`Encontradas ${candidatosBR.length} notícias válidas do Brasil.`);

  // 2. Se a meta não for atingida só com o Brasil, busca notícias globais como fallback
  let candidatos = [...candidatosBR];
  if (candidatos.length < TARGET_COUNT) {
    console.log("Buscando notícias globais complementares...");
    const itensGlobal = await coletarItens(RSS_URL_GLOBAL, maxHoras);
    const candidatosGlobal = itensGlobal.filter(itemValido).map(item => ({ ...item, isBR: false }));
    console.log(`Encontradas ${candidatosGlobal.length} notícias válidas globais.`);
    candidatos = [...candidatos, ...candidatosGlobal];
  }

  if (candidatos.length === 0) {
    console.log("Nenhuma notícia qualificada encontrada nos filtros.");
    return;
  }

  console.log("\nEnviando para o Gemini...");
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
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
    }
  }

  console.log(`\nProcesso concluído: ${geradasCount} nova(s) notícia(s) gerada(s).`);
}

gerarNoticias();
