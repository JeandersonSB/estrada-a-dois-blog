import fs from 'fs';
import path from 'path';

const BACKUP_DIR = 'C:\\Users\\Note\\Downloads\\artigos_recuperados_estradaadois';
const MARKDOWN_DIR = path.join(BACKUP_DIR, 'markdown');
const IMAGES_DIR = path.join(BACKUP_DIR, 'imagens');

const TARGET_POSTS_DIR = path.join(process.cwd(), 'content', 'posts');
const TARGET_IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'blog');

// Ensure target image dir exists
if (!fs.existsSync(TARGET_IMAGES_DIR)) {
  fs.mkdirSync(TARGET_IMAGES_DIR, { recursive: true });
}

// 1. Copy images for each post
const articles = [
  {
    file: 'rastro-da-serpente-de-moto.md',
    slug: 'rastro-da-serpente-de-moto',
    category: 'Roteiros',
  },
  {
    file: 'r15-na-serra-do-rio-do-rastro.md',
    slug: 'r15-na-serra-do-rio-do-rastro',
    category: 'Roteiros',
  },
  {
    file: 'de-r15-nas-cataratas.md',
    slug: 'de-r15-nas-cataratas',
    category: 'Roteiros',
  },
  {
    file: 'r15-em-ponta-grossa.md',
    slug: 'r15-em-ponta-grossa',
    category: 'Roteiros',
  },
];

for (const art of articles) {
  const srcImgDir = path.join(IMAGES_DIR, art.slug);
  const destImgDir = path.join(TARGET_IMAGES_DIR, art.slug);

  if (fs.existsSync(srcImgDir)) {
    fs.cpSync(srcImgDir, destImgDir, { recursive: true });
    console.log(`Imagens copiadas para: ${destImgDir}`);
  } else {
    console.warn(`Pasta de imagens não encontrada para: ${art.slug}`);
  }
}

// 2. Process each markdown file
for (const art of articles) {
  const mdPath = path.join(MARKDOWN_DIR, art.file);
  if (!fs.existsSync(mdPath)) {
    console.error(`Arquivo não encontrado: ${mdPath}`);
    continue;
  }

  const raw = fs.readFileSync(mdPath, 'utf8');

  // Parse frontmatter
  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!fmMatch) {
    console.error(`Falha ao ler frontmatter de ${art.file}`);
    continue;
  }

  const fmContent = fmMatch[1];
  let body = fmMatch[2];

  // Extract fields
  const titleMatch = fmContent.match(/title:\s*"([^"]+)"/);
  const dateMatch = fmContent.match(/date:\s*"([^"]+)"/);
  const thumbMatch = fmContent.match(/thumbnail_url:\s*"([^"]+)"/);
  const excerptMatch = fmContent.match(/excerpt:\s*"([^"]+)"/) || fmContent.match(/seo_description:\s*"([^"]+)"/);

  const title = titleMatch ? titleMatch[1] : art.slug;
  const rawDate = dateMatch ? dateMatch[1] : '2025-10-01';
  const date = rawDate.split(' ')[0]; // YYYY-MM-DD
  const excerpt = excerptMatch ? excerptMatch[1] : '';

  // Determine cover image
  let coverImage = `/images/blog/preview-estrada.jpg`;
  if (thumbMatch) {
    const filename = path.basename(thumbMatch[1]);
    coverImage = `/images/blog/${art.slug}/${filename}`;
  }

  // Replace WordPress image URLs with local image paths
  // Pattern: https://estradaadois.com/wp-content/uploads/.../<filename>
  body = body.replace(/https:\/\/estradaadois\.com\/wp-content\/uploads\/[^\s\)"']+\/([^\s\)"']+)/g, (match, filename) => {
    return `/images/blog/${art.slug}/${filename}`;
  });

  // Clean up any double exclamation marks
  body = body.replace(/!+\[/g, '![');

  // Also convert WordPress gallery links like [ ](/images/...) to proper markdown images ![](/images/...)
  body = body.replace(/(?<!!)\[\s*\]\((\/images\/blog\/[^\)]+)\)/g, '![]($1)');

  const newFrontmatter = `---
title: "${title.replace(/"/g, '\\"')}"
date: "${date}"
category: "${art.category}"
status: "⏳ Rascunho"
image: "${coverImage}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
---

`;

  const finalContent = newFrontmatter + body.trim() + '\n';
  const targetFilePath = path.join(TARGET_POSTS_DIR, `${art.slug}.md`);

  fs.writeFileSync(targetFilePath, finalContent, 'utf8');
  console.log(`Artigo salvo em: ${targetFilePath}`);
}

console.log('Todos os 4 artigos foram importados com sucesso!');
