import { getSortedPostsData } from '@/lib/posts';

function slugifyCategory(cat: string) {
  return cat
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-');
}

// Generate static params for categories
export async function generateStaticParams() {
  const posts = getSortedPostsData();
  const categories = Array.from(new Set(posts.map(p => p.category || '')));
  return categories.filter(Boolean).map((cat) => ({
    slug: slugifyCategory(cat),
  }));
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Clean up slug to display
  const decodedSlug = decodeURIComponent(slug).toLowerCase();
  
  // Filter posts
  const allPosts = getSortedPostsData();
  const posts = allPosts.filter(p => p.category && slugifyCategory(p.category) === decodedSlug);
  
  // Format title for display
  const title = posts.length > 0 ? posts[0].category : decodedSlug.charAt(0).toUpperCase() + decodedSlug.slice(1);

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#0F0F0F] font-sans flex flex-col pb-20">
      
      {/* Category Header */}
      <section className="bg-[#0F0F0F] text-white pt-16 pb-20 px-4 border-b-[8px] border-[#B6D200]">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tight mb-4">
            <span className="text-gray-400 font-normal italic text-3xl">Categoria: </span>
            <span className="text-[#B6D200]">{title}</span>
          </h1>
          <p className="text-gray-400 text-lg">Encontre os melhores artigos sobre {title.toLowerCase()}.</p>
        </div>
      </section>

      <main className="flex-grow max-w-6xl mx-auto px-4 py-16 w-full">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-500">Nenhum artigo encontrado nessa categoria ainda.</h2>
            <a href="/" className="inline-block mt-6 text-[#B6D200] font-bold uppercase tracking-widest hover:underline">
              Voltar para a Home
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.slug} className="bg-[#ffffff] rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300 group border border-gray-100 flex flex-col h-full">
                <a href={`/blog/${post.slug}`} className="block relative overflow-hidden aspect-[4/3]">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors z-10"></div>
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-4 left-4 bg-[#B6D200] text-[#0F0F0F] text-[11px] font-black uppercase px-3 py-1 tracking-widest z-20 shadow-md">
                    {post.category}
                  </span>
                </a>
                <div className="p-6 flex flex-col flex-grow">
                  <div className="text-[12px] text-gray-400 font-bold uppercase tracking-wider mb-2 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-[#B6D200] mr-2"></span>
                    {post.date}
                  </div>
                  <a href={`/blog/${post.slug}`} className="block">
                    <h2 className="text-xl font-bold text-[#0F0F0F] mb-3 leading-snug group-hover:text-[#B6D200] transition-colors line-clamp-2">
                      {post.title}
                    </h2>
                  </a>
                  <p className="text-[#555555] text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                    {post.excerpt}
                  </p>
                  
                  <a href={`/blog/${post.slug}`} className="inline-flex items-center text-[13px] font-black uppercase tracking-widest text-[#0F0F0F] group-hover:text-[#B6D200] transition-colors mt-auto">
                    Ler Relato
                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
