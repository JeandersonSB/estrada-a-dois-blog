import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Configurações
const API_KEY = process.env.GEMINI_API_KEY;
// Busca global no Google News (em inglês e focada em motos, lançamentos, equipamentos, tech. Exclui viagens)
const RSS_URL = 'https://news.google.com/rss/search?q=(motorcycle+OR+motorcycles+OR+motociclismo)+AND+(launch+OR+gear+OR+brands+OR+models+OR+innovation+OR+technology+OR+parts)+-travel+-viagem&hl=en-US&gl=US';
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

if (!API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não encontrada.");
  process.exit(1);
}

const parser = new Parser();
const genAI = new GoogleGenerativeAI(API_KEY);

async function gerarNoticia() {
  console.log("Iniciando busca de notícias globais...");
  
  // 1. Busca a notícia do RSS
  const feed = await parser.parseURL(RSS_URL);
  if (!feed.items || feed.items.length === 0) {
    console.error("Nenhuma notícia encontrada no feed.");
    return;
  }
  
  // Filtra notícias das últimas 36 horas
  const trintaEseisHoras = 36 * 60 * 60 * 1000;
  const agora = new Date();
  
  const itensRecentes = feed.items.filter(item => {
    const pubDate = new Date(item.pubDate);
    return (agora - pubDate) <= trintaEseisHoras;
  });

  if (itensRecentes.length === 0) {
    console.log("Nenhuma notícia nas últimas 36 horas encontrada.");
    return;
  }
  
  // Pega a primeira notícia mais recente e relevante
  const item = itensRecentes[0];
  console.log(`Notícia base escolhida: ${item.title} (Publicada em: ${item.pubDate})`);
  
  // Verifica se já criamos post sobre isso
  const today = new Date().toISOString().split('T')[0];
  const slugTarget = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 50);
  
  if (fs.existsSync(path.join(POSTS_DIR, `${slugTarget}.md`))) {
    console.log("Notícia já processada anteriormente. Pulando...");
    return;
  }

  // 2. Aciona o Gemini para reescrever
  console.log("Enviando para o Gemini...");
  const model = genAI.getGenerativeModel({ model: "gemini-3.6-flash" });
  
  // Usamos uma imagem aleatória de motos livre de direitos autorais como placeholder temporário
  const imagemGenerica = "https://loremflickr.com/1200/600/motorcycle,gear/all";
  
  const prompt = `
  Atue como um redator jornalista automotivo expert do blog "Estrada a Dois" (focado no mundo do motociclismo, lançamentos, marcas, modelos e tecnologia).
  
  Aqui está uma notícia crua internacional que acabou de sair:
  Título: ${item.title}
  Resumo/Conteúdo Original: ${item.contentSnippet || item.content}
  Link da fonte: ${item.link}
  
  Sua tarefa é traduzir (se necessário) e reescrever essa notícia criando um artigo completo e aprofundado em Português do Brasil (pt-BR), focado em SEO.
  Não adicione tópicos de "viagem" ou "mototurismo", o foco é na MÁQUINA, TECNOLOGIA, MERCADO ou EQUIPAMENTO.
  Não invente fatos, mas explique os termos técnicos.
  
  Retorne EXATAMENTE e SOMENTE o código Markdown abaixo:
  
  ---
  title: "[Seu Título SEO Atraente e Jornalístico em pt-BR]"
  date: "${today}"
  category: "Notícias"
  draft: true
  image: "${imagemGenerica}"
  excerpt: "[Resumo impactante de 2 a 3 linhas]"
  ---
  
  [Seu texto completo em pt-BR aqui, usando ## para subtítulos. No final, adicione "Fonte: [Nome do Site](${item.link})"]
  `;

  try {
    const result = await model.generateContent(prompt);
    let markdownContent = result.response.text();
    
    markdownContent = markdownContent.replace(/^```markdown\n?/m, '').replace(/```$/m, '').trim();

    if (!fs.existsSync(POSTS_DIR)) {
      fs.mkdirSync(POSTS_DIR, { recursive: true });
    }
    const filePath = path.join(POSTS_DIR, `${slugTarget}.md`);
    fs.writeFileSync(filePath, markdownContent, 'utf8');
    
    console.log(`Sucesso! Artigo rascunho salvo em: ${filePath}`);
    
  } catch (error) {
    console.error("Erro ao gerar artigo com a API:", error);
  }
}

gerarNoticia();
