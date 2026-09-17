import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export interface PostData {
  slug: string;
  date: string;
  title: string;
  category: string;
  excerpt: string;
  image: string;
}

export interface PostDataWithContent extends PostData {
  contentHtml: string;
}

export function getSortedPostsData(): PostData[] {
  let fileNames: string[] = [];
  try {
    fileNames = fs.readdirSync(postsDirectory);
  } catch (error) {
    return [];
  }

  const allPostsData = fileNames
    .filter(fileName => fileName.endsWith('.md'))
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

      let fileMtime = 0;
      try {
        const stats = fs.statSync(fullPath);
        fileMtime = stats.mtimeMs || stats.ctimeMs || 0;
      } catch {}

      return {
        slug,
        ...(matterResult.data as any),
        date: dateStr,
        _timestamp: timestamp,
        _fileMtime: fileMtime,
      };
  });
  
  const publishedPosts = allPostsData.filter(post => {
    if (post.status) {
      return post.status.includes('Publicado');
    }
    return post.draft !== true;
  });

  return publishedPosts.sort((a, b) => {
    const timeA = (a as any)._timestamp || 0;
    const timeB = (b as any)._timestamp || 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }
    const mtimeA = (a as any)._fileMtime || 0;
    const mtimeB = (b as any)._fileMtime || 0;
    return mtimeB - mtimeA;
  });
}

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

export async function getPostData(slug: string): Promise<PostDataWithContent> {
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
  const contentHtml = processedContent.toString();
  
  const dateStr = matterResult.data.date instanceof Date 
    ? matterResult.data.date.toISOString().split('T')[0] 
    : String(matterResult.data.date || '');

  return {
    slug,
    contentHtml,
    ...(matterResult.data as any),
    date: dateStr,
  };
}
