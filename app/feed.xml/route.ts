import { NextResponse } from 'next/server';
import { getSortedPostsData } from '@/lib/posts';

export async function GET() {
  const baseUrl = 'https://www.estradaadois.com';
  const posts = getSortedPostsData();

  const rssItems = posts
    .slice(0, 50)
    .map((post) => {
      const postUrl = `${baseUrl}/blog/${post.slug}`;
      const pubDate = post.date ? new Date(post.date).toUTCString() : new Date().toUTCString();
      const imageTag = post.image
        ? `<enclosure url="${post.image.startsWith('http') ? post.image : baseUrl + post.image}" type="image/jpeg" />`
        : '';

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.excerpt || post.title}]]></description>
      ${imageTag}
      <category><![CDATA[${post.category || 'Notícias'}]]></category>
    </item>`;
    })
    .join('');

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Estrada a Dois | Portal de Notícias e Motociclismo</title>
    <link>${baseUrl}</link>
    <description>O portal definitivo sobre motociclismo: notícias, lançamentos de motos, roteiros e equipamentos.</description>
    <language>pt-BR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
