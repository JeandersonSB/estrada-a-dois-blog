import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import { cache } from 'react';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export interface PostData {
  slug: string;
  date: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
  status?: string;
  draft?: boolean;
}

export interface PostDataWithContent extends PostData {
  contentHtml: string;
}

// In-memory cache across serverless requests (TTL: 60s)
let cachedSortedPosts: { data: PostData[]; timestamp: number } | null = null;
const postDataCache = new Map<string, { data: PostDataWithContent; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 segundos

function _getSortedPostsDataInternal(): PostData[] {
  const now = Date.now();
  if (cachedSortedPosts && (now - cachedSortedPosts.timestamp < CACHE_TTL_MS)) {
    return cachedSortedPosts.data;
  }

  let fileNames: string[] = [];
  try {
    fileNames = fs.readdirSync(postsDirectory);
  } catch {
    return [];
  }

  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(postsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const matterResult = matter(fileContents);

      const rawDate = matterResult.data.date;
      let timestamp = 0;
      if (rawDate instanceof Date) {
        timestamp = rawDate.getTime();
      } else if (rawDate) {
        const parsed = new Date(String(rawDate)).getTime();
        timestamp = !isNaN(parsed) ? parsed : 0;
      }

      let dateStr = '';
      if (rawDate instanceof Date) {
        dateStr = rawDate.toISOString().split('T')[0];
      } else if (rawDate) {
        dateStr = String(rawDate).split('T')[0].split(' ')[0];
      }

      return {
        slug,
        ...(matterResult.data as Omit<PostData, 'slug' | 'date'>),
        date: dateStr,
        _timestamp: timestamp,
      };
    });

  const publishedPosts = allPostsData.filter((post) => {
    if (post.status) {
      return post.status.includes('Publicado');
    }
    return post.draft !== true;
  });

  const sorted = publishedPosts.sort((a, b) => {
    const timeA = a._timestamp || 0;
    const timeB = b._timestamp || 0;
    return timeB - timeA;
  });

  cachedSortedPosts = { data: sorted, timestamp: now };
  return sorted;
}

// React cache() memoizes calls within the same request lifecycle (generateMetadata + BlogPost)
export const getSortedPostsData = cache(_getSortedPostsDataInternal);

export function slugifyCategory(cat: string): string {
  return cat
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

export function getPostsByCategory(categorySlug: string): PostData[] {
  const allPosts = getSortedPostsData();
  const target = categorySlug.toLowerCase();
  return allPosts.filter(
    (post) => post.category && slugifyCategory(post.category) === target
  );
}

export function addTargetBlankToExternalLinks(htmlContent: string): string {
  return htmlContent.replace(/<a\b([^>]*)>/gi, (match, attrs) => {
    const hrefMatch = attrs.match(/\bhref\s*=\s*(?:(["'])(.*?)\1|([^\s>]+))/i);
    if (!hrefMatch) return match;
    const href = (hrefMatch[2] || hrefMatch[3] || '').trim();

    const isExternal = /^(https?:)?\/\//i.test(href) &&
      !href.includes('estrada-a-dois-blog.vercel.app') &&
      !href.includes('estradaadois.com.br') &&
      !href.includes('estradaadois.com') &&
      !href.includes('localhost');

    if (!isExternal) return match;

    const cleanAttrs = attrs
      .replace(/\s*\btarget\s*=\s*(?:(["']).*?\1|[^\s>]+)/gi, '')
      .replace(/\s*\brel\s*=\s*(?:(["']).*?\1|[^\s>]+)/gi, '')
      .trim();

    return `<a ${cleanAttrs ? cleanAttrs + ' ' : ''}target="_blank" rel="noopener noreferrer">`;
  });
}

async function _getPostDataInternal(slug: string): Promise<PostDataWithContent> {
  const now = Date.now();
  const cached = postDataCache.get(slug);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  const decodedSlug = decodeURIComponent(slug);
  let fullPath = path.join(postsDirectory, `${decodedSlug}.md`);
  if (!fs.existsSync(fullPath)) {
    fullPath = path.join(postsDirectory, `${slug}.md`);
  }
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const matterResult = matter(fileContents);

  const processedContent = await remark()
    .use(html)
    .process(matterResult.content);
  const rawContentHtml = processedContent.toString();
  const contentHtml = addTargetBlankToExternalLinks(rawContentHtml);

  const dateStr = matterResult.data.date instanceof Date
    ? matterResult.data.date.toISOString().split('T')[0]
    : String(matterResult.data.date || '');

  const result: PostDataWithContent = {
    slug,
    contentHtml,
    ...(matterResult.data as Omit<PostDataWithContent, 'slug' | 'date' | 'contentHtml'>),
    date: dateStr,
  };

  postDataCache.set(slug, { data: result, timestamp: now });
  return result;
}

export const getPostData = cache(_getPostDataInternal);
