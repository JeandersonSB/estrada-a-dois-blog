import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import matter from 'gray-matter';
import {
  generateFeedCard,
  generateStoryCard,
  generateSocialCaption,
  getCategoryConfig
} from './social_card_generator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const postsDir = path.join(rootDir, 'content', 'posts');
const historyFile = path.join(rootDir, '.social_history.json');

// 1. Carrega histórico de posts já divulgados
function loadHistory() {
  if (fs.existsSync(historyFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }
  return [];
}

function saveHistory(history) {
  fs.writeFileSync(historyFile, JSON.stringify(history, null, 2), 'utf8');
}

// 2. Envio para Telegram (Album com Feed + Story + Legenda)
async function sendToTelegram({ title, category, slug, feedBuffer, storyBuffer, captionText }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log('ℹ️ TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não definidos. Envio ignorado.');
    return false;
  }

  console.log(`📤 Enviando cards e legenda para o Telegram [${slug}]...`);

  try {
    // 1º Envio: Álbum com as duas imagens em alta resolução
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('media', JSON.stringify([
      {
        type: 'photo',
        media: 'attach://feed',
        caption: `📱 <b>CARD FEED (4:5)</b> • ${category.toUpperCase()}`,
        parse_mode: 'HTML'
      },
      {
        type: 'photo',
        media: 'attach://story',
        caption: `📲 <b>CARD STORY / TIKTOK (9:16)</b> • ${category.toUpperCase()}`,
        parse_mode: 'HTML'
      }
    ]));
    formData.append('feed', new Blob([feedBuffer], { type: 'image/png' }), `${slug}-feed.png`);
    formData.append('story', new Blob([storyBuffer], { type: 'image/png' }), `${slug}-story.png`);

    const resAlbum = await fetch(`https://api.telegram.org/bot${token}/sendMediaGroup`, {
      method: 'POST',
      body: formData
    });

    const albumData = await resAlbum.json();
    if (!albumData.ok) {
      console.warn('⚠️ Erro ao enviar álbum de fotos:', albumData.description);
    } else {
      console.log('✅ Álbum de fotos enviado com sucesso!');
    }

    // 2º Envio: Mensagem separada com a legenda pronta para copiar no celular
    const resMsg = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: `✍️ <b>LEGENDA PRONTA PARA O INSTAGRAM / TIKTOK:</b>\n<i>(Toque para copiar)</i>\n\n<code>${captionText}</code>`,
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    const msgData = await resMsg.json();
    if (msgData.ok) {
      console.log('✅ Legenda de texto enviada com sucesso!');
      return true;
    } else {
      console.warn('⚠️ Erro ao enviar legenda:', msgData.description);
      return false;
    }
  } catch (err) {
    console.error('❌ Falha na conexão com Telegram:', err.message);
    return false;
  }
}

// 3. Processamento Principal
async function main() {
  const args = process.argv.slice(2);
  const targetSlugArg = args.find((a) => a.startsWith('--slug='))?.replace('--slug=', '');
  const force = args.includes('--force');
  const sampleArg = args.find((a) => a.startsWith('--sample'));
  const isSample = Boolean(sampleArg);
  const sampleCount = isSample ? parseInt(sampleArg.split('=')[1] || '2', 10) : 0;

  const history = loadHistory();
  const files = fs.readdirSync(postsDir).filter((f) => f.endsWith('.md'));

  let publishedPosts = [];

  if (isSample) {
    // Modo Amostra: Seleciona os N últimos de cada categoria
    const byCategory = {};
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const { data } = matter(content);

      if (String(data.status || '').includes('Publicado')) {
        const cat = (data.category || 'Notícias').trim();
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push({ slug, ...data });
      }
    }

    for (const cat of Object.keys(byCategory)) {
      byCategory[cat].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
      publishedPosts.push(...byCategory[cat].slice(0, sampleCount));
    }
    console.log(`📦 Modo Amostra ativo: selecionados ${publishedPosts.length} posts (${sampleCount} de cada categoria).`);
  } else {
    for (const file of files) {
      const slug = file.replace(/\.md$/, '');
      const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
      const { data } = matter(content);

      const isPublished = String(data.status || '').includes('Publicado');

      if (targetSlugArg) {
        if (slug === targetSlugArg) {
          publishedPosts.push({ slug, ...data });
        }
      } else if (isPublished) {
        if (force || !history.includes(slug)) {
          publishedPosts.push({ slug, ...data });
        }
      }
    }
  }

  if (publishedPosts.length === 0) {
    console.log('✨ Nenhum artigo publicado novo aguardando geração de cards sociais.');
    return;
  }

  console.log(`🚀 Processando ${publishedPosts.length} post(s) para redes sociais...`);

  for (const post of publishedPosts) {
    console.log(`\n🎨 Criando cards para: "${post.title}" [${post.category}]...`);

    const feedBuffer = await generateFeedCard({
      title: post.title,
      category: post.category,
      imagePath: post.image,
      excerpt: post.excerpt,
      date: post.date ? String(post.date).slice(0, 10) : 'Hoje'
    });

    const storyBuffer = await generateStoryCard({
      title: post.title,
      category: post.category,
      imagePath: post.image,
      excerpt: post.excerpt,
      date: post.date ? String(post.date).slice(0, 10) : 'Hoje'
    });

    const caption = generateSocialCaption({
      title: post.title,
      category: post.category,
      excerpt: post.excerpt,
      slug: post.slug
    });

    // Envia ao Telegram se configurado
    await sendToTelegram({
      title: post.title,
      category: post.category,
      slug: post.slug,
      feedBuffer,
      storyBuffer,
      captionText: caption
    });

    // Registra no histórico para não reenviar (se não for modo amostra)
    if (!isSample && !history.includes(post.slug)) {
      history.push(post.slug);
    }

    // Pausa de 2 segundos entre envios para o Telegram processar perfeitamente
    await new Promise((r) => setTimeout(r, 2000));
  }

  if (!isSample) {
    saveHistory(history);
  }
  console.log('\n🎉 Todos os cards sociais foram processados com sucesso!');
}

main().catch((err) => {
  console.error('❌ Erro fatal no social_bot:', err);
  process.exit(1);
});
