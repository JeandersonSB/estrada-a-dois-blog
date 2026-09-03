import { getSortedPostsData, slugifyCategory } from '@/lib/posts';

export default function Home() {
  const allPosts = getSortedPostsData();

  // If there are no posts yet, fallback to an empty array
  const posts = allPosts.length > 0 ? allPosts : [];

  // Split posts for the new Hero grid layout
  const featuredMain = posts.length > 0 ? posts[0] : null;
  const featuredSide1 = posts.length > 1 ? posts[1] : null;
  const featuredSide2 = posts.length > 2 ? posts[2] : null;

  // The rest of the posts go to the grid below
  const recentPosts = posts.length > 3 ? posts.slice(3) : [];

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      
      {/* FEATURED POSTS BANNER (Editorial Style) */}
      <section className="bg-[#0F0F0F] pt-10 pb-16 px-4 border-b-[8px] border-[#B6D200]">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Featured (Spans 2 columns on desktop) */}
            {featuredMain && (
              <div className="lg:col-span-2 h-[400px] md:h-[520px]">
                <a href={`/blog/${featuredMain.slug}`} className="block relative w-full h-full rounded-2xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:from-black/90"></div>
                  <img 
                    src={featuredMain.image} 
                    alt={featuredMain.title} 
                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                  />
                  <div className="absolute bottom-0 left-0 p-6 md:p-10 z-20 w-full">
                    <span className="inline-block bg-[#B6D200] text-[#0F0F0F] text-[10px] md:text-xs font-black uppercase px-3 py-1.5 tracking-widest mb-4 shadow-sm">
                      {featuredMain.category}
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 leading-[1.1] group-hover:text-[#B6D200] transition-colors line-clamp-3">
                      {featuredMain.title}
                    </h2>
                    <p className="text-gray-300 text-sm md:text-base line-clamp-2 max-w-2xl font-medium">
                      {featuredMain.excerpt}
                    </p>
                  </div>
                </a>
              </div>
            )}

            {/* Side Featured (Stacked 2 rows) */}
            <div className="flex flex-col gap-6 h-[400px] md:h-[520px]">
              {featuredSide1 && (
                <div className="flex-1 relative rounded-2xl overflow-hidden group">
                  <a href={`/blog/${featuredSide1.slug}`} className="block w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-300 group-hover:from-black/80"></div>
                    <img 
                      src={featuredSide1.image} 
                      alt={featuredSide1.title} 
                      className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                      <span className="inline-block text-[#B6D200] text-[11px] font-black uppercase tracking-widest mb-2 drop-shadow-md">
                        {featuredSide1.category}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-white leading-tight group-hover:text-[#B6D200] transition-colors line-clamp-2">
                        {featuredSide1.title}
                      </h3>
                    </div>
                  </a>
                </div>
              )}
              {featuredSide2 && (
                <div className="flex-1 relative rounded-2xl overflow-hidden group">
                  <a href={`/blog/${featuredSide2.slug}`} className="block w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 transition-opacity duration-300 group-hover:from-black/80"></div>
                    <img 
                      src={featuredSide2.image} 
                      alt={featuredSide2.title} 
                      className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
                    />
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                      <span className="inline-block text-[#B6D200] text-[11px] font-black uppercase tracking-widest mb-2 drop-shadow-md">
                        {featuredSide2.category}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-white leading-tight group-hover:text-[#B6D200] transition-colors line-clamp-2">
                        {featuredSide2.title}
                      </h3>
                    </div>
                  </a>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </section>

      {/* CATEGORY SECTIONS */}
      <main className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {[
          {
            name: 'Notícias',
            slug: 'noticias',
            subtitle: 'Lançamentos, tecnologia, mercado e novidades do mundo das duas rodas',
          },
          {
            name: 'Roteiros',
            slug: 'roteiros',
            subtitle: 'Estradas inesquecíveis, roteiros detalhados e viagens a dois',
          },
          {
            name: 'Dicas',
            slug: 'dicas',
            subtitle: 'Conselhos práticos para pilotagem, segurança e planejamento',
          },
          {
            name: 'Manutenção',
            slug: 'manutencao',
            subtitle: 'Cuidados essenciais, mecânica preventiva e conservação da moto',
          },
          {
            name: 'Equipamentos',
            slug: 'equipamentos',
            subtitle: 'Análises de capacetes, jaquetas, botas e acessórios indispensáveis',
          },
        ].map((cat) => {
          const categoryPosts = allPosts
            .filter((p) => p.category && slugifyCategory(p.category) === cat.slug)
            .slice(0, 3);
          const totalCategoryPosts = allPosts.filter((p) => p.category && slugifyCategory(p.category) === cat.slug).length;

          return (
            <section key={cat.slug} className="border-b border-gray-200/80 pb-16 last:border-0 last:pb-0">
              
              {/* Category Header */}
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-3.5 h-3.5 bg-[#B6D200] rounded-sm"></span>
                    <h2 className="font-brand text-2xl md:text-3xl text-[#0F0F0F] uppercase tracking-wide">
                      {cat.name}
                    </h2>
                  </div>
                  <p className="text-gray-500 text-sm md:text-base font-medium">
                    {cat.subtitle}
                  </p>
                </div>

                <a
                  href={`/categoria/${cat.slug}`}
                  className="inline-flex items-center text-xs font-black uppercase tracking-widest text-[#0F0F0F] hover:text-[#8ac200] transition-colors group self-start md:self-auto"
                >
                  Ver mais {cat.name}
                  <svg className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>

              {/* 3 Articles Grid */}
              {categoryPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryPosts.map((post) => (
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
                            <h3 className="text-xl font-bold text-[#0F0F0F] mb-3 leading-snug group-hover:text-[#B6D200] transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                          </a>
                          <p className="text-[#555555] text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">
                            {post.excerpt}
                          </p>
                          
                          <a href={`/blog/${post.slug}`} className="inline-flex items-center text-[13px] font-black uppercase tracking-widest text-[#0F0F0F] group-hover:text-[#B6D200] transition-colors mt-auto">
                            Ler Artigo
                            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                            </svg>
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>

                  {/* Ver mais button */}
                  <div className="flex justify-center mt-10">
                    <a
                      href={`/categoria/${cat.slug}`}
                      className="inline-flex items-center bg-[#0F0F0F] text-[#ffffff] font-black uppercase tracking-widest text-xs px-8 py-3.5 hover:bg-[#B6D200] hover:text-[#0F0F0F] transition-all duration-300 shadow-md hover:shadow-lg rounded-sm"
                    >
                      Ver mais em {cat.name} ({totalCategoryPosts})
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 rounded-full bg-[#f8f9fa] flex items-center justify-center text-gray-400 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-bold text-[#0F0F0F] mb-1">Novos conteúdos de {cat.name} em breve</h4>
                  <p className="text-gray-400 text-sm max-w-md mb-4">Estamos preparando relatos e publicações exclusivas para esta seção. Acompanhe nossas novidades.</p>
                  <a
                    href={`/categoria/${cat.slug}`}
                    className="inline-flex items-center text-xs font-black uppercase tracking-wider text-[#0F0F0F] bg-gray-100 hover:bg-[#B6D200] px-5 py-2 rounded transition-colors"
                  >
                    Explorar categoria &rarr;
                  </a>
                </div>
              )}

            </section>
          );
        })}
      </main>
    </div>
  );
}
