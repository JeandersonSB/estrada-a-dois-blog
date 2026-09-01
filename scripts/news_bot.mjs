import Parser from 'rss-parser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Configurações
const API_KEY = process.env.GEMINI_API_KEY;
const RSS_URL = 'https://news.google.com/rss/search?q=motociclismo+OR+moto+viagem&hl=pt-BR&gl=BR&ceid=BR:pt-419';
const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');

if (!API_KEY) {
  console.error("ERRO: GEMINI_API_KEY não encontrada.");
  process.exit(1);
}

const parser = new Parser();
const genAI = new GoogleGenerativeAI(API_KEY);

async function gerarNoticia() {
  console.log("Iniciando busca de notícias...");
  
  // 1. Busca a notícia do RSS
  const feed = await parser.parseURL(RSS_URL);
  if (!feed.items || feed.items.length === 0) {
    console.error("Nenhuma notícia encontrada no feed.");
    return;
  }
  
  // Pega a primeira notícia
  const item = feed.items[0];
  console.log(`Notícia base escolhida: ${item.title}`);
  
  // Verifica se já criamos post sobre isso hoje para evitar repetição (simplificado checando data atual)
  const today = new Date().toISOString().split('T')[0];
  const slugTarget = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 50);
  
  if (fs.existsSync(path.join(POSTS_DIR, `${slugTarget}.md`))) {
    console.log("Notícia já processada anteriormente. Pulando...");
    return;
  }

  // 2. Aciona o Gemini para reescrever
  console.log("Enviando para o Gemini Pro...");
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });
  
  const prompt = `
  Atue como um redator jornalista do blog "Estrada a Dois" (focado em mototurismo, motociclismo, rotas e estilo de vida).
  
  Aqui está uma notícia crua que acabou de sair:
  Título: ${item.title}
  Link da fonte: ${item.link}
  
  Sua tarefa é reescrever essa notícia criando um artigo incrível, focado em SEO, com tom empolgante para apaixonados por motos.
  Não invente fatos, apenas reescreva com autoridade e adicione contexto relevante.
  
  Retorne EXATAMENTE e SOMENTE o código Markdown abaixo, preenchendo os dados (na linguagem pt-BR). 
  Não adicione as aspas de bloco de código (\`\`\`).
  
  ---
  title: "[Seu Título SEO Atraente Aqui]"
  date: "${today}"
  category: "Notícias"
  draft: true
  image: "/images/blog/preview-estrada.jpg"
  excerpt: "[Resumo de 2 linhas chamativo para a capa]"
  ---
  
  [Seu texto completo aqui, usando ## para subtítulos e listas quando aplicável. No final, adicione uma linha sutil referenciando a fonte original através de um link.]
  `;

  try {
    const result = await model.generateContent(prompt);
    let markdownContent = result.response.text();
    
    // Limpeza caso o modelo retorne com as tags markdown
    markdownContent = markdownContent.replace(/^```markdown\n?/m, '').replace(/```$/m, '').trim();

    // 3. Salvar o arquivo
    const filePath = path.join(POSTS_DIR, `${slugTarget}.md`);
    fs.writeFileSync(filePath, markdownContent, 'utf8');
    
    console.log(`Sucesso! Artigo rascunho salvo em: ${filePath}`);
    
  } catch (error) {
    console.error("Erro ao gerar artigo com a API:", error);
  }
}

gerarNoticia();
