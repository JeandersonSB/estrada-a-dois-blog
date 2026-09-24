import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';
import sharp from 'sharp';

const POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const BLOG_IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'blog');
const beforeSha = process.argv[2] || '';
const headSha = process.argv[3] || 'HEAD';

function runGit(args) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function isZeroSha(value) {
  return !value || /^0+$/.test(value);
}

function readAtRevision(revision, filePath) {
  if (!revision || isZeroSha(revision) || !filePath) return '';
  try {
    return runGit(['show', `${revision}:${filePath}`]);
  } catch {
    return '';
  }
}

function isPublished(content) {
  if (!content) return false;

  const statusMatch = content.match(/^status:\s*["']?([^"'\r\n]+)["']?\s*$/mi);
  if (statusMatch) return /Publicado/i.test(statusMatch[1]);

  const draftMatch = content.match(/^draft:\s*(true|false)\s*$/mi);
  return draftMatch ? draftMatch[1].toLowerCase() !== 'true' : true;
}

function getImageValue(content) {
  const match = content.match(/^image:\s*["']?([^"'\r\n]+)["']?\s*$/mi);
  return match ? match[1].trim() : '';
}

function changedPostEntries() {
  let raw = '';

  try {
    if (isZeroSha(beforeSha)) {
      raw = runGit([
        'diff-tree',
        '--root',
        '--no-commit-id',
        '--name-status',
        '-r',
        headSha,
        '--',
        'content/posts',
      ]);
    } else {
      raw = runGit([
        'diff',
        '--name-status',
        beforeSha,
        headSha,
        '--',
        'content/posts',
      ]);
    }
  } catch (error) {
    console.error('Falha ao identificar artigos alterados:', error.message);
    process.exit(1);
  }

  if (!raw) return [];

  return raw
    .split('\n')
    .map((line) => {
      const parts = line.split('\t');
      const status = parts[0] || '';

      if (status.startsWith('R') || status.startsWith('C')) {
        return { status, oldPath: parts[1], path: parts[2] };
      }

      return { status, oldPath: parts[1], path: parts[1] };
    })
    .filter((entry) => entry.path?.endsWith('.md') || entry.oldPath?.endsWith('.md'));
}

function normalizeImageReference(value) {
  if (!value || /^(?:https?:)?\/\//i.test(value) || value.startsWith('data:')) {
    return null;
  }

  const clean = value.split(/[?#]/)[0].replace(/\\/g, '/');
  let publicRef = clean;
  let fsPath = '';

  if (clean.startsWith('/images/blog/')) {
    fsPath = path.join(process.cwd(), 'public', clean.slice(1));
  } else if (clean.startsWith('images/blog/')) {
    publicRef = `/${clean}`;
    fsPath = path.join(process.cwd(), 'public', clean);
  } else if (clean.startsWith('public/images/blog/')) {
    publicRef = `/${clean.slice('public/'.length)}`;
    fsPath = path.join(process.cwd(), clean);
  } else {
    return null;
  }

  if (!fs.existsSync(fsPath)) {
    try {
      const decoded = decodeURIComponent(fsPath);
      if (fs.existsSync(decoded)) fsPath = decoded;
    } catch {}
  }

  return { publicRef, fsPath };
}

function fileHash(filePath) {
  return crypto
    .createHash('sha256')
    .update(fs.readFileSync(filePath))
    .digest('hex');
}

function allPostContents() {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((name) => name.endsWith('.md'))
    .map((name) => {
      const filePath = path.join(POSTS_DIR, name);
      return {
        filePath,
        content: fs.readFileSync(filePath, 'utf8'),
      };
    });
}

function countReferences(publicRef, excludingFile = '') {
  const variants = new Set([
    publicRef,
    publicRef.replace(/^\//, ''),
    `public/${publicRef.replace(/^\//, '')}`,
  ]);

  let count = 0;

  for (const post of allPostContents()) {
    if (
      excludingFile &&
      path.resolve(post.filePath) === path.resolve(excludingFile)
    ) {
      continue;
    }

    for (const ref of variants) {
      if (ref && post.content.includes(ref)) {
        count++;
        break;
      }
    }
  }

  return count;
}

function replaceImageReferences(content, oldValue, oldPublicRef, newPublicRef) {
  let updated = content.replace(
    /^image:\s*["']?([^"'\r\n]+)["']?\s*$/mi,
    `image: "${newPublicRef}"`
  );

  const variants = new Set([
    oldValue,
    oldPublicRef,
    oldPublicRef.replace(/^\//, ''),
    `public/${oldPublicRef.replace(/^\//, '')}`,
  ]);

  for (const ref of variants) {
    // Não substitui variantes que já são parte do caminho final.
    // Ex.: "images/blog/artigo.webp" dentro de "/images/blog/artigo.webp"
    // não pode virar "//images/blog/artigo.webp".
    if (!ref || ref === newPublicRef || newPublicRef.includes(ref)) continue;
    updated = updated.split(ref).join(newPublicRef);
  }

  return updated;
}

function pickTarget(slug, extension, currentPostPath, sourcePath) {
  const normalizedExt = extension.toLowerCase();
  const baseName = `${slug}${normalizedExt}`;
  const baseTarget = path.join(BLOG_IMAGES_DIR, baseName);
  const baseRef = `/images/blog/${baseName}`;

  if (
    !fs.existsSync(baseTarget) ||
    path.resolve(baseTarget) === path.resolve(sourcePath)
  ) {
    return { targetPath: baseTarget, targetRef: baseRef };
  }

  // Se ninguém além deste artigo usa o nome padrão, ele pertence ao próprio
  // artigo e pode receber uma nova versão da capa.
  if (countReferences(baseRef, currentPostPath) === 0) {
    return { targetPath: baseTarget, targetRef: baseRef };
  }

  for (let i = 2; i < 100; i++) {
    const name = `${slug}-capa-${i}${normalizedExt}`;
    const targetPath = path.join(BLOG_IMAGES_DIR, name);
    const targetRef = `/images/blog/${name}`;

    if (!fs.existsSync(targetPath)) {
      return { targetPath, targetRef };
    }
  }

  throw new Error(
    `Não foi possível definir um nome único para a imagem de ${slug}.`
  );
}

async function normalizePublishedPost(postPath) {
  if (!fs.existsSync(postPath)) return false;

  const content = fs.readFileSync(postPath, 'utf8');
  if (!isPublished(content)) return false;

  const imageValue = getImageValue(content);
  let source = normalizeImageReference(imageValue);

  if (!source) {
    console.log(
      `ℹ️ ${path.basename(postPath)}: imagem externa ou fora de /images/blog; nada a renomear.`
    );
    return false;
  }

  const slug = path.basename(postPath, '.md');

  if (!fs.existsSync(source.fsPath)) {
    // O CMS pode salvar uma referência local antes do upload da mídia concluir.
    // Antes de publicar uma capa quebrada, recupera uma imagem válida já existente
    // com o nome canônico do próprio artigo.
    const fallbackExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.avif'];
    const fallbackPath = fallbackExtensions
      .map(ext => path.join(BLOG_IMAGES_DIR, `${slug}${ext}`))
      .find(candidate => fs.existsSync(candidate));

    if (fallbackPath) {
      const fallbackRef = `/images/blog/${path.basename(fallbackPath)}`;
      console.warn(
        `⚠️ ${path.basename(postPath)}: referência de capa ausente (${imageValue}). Recuperando ${fallbackRef}.`
      );
      source = {
        fsPath: fallbackPath,
        publicRef: fallbackRef,
      };
    } else {
      throw new Error(
        `Imagem de capa local não encontrada em ${path.basename(postPath)}: ${imageValue}`
      );
    }
  }
  let extension = path.extname(source.fsPath) || path.extname(imageValue);

  if (!extension) {
    throw new Error(
      `Imagem de capa sem extensão em ${path.basename(postPath)}.`
    );
  }

  extension = extension.toLowerCase();

  // Valida a imagem antes de liberar qualquer publicação.
  // Se o Sharp não consegue ler, o mesmo tipo de falha pode quebrar o next/image.
  try {
    const meta = await sharp(source.fsPath).metadata();
    if (!meta.width || !meta.height) {
      throw new Error('dimensões ausentes');
    }
  } catch (error) {
    throw new Error(
      `Imagem de capa inválida em ${path.basename(postPath)}: ${error.message}`
    );
  }

  fs.mkdirSync(BLOG_IMAGES_DIR, { recursive: true });

  // AVIFs vindos de fontes externas podem usar variantes de container que
  // navegadores aceitam, mas o otimizador da Vercel/Next rejeita.
  // Na publicação, convertemos AVIF local para WebP padronizado.
  if (extension === '.avif') {
    const { targetPath, targetRef } = pickTarget(
      slug,
      '.webp',
      postPath,
      source.fsPath
    );

    await sharp(source.fsPath)
      .rotate()
      .resize({
        width: 1600,
        height: 1200,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toFile(targetPath);

    const convertedMeta = await sharp(targetPath).metadata();
    if (!convertedMeta.width || !convertedMeta.height || convertedMeta.format !== 'webp') {
      throw new Error(
        `Falha ao validar WebP convertido para ${path.basename(postPath)}.`
      );
    }

    const sourceShared = countReferences(source.publicRef, postPath) > 0;
    if (!sourceShared && fs.existsSync(source.fsPath)) {
      fs.unlinkSync(source.fsPath);
    }

    const updated = replaceImageReferences(
      content,
      imageValue,
      source.publicRef,
      targetRef
    );

    if (updated !== content) {
      fs.writeFileSync(postPath, updated, 'utf8');
    }

    console.log(
      `🖼️ AVIF convertido e normalizado: ${path.basename(source.fsPath)} → ${path.basename(targetPath)}`
    );
    console.log(
      `📝 Frontmatter atualizado: ${path.relative(process.cwd(), postPath)} → ${targetRef}`
    );

    return true;
  }

  const { targetPath, targetRef } = pickTarget(
    slug,
    extension,
    postPath,
    source.fsPath
  );

  const samePath =
    path.resolve(source.fsPath) === path.resolve(targetPath);

  if (!samePath) {
    const sourceShared =
      countReferences(source.publicRef, postPath) > 0;

    if (fs.existsSync(targetPath)) {
      const sameFile =
        fileHash(source.fsPath) === fileHash(targetPath);

      if (!sameFile) {
        fs.copyFileSync(source.fsPath, targetPath);
      }

      if (!sourceShared && fs.existsSync(source.fsPath)) {
        fs.unlinkSync(source.fsPath);
      }
    } else if (sourceShared) {
      fs.copyFileSync(source.fsPath, targetPath);
    } else {
      fs.renameSync(source.fsPath, targetPath);
    }

    console.log(
      `🖼️ Capa normalizada: ${path.basename(source.fsPath)} → ${path.basename(targetPath)}`
    );
  }

  const updated = replaceImageReferences(
    content,
    imageValue,
    source.publicRef,
    targetRef
  );

  if (updated !== content) {
    fs.writeFileSync(postPath, updated, 'utf8');
    console.log(
      `📝 Frontmatter atualizado: ${path.relative(process.cwd(), postPath)} → ${targetRef}`
    );
  }

  return updated !== content || !samePath;
}

const entries = changedPostEntries();

if (entries.length === 0) {
  console.log('ℹ️ Nenhum artigo alterado neste push.');
  process.exit(10);
}

let requiresFinalPublish = false;
const currentPublishedPaths = new Set();

for (const entry of entries) {
  const oldPath = entry.oldPath || entry.path;
  const newPath = entry.path;

  const oldContent = readAtRevision(beforeSha, oldPath);
  const newAbsPath = newPath
    ? path.join(process.cwd(), newPath)
    : '';

  const newContent =
    newAbsPath && fs.existsSync(newAbsPath)
      ? fs.readFileSync(newAbsPath, 'utf8')
      : '';

  const wasPublished = isPublished(oldContent);
  const isNowPublished = isPublished(newContent);

  // Publicar, editar artigo já publicado, despublicar ou excluir artigo
  // publicado exige um commit final que libere o deploy.
  if (wasPublished || isNowPublished) {
    requiresFinalPublish = true;
  }

  if (isNowPublished && newAbsPath) {
    currentPublishedPaths.add(newAbsPath);
  }
}

if (!requiresFinalPublish) {
  console.log(
    'ℹ️ Apenas rascunhos foram alterados; nenhum deploy público é necessário.'
  );
  process.exit(10);
}

for (const postPath of currentPublishedPaths) {
  await normalizePublishedPost(postPath);
}

console.log(
  '✅ Alteração pública detectada. Conteúdo pronto para o commit final de publicação.'
);
process.exit(0);
