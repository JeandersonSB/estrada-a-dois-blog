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
    const canonicalUrl = `https://www.estradaadois.com/blog/${slug}`;
    const baseUrl = 'https://www.estradaadois.com';

    let imageUrl = postData.image;
    if (imageUrl && imageUrl.startsWith('/')) {
      imageUrl = `${baseUrl}${imageUrl}`;
    }

    let mimeType = 'image/jpeg';
    if (imageUrl) {
      const cleanUrl = imageUrl.split('?')[0].toLowerCase();
      if (cleanUrl.endsWith('.webp')) mimeType = 'image/webp';
      else if (cleanUrl.endsWith('.png')) mimeType = 'image/png';
      else if (cleanUrl.endsWith('.gif')) mimeType = 'image/gif';
      else if (cleanUrl.endsWith('.avif')) mimeType = 'image/avif';
    }

    return {
      metadataBase: new URL(baseUrl),
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
        images: imageUrl
          ? [
              {
                url: imageUrl,
                secureUrl: imageUrl,
                width: 1200,
                height: 630,
                type: mimeType,
                alt: postData.title,
              },
            ]
          : [],
      },
      twitter: {
        card: 'summary_large_image',
        title: postData.title,
        description: excerpt,
        images: imageUrl ? [imageUrl] : [],
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
  const allPosts = getSortedPostsData();

  // Artigos Relacionados: prioriza mesma categoria, completa com outros recentes
  const relatedPosts = allPosts
    .filter((p) => p.slug !== slug)
    .sort((a, b) => {
      const aSameCat = a.category === postData.category ? 1 : 0;
      const bSameCat = b.category === postData.category ? 1 : 0;
      return bSameCat - aSameCat;
    })
    .slice(0, 3);

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
      '@id': `https://www.estradaadois.com/blog/${slug}`,
    },
    author: {
      '@type': 'Organization',
      name: 'Estrada a Dois',
      url: 'https://www.estradaadois.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Estrada a Dois',
      url: 'https://www.estradaadois.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.estradaadois.com/logo.png',
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
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Post Content (Markdown Rendered) */}
        <div 
          className="prose prose-lg md:prose-xl mx-auto text-[#444444] prose-headings:font-black prose-headings:text-[#0F0F0F] prose-a:text-[#B6D200] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg prose-blockquote:border-l-4 prose-blockquote:border-[#B6D200] prose-blockquote:bg-white prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:shadow-sm prose-blockquote:not-italic prose-blockquote:font-medium prose-strong:text-[#0F0F0F]"
          dangerouslySetInnerHTML={{ __html: postData.contentHtml }}
        />

        {/* SEÇÃO ARTIGOS RELACIONADOS / LEIA TAMBÉM (Internal Linking Automático para SEO) */}
        {relatedPosts.length > 0 && (
          <section className="mt-16 pt-10 border-t border-gray-200">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#B6D200] animate-pulse"></span>
                <h3 className="text-xl md:text-2xl font-black text-[#0F0F0F] uppercase tracking-tight">
                  Leia Também &bull; <span className="text-[#8ac200]">Artigos Recomendados</span>
                </h3>
              </div>
              <a
                href="/"
                className="text-xs md:text-sm font-bold text-gray-500 hover:text-[#0F0F0F] uppercase tracking-wider hidden sm:inline-flex items-center gap-1 transition-colors"
              >
                Ver todos
                <svg className="w-4 h-4 text-[#B6D200]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <a
                  key={related.slug}
                  href={`/blog/${related.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 hover:border-[#B6D200]/70 transition-all duration-300 flex flex-col h-full"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden relative bg-black/10">
                    <img
                      src={related.image}
                      alt={related.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 bg-[#B6D200] text-[#0F0F0F] text-[10px] font-black uppercase px-2.5 py-1 tracking-wider rounded shadow-md z-10">
                      {related.category}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-2">
                      {related.date}
                    </span>
                    <h4 className="text-base font-bold text-[#0F0F0F] leading-snug line-clamp-2 group-hover:text-[#8ac200] transition-colors mb-2">
                      {related.title}
                    </h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-auto">
                      {related.excerpt}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Tags / Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200">
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
