import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import sharp from 'sharp';
import { isEditorialHold, isPostPublished, isPublicCategory } from '@/lib/posts';
import { normalizePostSlug } from '@/lib/post-slug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: incoming } = await params;
  const slug = normalizePostSlug(incoming);
  if (!slug || isEditorialHold(slug)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const articlePath = path.join(process.cwd(), 'content', 'posts', slug + '.md');
    const article = matter(await fs.readFile(articlePath, 'utf8'));
    if (!isPostPublished(article.data) || !isPublicCategory(article.data.category)) {
      return new Response('Not found', { status: 404 });
    }

    const image = String(article.data.image || '');
    // Only use the article's published, local cover. Never fetch external URLs
    // or allow a CMS filename to escape the public blog-image directory.
    if (!image.startsWith('/images/blog/') || /[?#\0]/.test(image)) {
      return new Response('Not found', { status: 404 });
    }
    const decoded = decodeURIComponent(image);
    const root = path.resolve(process.cwd(), 'public', 'images', 'blog');
    const source = path.resolve(process.cwd(), 'public', '.' + decoded);
    if (!source.startsWith(root + path.sep)) {
      return new Response('Not found', { status: 404 });
    }

    const file = await fs.readFile(source);
    if (file.length > 12_000_000) {
      return new Response('Not found', { status: 404 });
    }

    // WhatsApp and other social crawlers are most reliable with a real
    // 1200 x 630 JPEG that is small and explicitly typed as image/jpeg.
    const pipeline = sharp(file).rotate().flatten({ background: '#f7f8f9' })
      .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention });
    let jpg = await pipeline.clone().jpeg({ quality: 78, mozjpeg: true }).toBuffer();
    if (jpg.length > 280_000) {
      jpg = await pipeline.clone().jpeg({ quality: 65, mozjpeg: true }).toBuffer();
    }
    if (jpg.length > 550_000) {
      jpg = await pipeline.clone().jpeg({ quality: 50, mozjpeg: true }).toBuffer();
    }

    return new Response(new Uint8Array(jpg), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
