import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'blog');

const duplicatePosts = [
  'recorde-hist-rico-honda-emplaca-mais-de-1-milh-o-d.md',
  'galeria-de-fotos-royal-enfield-flying-flea-c6-ganh.md',
  'royal-enfield-flying-flea-c6-ganha-nova-cor-motoci.md',
];

const coverFallbacks = new Map([
  [
    'nova-rally-chineses-compram-marca-de-motos-esqueci.md',
    'https://images.unsplash.com/photo-1558981285-6f0c94958bb6?w=1600&auto=format&fit=crop&q=85'
  ],
  [
    'royal-enfield-flying-flea-c6-ganha-nova-cor-branca.md',
    'https://motociclismoonline.com.br/wp-content/uploads/2026/09/royal-enfield-flying-flea-branco.avif'
  ],
]);

const linkMap = new Map([
  ['/blog/5-serras-e-831-km-de-moto-em-um-fim-de', '/blog/rastro-da-serpente-de-moto'],
  ['/blog/de-r15-para-as-cataratas-roteiro-de', '/blog/de-r15-nas-cataratas'],
  ['/blog/de-r15-a-serra-do-rio-do-rastro-um-sonho-em', '/blog/r15-na-serra-do-rio-do-rastro'],
  ['/blog/como-limpar-e-lubrificar-a-corrente-da-moto-corretamente', '/blog/como-limpar-a-corrente-da-moto-cuidados-e-lubrificacao'],
  ['/blog/rota-513-letts-road-e-o-t-nel-de-bambus-um', '/blog/r15-em-ponta-grossa'],
  ['/blog/calibragem-de-pneus-de-moto-a-frio-o-guia-pr-tico', '/blog/calibragem-de-pneus-de-moto-confira-a-pressao-a-frio'],
]);

function escapeYaml(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function getExternalImage(content) {
  const match = content.match(/^image:\s*["']?(https?:\/\/[^"'\r\n]+)["']?\s*$/mi);
  return match ? match[1].trim() : null;
}

function setLocalImage(content, localRef, originalUrl) {
  let updated = content.replace(
    /^image:\s*["']?[^"'\r\n]+["']?\s*$/mi,
    `image: "${localRef}"`
  );

  if (/^imageSource:/mi.test(updated)) {
    updated = updated.replace(
      /^imageSource:\s*.*$/mi,
      `imageSource: "${escapeYaml(originalUrl)}"`
    );
  } else {
    updated = updated.replace(
      /^image:\s*.*$/mi,
      (line) => `${line}\nimageSource: "${escapeYaml(originalUrl)}"`
    );
  }

  return updated;
}

async function fetchImage(url) {
  const parsed = new URL(url);
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(30000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; EstradaADoisEditorial/1.0; +https://www.estradaadois.com)',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      'Referer': parsed.origin + '/',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) {
    throw new Error(`arquivo muito pequeno (${bytes.length} bytes)`);
  }

  const meta = await sharp(bytes).metadata();
  if (!meta.width || !meta.height) {
    throw new Error('imagem sem dimensões válidas');
  }

  return bytes;
}

async function localizeCover(filePath, content) {
  const externalUrl = getExternalImage(content);
  if (!externalUrl) return { changed: false, content };

  const fileNameOnly = path.basename(filePath);
  const downloadUrl = coverFallbacks.get(fileNameOnly) || externalUrl;
  const slug = path.basename(filePath, '.md');
  const fileName = `${slug}.webp`;
  const targetPath = path.join(IMAGES_DIR, fileName);
  const localRef = `/images/blog/${fileName}`;

  const sourceBuffer = await fetchImage(downloadUrl);
  const optimized = await sharp(sourceBuffer)
    .rotate()
    .resize({
      width: 1600,
      height: 1200,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 82, effort: 4 })
    .toBuffer();

  const check = await sharp(optimized).metadata();
  if (check.format !== 'webp' || !check.width || !check.height) {
    throw new Error('WebP final inválido');
  }

  fs.mkdirSync(IMAGES_DIR, { recursive: true });
  fs.writeFileSync(targetPath, optimized);

  console.log(
    `🖼️ ${path.basename(filePath)}: capa externa → ${fileName} (${Math.round(optimized.length / 1024)} KB)`
  );

  return {
    changed: true,
    content: setLocalImage(content, localRef, downloadUrl),
  };
}

for (const duplicate of duplicatePosts) {
  const duplicatePath = path.join(POSTS_DIR, duplicate);
  if (fs.existsSync(duplicatePath)) {
    fs.unlinkSync(duplicatePath);
    console.log(`🗑️ Duplicata consolidada e removida: ${duplicate}`);
  }
}

const postFiles = fs
  .readdirSync(POSTS_DIR)
  .filter((name) => name.endsWith('.md'))
  .sort();

let linkChanges = 0;
let localizedImages = 0;
const failures = [];

for (const fileName of postFiles) {
  const filePath = path.join(POSTS_DIR, fileName);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [oldLink, newLink] of linkMap) {
    if (content.includes(oldLink)) {
      const before = content;
      content = content.split(oldLink).join(newLink);
      const matches = before.split(oldLink).length - 1;
      linkChanges += matches;
      changed = true;
      console.log(`🔗 ${fileName}: ${oldLink} → ${newLink} (${matches}x)`);
    }
  }

  try {
    const localized = await localizeCover(filePath, content);
    if (localized.changed) {
      content = localized.content;
      localizedImages += 1;
      changed = true;
    }
  } catch (error) {
    const externalUrl = getExternalImage(content);
    failures.push({
      file: fileName,
      url: externalUrl,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

const remainingExternal = fs
  .readdirSync(POSTS_DIR)
  .filter((name) => name.endsWith('.md'))
  .map((name) => {
    const content = fs.readFileSync(path.join(POSTS_DIR, name), 'utf8');
    return { name, image: getExternalImage(content) };
  })
  .filter((item) => item.image);

console.log(`\n✅ Links internos corrigidos: ${linkChanges}`);
console.log(`✅ Capas externas localizadas: ${localizedImages}`);
console.log(`✅ Duplicatas removidas: ${duplicatePosts.filter((name) => !fs.existsSync(path.join(POSTS_DIR, name))).length}`);

if (failures.length > 0 || remainingExternal.length > 0) {
  console.error('\n❌ Algumas capas não puderam ser localizadas:');
  for (const item of failures) {
    console.error(`- ${item.file}: ${item.error} | ${item.url}`);
  }
  for (const item of remainingExternal) {
    if (!failures.some((failure) => failure.file === item.name)) {
      console.error(`- ${item.name}: ainda externa | ${item.image}`);
    }
  }
  process.exit(1);
}

if (linkChanges !== 21) {
  console.warn(`⚠️ Esperávamos 21 ocorrências de links antigos e foram corrigidas ${linkChanges}.`);
}

console.log('\n🎯 Limpeza editorial concluída sem capas externas remanescentes.');
