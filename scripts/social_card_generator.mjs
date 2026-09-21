import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Registra a fonte oficial da marca se existir
try {
  const fontPath = path.join(rootDir, 'app', 'fonts', 'Quera.woff2');
  if (fs.existsSync(fontPath)) {
    GlobalFonts.registerFromPath(fontPath, 'Quera');
  }
} catch (err) {
  console.warn('Fonte Quera não registrada, usando fallback nativo:', err.message);
}

// 2. Estilos e Metadados por Categoria
export const CATEGORY_STYLES = {
  noticias: {
    name: 'Notícias',
    badge: 'NOTÍCIA EXCLUSIVA',
    color: '#B6D200',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#motociclismo', '#noticiasdemoto', '#motosbrasil', '#duasrodas', '#estradaadois']
  },
  roteiros: {
    name: 'Roteiros',
    badge: 'ROTEIRO DE ESTRADA',
    color: '#F59E0B',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#mototurismo', '#viagemdemoto', '#roteirodemoto', '#estradaadois', '#viagemdecasal']
  },
  dicas: {
    name: 'Dicas',
    badge: 'DICA DE PILOTAGEM',
    color: '#06B6D4',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#dicasdemoto', '#pilotagemsegura', '#motociclista', '#segurancaemduasrodas', '#estradaadois']
  },
  equipamentos: {
    name: 'Equipamentos',
    badge: 'GUIA DE EQUIPAMENTOS',
    color: '#EC4899',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#equipamentodemoto', '#capacetes', '#intercomunicador', '#motosbrasil', '#estradaadois']
  },
  manutencao: {
    name: 'Manutenção',
    badge: 'MANUTENÇÃO PRÁTICA',
    color: '#84CC16',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#mecanicademoto', '#manutencaodemoto', '#oficinademoto', '#estradaadois', '#duasrodas']
  }
};

export function getCategoryConfig(categoryName = '') {
  const normalized = String(categoryName || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  return CATEGORY_STYLES[normalized] || CATEGORY_STYLES.noticias;
}

// 3. Helper para quebra inteligente de linha de texto
function wrapText(ctx, text, maxWidth, maxLines = 3) {
  const words = String(text || '').trim().split(/\s+/);
  const lines = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      if (lines.length === maxLines - 1) {
        // Na última linha, agrupa as palavras restantes
        const remainingWords = words.slice(i).join(' ');
        let lastLine = remainingWords;
        while (ctx.measureText(`${lastLine}...`).width > maxWidth && lastLine.includes(' ')) {
          lastLine = lastLine.substring(0, lastLine.lastIndexOf(' '));
        }
        lines.push(`${lastLine}...`);
        return lines;
      }
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  }

  return lines;
}

// 4. Helper para carregar imagens com fallback
async function resolveImage(imageInput) {
  if (!imageInput) {
    // Imagem padrão
    const defaultImgPath = path.join(rootDir, 'public', 'images', 'logo-admin.png');
    return await loadImage(defaultImgPath);
  }

  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const res = await fetch(imageInput);
      const arrayBuffer = await res.arrayBuffer();
      return await loadImage(Buffer.from(arrayBuffer));
    }

    // Caminho local
    const localPath = imageInput.startsWith('/')
      ? path.join(rootDir, 'public', imageInput.replace(/^\//, ''))
      : path.join(rootDir, imageInput);

    if (fs.existsSync(localPath)) {
      return await loadImage(localPath);
    }
  }

  // Fallback
  const fallbackPath = path.join(rootDir, 'public', 'images', 'logo-admin.png');
  return await loadImage(fallbackPath);
}

// 5. GERADOR DO CARD FEED (1080 x 1350 px - Proporção 4:5)
export async function generateFeedCard({ title, category, imagePath, excerpt, date = 'Hoje' }) {
  const width = 1080;
  const height = 1350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const catConfig = getCategoryConfig(category);

  // Fundo base
  ctx.fillStyle = '#0F0F0F';
  ctx.fillRect(0, 0, width, height);

  // Imagem de capa (Ocupa os 65% superiores)
  const coverImg = await resolveImage(imagePath);
  const imgHeight = 900;
  
  // Desenha imagem centralizada com aspect cover
  const imgAspect = coverImg.width / coverImg.height;
  const targetAspect = width / imgHeight;
  let sWidth = coverImg.width;
  let sHeight = coverImg.height;
  let sx = 0;
  let sy = 0;

  if (imgAspect > targetAspect) {
    sWidth = coverImg.height * targetAspect;
    sx = (coverImg.width - sWidth) / 2;
  } else {
    sHeight = coverImg.width / targetAspect;
    sy = (coverImg.height - sHeight) / 2;
  }

  ctx.drawImage(coverImg, sx, sy, sWidth, sHeight, 0, 0, width, imgHeight);

  // Gradiente escuro superior para o cabeçalho
  const topGrad = ctx.createLinearGradient(0, 0, 0, 220);
  topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
  topGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.4)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 220);

  // Gradiente cinematográfico inferior para o texto da matéria
  const bottomGrad = ctx.createLinearGradient(0, 480, 0, 930);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(0.4, 'rgba(15, 15, 15, 0.7)');
  bottomGrad.addColorStop(0.8, '#0F0F0F');
  bottomGrad.addColorStop(1, '#0F0F0F');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, 480, width, 450);

  // --- CABEÇALHO ---
  const headerY = 60;
  
  // Pílula do Logo
  ctx.save();
  ctx.fillStyle = 'rgba(15, 15, 15, 0.75)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(50, headerY, 280, 60, 30);
  ctx.fill();
  ctx.stroke();

  // Coroa do logo
  try {
    const crownPath = path.join(rootDir, 'public', 'images', 'coroa-estrada-a-dois.png');
    if (fs.existsSync(crownPath)) {
      const crownImg = await loadImage(crownPath);
      ctx.save();
      ctx.translate(72, headerY + 30);
      ctx.rotate((-12 * Math.PI) / 180);
      ctx.drawImage(crownImg, -16, -16, 32, 32);
      ctx.restore();
    }
  } catch (e) {}

  // Texto do Logo
  ctx.font = 'italic 900 24px Quera, "Montserrat", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Estrada', 105, headerY + 41);
  ctx.fillStyle = '#B6D200';
  ctx.fillText('a Dois', 205, headerY + 41);
  ctx.restore();

  // Badge da Categoria
  ctx.save();
  ctx.fillStyle = catConfig.color;
  ctx.beginPath();
  const badgeWidth = 260;
  ctx.roundRect(width - 50 - badgeWidth, headerY, badgeWidth, 60, 16);
  ctx.fill();

  ctx.fillStyle = '#0F0F0F';
  ctx.font = '900 19px "Montserrat", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(catConfig.badge, width - 50 - (badgeWidth / 2), headerY + 38);
  ctx.restore();

  // --- CORPO DO TEXTO (ÁREA CENTRAL) ---
  const textX = 55;
  let currentY = 910;

  // Data / Tag de leitura
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '700 18px "Montserrat", Arial, sans-serif';
  ctx.fillText(String(date).toUpperCase(), textX, currentY);
  currentY += 45;

  // Manchete Principal
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 48px Quera, "Montserrat", Arial, sans-serif';
  
  const titleLines = wrapText(ctx, title, width - 110, 3);
  for (const line of titleLines) {
    ctx.fillText(line, textX, currentY);
    currentY += 58;
  }
  ctx.restore();

  // Subtítulo / Resumo
  if (excerpt) {
    currentY += 10;
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '500 24px "Montserrat", Arial, sans-serif';
    const excerptLines = wrapText(ctx, excerpt, width - 110, 2);
    for (const line of excerptLines) {
      ctx.fillText(line, textX, currentY);
      currentY += 34;
    }
  }

  // --- RODAPÉ INFERIOR (CTA) ---
  const footerY = height - 90;
  ctx.fillStyle = '#161616';
  ctx.fillRect(0, footerY, width, 90);
  
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(width, footerY);
  ctx.stroke();

  // Link do site no rodapé
  ctx.fillStyle = '#B6D200';
  ctx.beginPath();
  ctx.arc(65, footerY + 45, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#E5E7EB';
  ctx.font = '700 22px "Montserrat", Arial, sans-serif';
  ctx.fillText('estradaadois.com', 85, footerY + 53);

  // Chamada de ação na direita
  ctx.fillStyle = '#B6D200';
  ctx.font = 'bold 22px "Montserrat", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Leia no link da bio ➔', width - 55, footerY + 53);

  return canvas.toBuffer('image/png');
}

// 6. GERADOR DO CARD STORY & TIKTOK (1080 x 1920 px - Proporção 9:16)
export async function generateStoryCard({ title, category, imagePath, excerpt, date = 'Exclusivo' }) {
  const width = 1080;
  const height = 1920;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const catConfig = getCategoryConfig(category);

  // Fundo base
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, width, height);

  // Imagem de fundo ampliada e com overlay escuro atmosférico
  const coverImg = await resolveImage(imagePath);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.drawImage(coverImg, -200, -100, width + 400, height + 200);
  ctx.restore();

  // Gradiente vertical cinematográfico
  const fullGrad = ctx.createLinearGradient(0, 0, 0, height);
  fullGrad.addColorStop(0, 'rgba(10, 10, 10, 0.95)');
  fullGrad.addColorStop(0.3, 'rgba(10, 10, 10, 0.5)');
  fullGrad.addColorStop(0.7, 'rgba(10, 10, 10, 0.85)');
  fullGrad.addColorStop(1, '#0A0A0A');
  ctx.fillStyle = fullGrad;
  ctx.fillRect(0, 0, width, height);

  // --- TOPO: SAFE ZONE DOS STORIES (y: 130) ---
  const headerY = 130;

  // Logo Estrada a Dois
  ctx.save();
  ctx.fillStyle = 'rgba(15, 15, 15, 0.8)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(60, headerY, 290, 64, 32);
  ctx.fill();
  ctx.stroke();

  try {
    const crownPath = path.join(rootDir, 'public', 'images', 'coroa-estrada-a-dois.png');
    if (fs.existsSync(crownPath)) {
      const crownImg = await loadImage(crownPath);
      ctx.save();
      ctx.translate(85, headerY + 32);
      ctx.rotate((-12 * Math.PI) / 180);
      ctx.drawImage(crownImg, -18, -18, 36, 36);
      ctx.restore();
    }
  } catch (e) {}

  ctx.font = 'italic 900 26px Quera, "Montserrat", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Estrada', 120, headerY + 44);
  ctx.fillStyle = '#B6D200';
  ctx.fillText('a Dois', 225, headerY + 44);
  ctx.restore();

  // Badge no topo direito
  ctx.save();
  ctx.fillStyle = catConfig.color;
  ctx.beginPath();
  const badgeWidth = 240;
  ctx.roundRect(width - 60 - badgeWidth, headerY, badgeWidth, 64, 32);
  ctx.fill();

  ctx.fillStyle = '#0F0F0F';
  ctx.font = '900 20px "Montserrat", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(catConfig.name.toUpperCase(), width - 60 - (badgeWidth / 2), headerY + 41);
  ctx.restore();

  // --- MOLDURA CENTRAL DE FOTO (y: 280 a 960) ---
  const boxX = 60;
  const boxY = 280;
  const boxW = width - 120;
  const boxH = 680;
  const cornerRadius = 32;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, cornerRadius);
  ctx.clip();

  // Desenha a imagem na proporção dentro da moldura
  const imgAspect = coverImg.width / coverImg.height;
  const boxAspect = boxW / boxH;
  let sw = coverImg.width;
  let sh = coverImg.height;
  let sx = 0;
  let sy = 0;

  if (imgAspect > boxAspect) {
    sw = coverImg.height * boxAspect;
    sx = (coverImg.width - sw) / 2;
  } else {
    sh = coverImg.width / boxAspect;
    sy = (coverImg.height - sh) / 2;
  }

  ctx.drawImage(coverImg, sx, sy, sw, sh, boxX, boxY, boxW, boxH);

  // Etiqueta no cantinho da foto
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.beginPath();
  ctx.roundRect(boxX + 20, boxY + boxH - 55, 230, 36, 12);
  ctx.fill();

  ctx.fillStyle = '#B6D200';
  ctx.font = 'bold 16px "Montserrat", Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Portal Estrada a Dois', boxX + 35, boxY + boxH - 31);
  ctx.restore();

  // Borda suave ao redor da moldura
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, cornerRadius);
  ctx.stroke();

  // --- TEXTO / MANCHETE (y: 1040) ---
  let textY = 1040;

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '700 20px "Montserrat", Arial, sans-serif';
  ctx.fillText(`HOJE • ${String(date).toUpperCase()}`, boxX, textY);
  textY += 55;

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px Quera, "Montserrat", Arial, sans-serif';
  const titleLines = wrapText(ctx, title, boxW, 4);
  for (const line of titleLines) {
    ctx.fillText(line, boxX, textY);
    textY += 66;
  }

  if (excerpt) {
    textY += 15;
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '500 26px "Montserrat", Arial, sans-serif';
    const excerptLines = wrapText(ctx, excerpt, boxW, 3);
    for (const line of excerptLines) {
      ctx.fillText(line, boxX, textY);
      textY += 38;
    }
  }

  // --- BOTÃO INFERIOR (SAFE ZONE y: 1600 a 1700 - Deixa 220px livres na base) ---
  const btnY = 1620;
  const btnH = 95;
  const btnW = boxW;

  ctx.save();
  ctx.fillStyle = '#B6D200';
  ctx.shadowColor = 'rgba(182, 210, 0, 0.4)';
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.roundRect(boxX, btnY, btnW, btnH, 24);
  ctx.fill();

  ctx.fillStyle = '#0F0F0F';
  ctx.font = '900 28px "Montserrat", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔗 TOQUE NO LINK DO STORY', width / 2, btnY + 58);
  ctx.restore();

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '600 20px "Montserrat", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('www.estradaadois.com', width / 2, btnY + 135);

  return canvas.toBuffer('image/png');
}

// 7. GERADOR DE LEGENDA PARA TELEGRAM & REDES
export function generateSocialCaption({ title, category, excerpt, slug }) {
  const catConfig = getCategoryConfig(category);
  const articleUrl = `https://www.estradaadois.com/blog/${slug}`;

  const emojis = {
    noticias: '🏍️📰',
    roteiros: '🗺️🌲',
    dicas: '💡⚠️',
    equipamentos: '🪖🎧',
    manutencao: '🔧⚡'
  };
  const emoji = emojis[catConfig.name.toLowerCase()] || '🏍️💨';

  return `${emoji} <b>${title.toUpperCase()}</b>\n\n` +
    (excerpt ? `${excerpt}\n\n` : '') +
    `👉 <b>Confira a matéria completa com fotos e detalhes:</b>\n` +
    `🔗 <a href="${articleUrl}"><b>${articleUrl}</b></a>\n` +
    `<i>(Link clicável também na bio do nosso Instagram!)</i>\n\n` +
    `${catConfig.defaultHashtags.join(' ')}`;
}
