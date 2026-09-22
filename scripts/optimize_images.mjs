import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

sharp.cache(false);

const pubDir = path.join(process.cwd(), 'public');
const blogDir = path.join(pubDir, 'images', 'blog');

const KB = 1024;
let scanned = 0;
let optimized = 0;
let originalBytes = 0;
let finalBytes = 0;

function targetFor(filePath) {
  return filePath.startsWith(blogDir) ? 180 * KB : 240 * KB;
}

async function encodeAdaptive(inputBuffer, ext, maxWidth, targetBytes) {
  const meta = await sharp(inputBuffer).metadata();
  let pipeline = sharp(inputBuffer).rotate();

  if (meta.width && meta.width > maxWidth) {
    pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
  }

  if (ext === '.png') {
    const lossless = await pipeline.png({ compressionLevel: 9, effort: 10 }).toBuffer();
    return lossless;
  }

  const qualities = [82, 78, 74, 70, 66, 62];
  let best = inputBuffer;

  for (const quality of qualities) {
    let candidate;
    if (ext === '.webp') {
      candidate = await pipeline.webp({ quality, effort: 6 }).toBuffer();
    } else if (ext === '.avif') {
      candidate = await pipeline.avif({ quality: Math.max(quality - 5, 55), effort: 6 }).toBuffer();
    } else {
      candidate = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    }

    if (candidate.length < best.length) best = candidate;
    if (candidate.length <= targetBytes) return candidate;
  }

  return best;
}

async function processDirectory(dirPath) {
  for (const item of fs.readdirSync(dirPath)) {
    const fullPath = path.join(dirPath, item);
    const stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
      await processDirectory(fullPath);
      continue;
    }

    const ext = path.extname(item).toLowerCase();
    if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) continue;

    scanned++;
    const targetBytes = targetFor(fullPath);

    // Evita recompressão contínua de arquivos que já estão dentro da meta.
    if (stats.size <= targetBytes) continue;

    originalBytes += stats.size;
    const relPath = path.relative(pubDir, fullPath);

    try {
      const inputBuffer = fs.readFileSync(fullPath);
      const maxWidth = fullPath.startsWith(blogDir) ? 1400 : 1600;
      const outputBuffer = await encodeAdaptive(inputBuffer, ext, maxWidth, targetBytes);

      const savingRatio = 1 - (outputBuffer.length / stats.size);

      // Só reescreve quando há ganho real; isso evita perda cumulativa de qualidade.
      if (outputBuffer.length < stats.size && savingRatio >= 0.05) {
        fs.writeFileSync(fullPath, outputBuffer);
        optimized++;
        finalBytes += outputBuffer.length;
        console.log(
          `✅ ${relPath}: ${Math.round(stats.size / KB)} KB -> ${Math.round(outputBuffer.length / KB)} KB (-${(savingRatio * 100).toFixed(1)}%)`
        );
      } else {
        finalBytes += stats.size;
        console.log(`ℹ️ ${relPath}: mantida; ganho menor que 5% ou formato já eficiente.`);
      }

      if (ext === '.png' && outputBuffer.length > targetBytes) {
        console.log(`⚠️ ${relPath}: PNG ainda acima da meta. Converter manualmente para WebP tende a reduzir muito mais sem sacrificar a aparência.`);
      }
    } catch (error) {
      finalBytes += stats.size;
      console.error(`❌ ${relPath}: ${error.message}`);
    }
  }
}

async function run() {
  console.log('🚀 Otimização inteligente de imagens iniciada.');
  await processDirectory(pubDir);

  const saved = originalBytes - finalBytes;
  console.log('\n======================================================');
  console.log(`Imagens analisadas: ${scanned}`);
  console.log(`Imagens regravadas: ${optimized}`);
  if (originalBytes > 0) {
    console.log(`Economia neste ciclo: ${(saved / (1024 * 1024)).toFixed(2)} MB`);
  }
  console.log('======================================================');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
