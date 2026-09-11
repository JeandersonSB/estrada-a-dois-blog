import type { Metadata } from 'next';
import { getPostData, getSortedPostsData } from '@/lib/posts';

// Generate static routes for all posts at build time
export async function generateStaticParams() {
  const posts = getSortedPostsData();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const postData = await getPostData(slug);
    const excerpt = postData.excerpt || `${postData.title} - Acompanhe no Estrada a Dois.`;
    const canonicalUrl = `https://estrada-a-dois-blog.vercel.app/blog/${slug}`;

    return {
      title: postData.title,
      description: excerpt,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: postData.title,
        description: excerpt,
        url: canonicalUrl,
        siteName: 'Estrada a Dois',
        locale: 'pt_BR',
        type: 'article',
        publishedTime: postData.date,
        authors: ['Estrada a Dois'],
        images: postData.image
          ? [
              {
                url: postData.image,
                width: 1200,
                height: 630,
                alt: postData.title,
              },
            ]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: postData.title,
        description: excerpt,
        images: postData.image ? [postData.image] : [],
      },
    };
  } catch {
    return {
      title: 'Artigo | Estrada a Dois',
      description: 'Artigos, notícias e novidades do motociclismo no Estrada a Dois.',
    };
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const postData = await getPostData(slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: postData.title,
    description: postData.excerpt || postData.title,
    image: postData.image ? [postData.image] : [],
    datePublished: postData.date,
    dateModified: postData.date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://estrada-a-dois-blog.vercel.app/blog/${slug}`,
    },
    author: {
      '@type': 'Organization',
      name: 'Estrada a Dois',
      url: 'https://estrada-a-dois-blog.vercel.app',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Estrada a Dois',
      url: 'https://estrada-a-dois-blog.vercel.app',
      logo: {
        '@type': 'ImageObject',
        url: 'https://estrada-a-dois-blog.vercel.app/logo.png',
      },
    },
  };

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      {/* Schema.org Structured Data for Google Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 py-12">
        {/* Post Header */}
        <header className="mb-10 text-center">
          <span className="inline-block bg-[#B6D200] text-[#0F0F0F] text-[12px] font-black uppercase px-4 py-1.5 tracking-widest mb-6">
            {postData.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-[#0F0F0F] mb-6 leading-tight">
            {postData.title}
          </h1>
          <div className="text-gray-500 font-bold uppercase tracking-widest text-sm flex items-center justify-center">
            <span className="mr-3">Por Estrada a Dois</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#B6D200] mx-3"></span>
            <span>{postData.date}</span>
          </div>
        </header>

        {/* Featured Image */}
        <div className="w-full h-auto md:h-[500px] mb-12 rounded-2xl overflow-hidden shadow-2xl">
          <img 
            src={postData.image} 
            alt={postData.title} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Post Content (Markdown Rendered) */}
        <div 
          className="prose prose-lg md:prose-xl mx-auto text-[#444444] prose-headings:font-black prose-headings:text-[#0F0F0F] prose-a:text-[#B6D200] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg prose-blockquote:border-l-4 prose-blockquote:border-[#B6D200] prose-blockquote:bg-white prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:shadow-sm prose-blockquote:not-italic prose-blockquote:font-medium prose-strong:text-[#0F0F0F]"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
        />

        {/* Tags / Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between">
             <a href="/" className="inline-flex items-center text-[#0F0F0F] font-black uppercase tracking-widest hover:text-[#B6D200] transition-colors">
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
               Voltar para Home
             </a>
          </div>
        </footer>

      </article>
    </div>
  );
}
