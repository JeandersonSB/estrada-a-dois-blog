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

// 2. Metadados e Hashtags por Categoria
export const CATEGORY_STYLES = {
  noticias: {
    name: 'Notícias',
    color: '#B6D200',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#motociclismo', '#noticiasdemoto', '#motosbrasil', '#duasrodas', '#estradaadois']
  },
  roteiros: {
    name: 'Roteiros',
    color: '#B6D200',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#mototurismo', '#viagemdemoto', '#roteirodemoto', '#estradaadois', '#viagemdecasal']
  },
  dicas: {
    name: 'Dicas',
    color: '#B6D200',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#dicasdemoto', '#pilotagemsegura', '#motociclista', '#segurancaemduasrodas', '#estradaadois']
  },
  equipamentos: {
    name: 'Equipamentos',
    color: '#B6D200',
    colorDark: '#0F0F0F',
    defaultHashtags: ['#equipamentodemoto', '#capacetes', '#intercomunicador', '#motosbrasil', '#estradaadois']
  },
  manutencao: {
    name: 'Manutenção',
    color: '#B6D200',
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

// 3. Helper para formatação de data em PT-BR ("set. 19")
export function formatDatePtBr(dateInput) {
  if (!dateInput) return 'set. 19';
  const months = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  let d;
  if (typeof dateInput === 'string') {
    const match = dateInput.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const monthIdx = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return `${months[monthIdx]} ${day}`;
    }
    d = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    d = dateInput;
  }
  if (d && !isNaN(d.getTime())) {
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    return `${month} ${day}`;
  }
  return 'set. 19';
}

// 4. Helper para quebra inteligente de linha de texto
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

// 5. Helper para carregar imagens com fallback
async function resolveImage(imageInput) {
  if (!imageInput) {
    const defaultImgPath = path.join(rootDir, 'public', 'images', 'logo-admin.png');
    return await loadImage(defaultImgPath);
  }

  if (typeof imageInput === 'string') {
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      const res = await fetch(imageInput);
      const arrayBuffer = await res.arrayBuffer();
      return await loadImage(Buffer.from(arrayBuffer));
    }

    const localPath = imageInput.startsWith('/')
      ? path.join(rootDir, 'public', imageInput.replace(/^\//, ''))
      : path.join(rootDir, imageInput);

    if (fs.existsSync(localPath)) {
      return await loadImage(localPath);
    }
  }

  const fallbackPath = path.join(rootDir, 'public', 'images', 'logo-admin.png');
  return await loadImage(fallbackPath);
}

// 6. Helper para desenhar a pílula do logo com alinhamento e proporções perfeitas
async function drawBrandLogo(ctx, startX, startY, pillHeight = 56) {
  ctx.save();
  ctx.font = 'italic 900 24px Quera, "Montserrat", Arial, sans-serif';
  ctx.letterSpacing = '0px';
  const wEstrada = ctx.measureText('Estrada').width;
  const wADois = ctx.measureText('a Dois').width;

  const crownSize = 28;
  const padLeft = 14;
  const gapCrownToEstrada = 10;
  const gapWords = 7;
  const padRight = 18;

  const totalWidth = Math.round(padLeft + crownSize + gapCrownToEstrada + wEstrada + gapWords + wADois + padRight);
  const pillRadius = pillHeight / 2;

  // Fundo com borda suave
  ctx.fillStyle = 'rgba(15, 15, 15, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(startX, startY, totalWidth, pillHeight, pillRadius);
  ctx.fill();
  ctx.stroke();

  // Coroa inclinada e alinhada ao centro vertical da pílula
  try {
    const crownPath = path.join(rootDir, 'public', 'images', 'coroa-estrada-a-dois.png');
    if (fs.existsSync(crownPath)) {
      const crownImg = await loadImage(crownPath);
      ctx.save();
      const crownCenterX = startX + padLeft + crownSize / 2;
      const crownCenterY = startY + pillHeight / 2;
      ctx.translate(crownCenterX, crownCenterY);
      ctx.rotate((-12 * Math.PI) / 180);
      ctx.drawImage(crownImg, -crownSize / 2, -crownSize / 2, crownSize, crownSize);
      ctx.restore();
    }
  } catch (e) {}

  // Texto "Estrada a Dois"
  const textBaselineY = startY + (pillHeight / 2) + 8;
  const estradaX = startX + padLeft + crownSize + gapCrownToEstrada;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText('Estrada', estradaX, textBaselineY);

  const aDoisX = estradaX + wEstrada + gapWords;
  ctx.fillStyle = '#B6D200';
  ctx.fillText('a Dois', aDoisX, textBaselineY);

  ctx.restore();
  return totalWidth;
}

// 7. Helper para desenhar a badge da categoria em verde neon com padding dinâmico
function drawCategoryBadge(ctx, category, canvasWidth, marginX, startY, pillHeight = 56) {
  ctx.save();
  const catText = (category || 'Notícias').toUpperCase();
  ctx.font = '900 18px "Montserrat", Arial, sans-serif';
  ctx.letterSpacing = '0.5px';
  const textWidth = ctx.measureText(catText).width;
  const padX = 22;
  const badgeWidth = Math.round(textWidth + padX * 2);
  const badgeX = canvasWidth - marginX - badgeWidth;

  // Fundo Verde Neon da identidade visual para todas as categorias
  ctx.fillStyle = '#B6D200';
  ctx.beginPath();
  ctx.roundRect(badgeX, startY, badgeWidth, pillHeight, 16);
  ctx.fill();

  // Texto preto profundo para máximo contraste
  ctx.fillStyle = '#0A0A0A';
  ctx.textAlign = 'center';
  ctx.fillText(catText, badgeX + badgeWidth / 2, startY + (pillHeight / 2) + 6);

  ctx.restore();
}

// 8. GERADOR DO CARD FEED (1080 x 1350 px - Proporção 4:5)
export async function generateFeedCard({ title, category, imagePath, excerpt, date }) {
  const width = 1080;
  const height = 1350;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fundo base
  ctx.fillStyle = '#0F0F0F';
  ctx.fillRect(0, 0, width, height);

  // Imagem de capa (Ocupa os 65% superiores)
  const coverImg = await resolveImage(imagePath);
  const imgHeight = 900;
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

  // Gradiente superior para o cabeçalho
  const topGrad = ctx.createLinearGradient(0, 0, 0, 220);
  topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.9)');
  topGrad.addColorStop(0.6, 'rgba(0, 0, 0, 0.4)');
  topGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, 220);

  // Gradiente cinematográfico inferior para o texto da matéria
  const bottomGrad = ctx.createLinearGradient(0, 480, 0, 930);
  bottomGrad.addColorStop(0, 'transparent');
  bottomGrad.addColorStop(0.4, 'rgba(15, 15, 15, 0.75)');
  bottomGrad.addColorStop(0.8, '#0F0F0F');
  bottomGrad.addColorStop(1, '#0F0F0F');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, 480, width, 450);

  // Cabeçalho (Topo)
  const headerY = 60;
  await drawBrandLogo(ctx, 50, headerY, 56);
  drawCategoryBadge(ctx, category, width, 50, headerY, 56);

  // Textos (Área Central Inferior)
  const textX = 55;
  let currentY = 910;

  // Data em PT-BR ("set. 19")
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '700 18px "Montserrat", Arial, sans-serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(formatDatePtBr(date), textX, currentY);
  currentY += 45;

  // Manchete Principal com letterSpacing ajustado para leitura agradável
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 48px Quera, "Montserrat", Arial, sans-serif';
  ctx.letterSpacing = '2px';

  const titleLines = wrapText(ctx, title, width - 110, 3);
  for (const line of titleLines) {
    ctx.fillText(line, textX, currentY);
    currentY += 60;
  }
  ctx.restore();

  // Subtítulo / Resumo
  if (excerpt) {
    currentY += 10;
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '500 24px "Montserrat", Arial, sans-serif';
    ctx.letterSpacing = '0px';
    const excerptLines = wrapText(ctx, excerpt, width - 110, 2);
    for (const line of excerptLines) {
      ctx.fillText(line, textX, currentY);
      currentY += 34;
    }
  }

  // Rodapé Inferior
  const footerY = height - 90;
  ctx.fillStyle = '#161616';
  ctx.fillRect(0, footerY, width, 90);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(width, footerY);
  ctx.stroke();

  // Esquerda: Ponto verde neon + estradaadois.com com fonte maior (24px)
  ctx.fillStyle = '#B6D200';
  ctx.beginPath();
  ctx.arc(65, footerY + 45, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#E5E7EB';
  ctx.font = '700 24px "Montserrat", Arial, sans-serif';
  ctx.letterSpacing = '0px';
  ctx.textAlign = 'left';
  ctx.fillText('estradaadois.com', 85, footerY + 53);

  // Direita: Artigo completo com link na bio com fonte aumentada (24px)
  ctx.fillStyle = '#B6D200';
  ctx.font = 'bold 24px "Montserrat", Arial, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Artigo completo com link na bio', width - 55, footerY + 53);

  return canvas.toBuffer('image/png');
}

// 9. GERADOR DO CARD STORY & TIKTOK (1080 x 1920 px - Proporção 9:16)
export async function generateStoryCard({ title, category, imagePath, excerpt, date }) {
  const width = 1080;
  const height = 1920;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fundo base escuro
  ctx.fillStyle = '#0A0A0A';
  ctx.fillRect(0, 0, width, height);

  // Foto de fundo difusa
  const coverImg = await resolveImage(imagePath);
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.drawImage(coverImg, -200, -100, width + 400, height + 200);
  ctx.restore();

  // Gradiente vertical
  const fullGrad = ctx.createLinearGradient(0, 0, 0, height);
  fullGrad.addColorStop(0, 'rgba(10, 10, 10, 0.95)');
  fullGrad.addColorStop(0.3, 'rgba(10, 10, 10, 0.5)');
  fullGrad.addColorStop(0.7, 'rgba(10, 10, 10, 0.85)');
  fullGrad.addColorStop(1, '#0A0A0A');
  ctx.fillStyle = fullGrad;
  ctx.fillRect(0, 0, width, height);

  // Cabeçalho (Topo - safe zone de stories)
  const headerY = 130;
  await drawBrandLogo(ctx, 60, headerY, 56);
  drawCategoryBadge(ctx, category, width, 60, headerY, 56);

  // Moldura central de foto
  const boxX = 60;
  const boxY = 270;
  const boxW = width - 120;
  const boxH = 680;
  const cornerRadius = 32;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, cornerRadius);
  ctx.clip();

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

  // Etiqueta no cantinho da foto: "www.estradaadois.com"
  const siteTag = 'www.estradaadois.com';
  ctx.font = 'bold 18px "Montserrat", Arial, sans-serif';
  ctx.letterSpacing = '0.5px';
  const tagTextWidth = ctx.measureText(siteTag).width;
  const tagPadX = 18;
  const tagW = Math.round(tagTextWidth + tagPadX * 2);
  const tagH = 38;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.beginPath();
  ctx.roundRect(boxX + 20, boxY + boxH - 58, tagW, tagH, 12);
  ctx.fill();

  ctx.fillStyle = '#B6D200';
  ctx.textAlign = 'left';
  ctx.fillText(siteTag, boxX + 20 + tagPadX, boxY + boxH - 33);
  ctx.restore();

  // Borda ao redor da foto
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, cornerRadius);
  ctx.stroke();

  // Manchete e textos
  let textY = 1030;

  // Data em PT-BR ("set. 19")
  ctx.fillStyle = '#9CA3AF';
  ctx.font = '700 20px "Montserrat", Arial, sans-serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(formatDatePtBr(date), boxX, textY);
  textY += 55;

  // Título com letterSpacing
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 52px Quera, "Montserrat", Arial, sans-serif';
  ctx.letterSpacing = '2px';
  const titleLines = wrapText(ctx, title, boxW, 4);
  for (const line of titleLines) {
    ctx.fillText(line, boxX, textY);
    textY += 68;
  }

  // Resumo
  if (excerpt) {
    textY += 15;
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '500 26px "Montserrat", Arial, sans-serif';
    ctx.letterSpacing = '0px';
    const excerptLines = wrapText(ctx, excerpt, boxW, 3);
    for (const line of excerptLines) {
      ctx.fillText(line, boxX, textY);
      textY += 40;
    }
  }

  // O botão de link e o site de rodapé foram removidos para deixar a área inferior
  // 100% limpa para a inserção da figurinha interativa de link do Instagram Stories.

  return canvas.toBuffer('image/png');
}

// 10. GERADOR DE LEGENDA PARA TELEGRAM & REDES
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
