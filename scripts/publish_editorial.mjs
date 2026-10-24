import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import matter from 'gray-matter';
import sharp from 'sharp';
import { PUBLISHED, isDueForPublication, notifyTelegram, readPosts, writeJson } from './editorial/common.mjs';

export async function publishApproved({ root = process.cwd(), now = new Date() } = {}) {
  const result = { published: [], blocked: [] };
  for (const post of readPosts(root)) {
    if (!isDueForPublication(post.data, now)) continue;
    try {
      // Só imagens locais: o arquivo revisado fica disponível no mesmo deploy.
      if (!/^\/images\/blog\/[a-zA-Z0-9_.-]+\.(?:webp|jpe?g|png|avif)$/i.test(post.data.image || '')) throw new Error('Selecione uma capa local válida na biblioteca de mídia.');
      const meta = await sharp(path.join(root, 'public', post.data.image.slice(1))).metadata();
      if (!meta.width || !meta.height || meta.width < 800 || meta.width <= meta.height) throw new Error('A capa precisa ser horizontal e ter pelo menos 800 pixels.');
      if (!post.data.title || !post.data.excerpt || !post.content.trim()) throw new Error('Artigo incompleto.');
      post.data.status = PUBLISHED;
      post.data.draft = false;
      // A data pública é a publicação efetiva, inclusive quando a aprovação atrasar.
      post.data.date = now.toISOString();
      post.data.published_at = now.toISOString();
      fs.writeFileSync(post.file, matter.stringify(post.content, post.data, { lineWidth: -1 }));
      result.published.push({ title: post.data.title, slug: post.slug, category: post.data.category });
    } catch (error) {
      result.blocked.push({ title: post.data.title, message: error.message });
    }
  }
  return result;
}

async function main() {
  const file = process.env.EDITORIAL_PUBLISH_REPORT || '/tmp/ead-editorial-publication.json';
  if (process.argv[2] === 'notify') {
    const result = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!result.published.length && !result.blocked.length) return;
    await notifyTelegram(`📅 Publicação editorial do Estrada a Dois\n\n${result.published.map(post => `✅ Publicação enviada ao deploy: ${post.title}\nhttps://www.estradaadois.com/blog/${post.slug}`).join('\n\n')}${result.blocked.length ? `\n\n⚠️ ${result.blocked.length} artigo(s) com pendência de capa/conteúdo. Confira o painel e o GitHub Actions.` : ''}\n\nA disponibilização no site depende da conclusão do deploy.`);
    return;
  }
  const result = await publishApproved();
  writeJson(file, result);
  if (result.published.length) {
    fs.writeFileSync('.publish-trigger', `${new Date().toISOString()}\n`);
  }
  console.log(JSON.stringify(result, null, 2));
  if (result.blocked.length) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
