import { getSortedPostsData } from '@/lib/posts';

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

      {/* RECENT POSTS GRID */}
      <main className="max-w-6xl mx-auto px-4 py-20">
        
        <h2 className="font-brand text-3xl md:text-4xl text-[#0F0F0F] uppercase mb-12 tracking-wide border-l-8 border-[#B6D200] pl-4">
          Últimos <span className="italic">Relatos</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {recentPosts.map((post) => (
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
                  Ler Relato
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </a>
              </div>
            </article>
          ))}

        </div>
        
        {/* Load More Button */}
        {recentPosts.length > 0 && (
          <div className="flex justify-center mt-16">
            <button className="bg-[#0F0F0F] text-[#ffffff] font-black uppercase tracking-widest text-sm px-10 py-4 hover:bg-[#B6D200] hover:text-[#0F0F0F] transition-all duration-300 shadow-lg hover:shadow-xl rounded-sm">
              Carregar Mais Histórias
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
