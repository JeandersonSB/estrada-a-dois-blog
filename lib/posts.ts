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
      
      const dateStr = matterResult.data.date instanceof Date 
        ? matterResult.data.date.toISOString().split('T')[0] 
        : String(matterResult.data.date || '');

      return {
        slug,
        ...(matterResult.data as any),
        date: dateStr,
      };
  });
  
  const publishedPosts = allPostsData.filter(post => post.draft !== true && post.status !== '⏳ Rascunho');

  return publishedPosts.sort((a, b) => {
    if (a.date < b.date) {
      return 1;
    } else {
      return -1;
    }
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
  const fullPath = path.join(postsDirectory, `${slug}.md`);
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
