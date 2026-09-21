import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Desabilita cache de arquivos do libvips para evitar file lock
sharp.cache(false);

const pubDir = path.join(process.cwd(), 'public');

let totalOriginalSize = 0;
let totalNewSize = 0;
let optimizedCount = 0;

async function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      await processDirectory(fullPath);
      continue;
    }

    const ext = path.extname(item).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
      continue;
    }

    // Otimiza qualquer imagem com mais de 180 KB para garantir que fique bem abaixo do limite de 300 KB do WhatsApp
    if (stats.size <= 180 * 1024) {
      continue;
    }

    totalOriginalSize += stats.size;
    const relPath = path.relative(pubDir, fullPath);

    try {
      const inputBuffer = fs.readFileSync(fullPath);
      const meta = await sharp(inputBuffer).metadata();

      let pipeline = sharp(inputBuffer).rotate();

      // Redimensionar para largura máxima de 1200px mantendo proporção
      if (meta.width && meta.width > 1200) {
        pipeline = pipeline.resize(1200, null, { withoutEnlargement: true });
      }

      let buffer;
      if (ext === '.webp') {
        buffer = await pipeline.webp({ quality: 78, effort: 5 }).toBuffer();
      } else if (ext === '.avif') {
        buffer = await pipeline.avif({ quality: 75, effort: 5 }).toBuffer();
      } else if (ext === '.png') {
        buffer = await pipeline.png({ quality: 80, compressionLevel: 9, effort: 8 }).toBuffer();
        if (buffer.length > 220 * 1024) {
          buffer = await pipeline.png({ quality: 75, palette: true }).toBuffer();
        }
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        buffer = await pipeline.jpeg({ quality: 78, mozjpeg: true }).toBuffer();
      }

      if (buffer && buffer.length < stats.size) {
        fs.writeFileSync(fullPath, buffer);
        totalNewSize += buffer.length;
        optimizedCount++;
        const savedPercent = (((stats.size - buffer.length) / stats.size) * 100).toFixed(1);
        console.log(`✅ Otimizada: ${relPath} | ${(stats.size / 1024).toFixed(0)} KB -> ${(buffer.length / 1024).toFixed(0)} KB (-${savedPercent}%)`);
      } else {
        totalNewSize += stats.size;
        console.log(`ℹ️ Mantida: ${relPath} (já no tamanho ideal)`);
      }
    } catch (err) {
      console.error(`❌ Erro ao otimizar ${relPath}:`, err.message);
      totalNewSize += stats.size;
    }
  }
}

async function run() {
  console.log('🚀 Iniciando Otimização em Lote de Imagens em public/ (Alvo < 200 KB para WhatsApp)...\\n');
  await processDirectory(pubDir);

  const savedMB = ((totalOriginalSize - totalNewSize) / (1024 * 1024)).toFixed(2);
  const origMB = (totalOriginalSize / (1024 * 1024)).toFixed(2);
  const newMB = (totalNewSize / (1024 * 1024)).toFixed(2);

  console.log('\\n======================================================');
  console.log(`🎉 Total de imagens otimizadas: ${optimizedCount}`);
  console.log(`📦 Tamanho anterior: ${origMB} MB`);
  console.log(`✨ Tamanho otimizado: ${newMB} MB`);
  if (totalOriginalSize > 0) {
    console.log(`🔥 Economia de dados: ${savedMB} MB (${(((totalOriginalSize - totalNewSize) / totalOriginalSize) * 100).toFixed(1)}% menor!)`);
  }
  console.log('======================================================\\n');
}

run();
