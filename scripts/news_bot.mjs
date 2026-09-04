import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Configurações
const API_KEY = process.env.GEMINI_API_KEY;
// Busca global no Google News focada em motos, lançamentos, equipamentos e tech (exclui viagens)
const RSS_URL = 'https://news.google.com/rss/search?q=(motorcycle+OR+motorcycles+OR+motociclismo)+AND+(launch+OR+gear+OR+brands+OR+models+OR+innovation+OR+technology+OR+parts)+-travel+-viagem&hl=en-US&gl=US';
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const TARGET_COUNT = parseInt(process.env.NEWS_COUNT || '1', 10);

if (!API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não encontrada.");
  process.exit(1);
}

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

async function processarItem(item, model) {
  const tempSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 50);
  const today = new Date().toISOString().split('T')[0];

  console.log(`\n-----------------------------------------`);
  console.log(`Processando notícia: "${item.title}"`);
  console.log(`Data original: ${item.pubDate}`);
  
  // 1. Tentar extrair a imagem do site original
  let imagemFinal = await extrairImagemSiteOrigem(item.link);

  const prompt = `
  Atue como um redator jornalista automotivo expert do blog "Estrada a Dois" (focado no mundo do motociclismo, lançamentos, marcas, modelos e tecnologia).
  
  Aqui está uma notícia crua internacional que acabou de sair:
  Título: ${item.title}
  Resumo/Conteúdo Original: ${item.contentSnippet || item.content}
  Link da fonte: ${item.link}
  
  Sua tarefa:
  1. Identifique a moto, marca ou equipamento PRINCIPAL da notícia em 2 ou 3 palavras em inglês (Exemplo: "KTM 1390 Super Duke", "Royal Enfield Classic 350", "Zero Motorcycles Electric", "Alpinestars Motorcycle Jacket").
  2. Traduza e reescreva a notícia criando um artigo completo e aprofundado em Português do Brasil (pt-BR), focado em SEO.
  Não adicione tópicos de "viagem" ou "mototurismo", o foco é na MÁQUINA, TECNOLOGIA, MERCADO ou EQUIPAMENTO.
  Não invente fatos, explique os termos técnicos.
  
  Retorne EXATAMENTE e SOMENTE o código Markdown no formato abaixo:
  
  ---
  title: "[Seu Título SEO Atraente e Jornalístico em pt-BR]"
  date: "${today}"
  category: "Notícias"
  status: "⏳ Rascunho"
  image: "IMAGE_PLACEHOLDER"
  keywords_image: "[2 a 3 palavras da moto/marca em inglês]"
  excerpt: "[Resumo impactante de 2 a 3 linhas]"
  ---
  
  [Seu texto completo em pt-BR aqui, usando ## para subtítulos. No final, adicione "Fonte: [Nome do Site ou Notícia Original](${item.link})"]
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

async function gerarNoticias() {
  console.log(`Iniciando busca de notícias globais (Meta: ${TARGET_COUNT} notícia(s))...`);
  
  const feed = await parser.parseURL(RSS_URL);
  if (!feed.items || feed.items.length === 0) {
    console.error("Nenhuma notícia encontrada no feed.");
    return;
  }
  
  // Filtra notícias recentes (padrão 36h, ou configurável via MAX_HOURS)
  const maxHoras = parseInt(process.env.MAX_HOURS || '36', 10);
  const janelaTempo = maxHoras * 60 * 60 * 1000;
  const agora = new Date();
  
  let itensCandidatos = feed.items.filter(item => {
    const pubDate = new Date(item.pubDate);
    return (agora - pubDate) <= janelaTempo;
  });

  // Se o filtro estrito tiver menos itens que a meta pedida no teste, usa os mais recentes disponíveis no feed
  if (itensCandidatos.length < TARGET_COUNT) {
    console.log(`Janela de ${maxHoras}h continha apenas ${itensCandidatos.length} notícia(s). Usando os itens mais recentes do feed para atingir a meta de ${TARGET_COUNT}...`);
    itensCandidatos = feed.items;
  }

  if (itensCandidatos.length === 0) {
    console.log("Nenhuma notícia encontrada.");
    return;
  }

  // 2. Aciona o Gemini para reescrever e extrair palavras-chave visuais da matéria
  console.log("Enviando para o Gemini...");
  const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
  let geradasCount = 0;

  for (const item of itensCandidatos) {
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

    const sucesso = await processarItem(item, model);
    if (sucesso) {
      geradasCount++;
    }
  }

  console.log(`\nProcesso concluído: ${geradasCount} nova(s) notícia(s) gerada(s).`);
}

gerarNoticias();
