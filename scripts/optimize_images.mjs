import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Desabilita cache de arquivos do libvips para evitar file lock no Windows
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
    if (!['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      continue;
    }

    // Apenas imagens com mais de 150 KB
    if (stats.size <= 150 * 1024) {
      continue;
    }

    totalOriginalSize += stats.size;
    const relPath = path.relative(pubDir, fullPath);

    try {
      // Ler arquivo para buffer em memória (evita lock de arquivo no Windows)
      const inputBuffer = fs.readFileSync(fullPath);
      const meta = await sharp(inputBuffer).metadata();

      let pipeline = sharp(inputBuffer).rotate();

      // Redimensionar para largura máxima de 1280px mantendo proporção
      if (meta.width && meta.width > 1280) {
        pipeline = pipeline.resize(1280, null, { withoutEnlargement: true });
      }

      let buffer;
      if (ext === '.webp') {
        buffer = await pipeline.webp({ quality: 80, effort: 5 }).toBuffer();
      } else if (ext === '.png') {
        buffer = await pipeline.png({ quality: 80, compressionLevel: 9, effort: 8 }).toBuffer();
        if (buffer.length > 400 * 1024) {
          buffer = await pipeline.png({ quality: 75, palette: true }).toBuffer();
        }
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        buffer = await pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
      }

      if (buffer && buffer.length < stats.size) {
        fs.writeFileSync(fullPath, buffer);
        totalNewSize += buffer.length;
        optimizedCount++;
        const savedPercent = (((stats.size - buffer.length) / stats.size) * 100).toFixed(1);
        console.log(`✅ Otimizada: ${relPath} | ${(stats.size / 1024).toFixed(0)} KB -> ${(buffer.length / 1024).toFixed(0)} KB (-${savedPercent}%)`);
      } else {
        totalNewSize += stats.size;
        console.log(`ℹ️ Mantida: ${relPath} (já otimizada)`);
      }
    } catch (err) {
      console.error(`❌ Erro ao otimizar ${relPath}:`, err.message);
      totalNewSize += stats.size;
    }
  }
}

async function run() {
  console.log('🚀 Iniciando Otimização em Lote de Imagens em public/ ...\n');
  await processDirectory(pubDir);

  const savedMB = ((totalOriginalSize - totalNewSize) / (1024 * 1024)).toFixed(2);
  const origMB = (totalOriginalSize / (1024 * 1024)).toFixed(2);
  const newMB = (totalNewSize / (1024 * 1024)).toFixed(2);

  console.log('\n======================================================');
  console.log(`🎉 Total de imagens otimizadas: ${optimizedCount}`);
  console.log(`📦 Tamanho anterior: ${origMB} MB`);
  console.log(`✨ Tamanho otimizado: ${newMB} MB`);
  console.log(`🔥 Economia de dados: ${savedMB} MB (${(((totalOriginalSize - totalNewSize) / totalOriginalSize) * 100).toFixed(1)}% menor!)`);
  console.log('======================================================\n');
}

run();
