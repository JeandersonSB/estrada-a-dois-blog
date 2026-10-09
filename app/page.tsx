import { getSortedPostsData, slugifyCategory } from '@/lib/posts';
import { SmartImage } from '@/components/SmartImage';
import Link from 'next/link';

export const revalidate = 60;

const categories = [
  {
    name: 'Roteiros',
    slug: 'roteiros',
    subtitle: 'Estradas que percorremos, custos, paradas e experiências reais de viagem',
  },
  {
    name: 'Dicas',
    slug: 'dicas',
    subtitle: 'Planejamento, segurança e aprendizados para colocar a próxima viagem na estrada',
  },
  {
    name: 'Equipamentos',
    slug: 'equipamentos',
    subtitle: 'Equipamentos e acessórios pensados para quem viaja de moto',
  },
  {
    name: 'Manutenção',
    slug: 'manutencao',
    subtitle: 'Cuidados com a moto antes, durante e depois de pegar a estrada',
  },
];

export default function Home() {
  const posts = getSortedPostsData();

  const featuredMain = posts[0] || null;
  const featuredRoute = posts.find(
    (post) =>
      post.category &&
      slugifyCategory(post.category) === 'roteiros' &&
      post.slug !== featuredMain?.slug
  ) || posts.find((post) => post.category && slugifyCategory(post.category) === 'roteiros') || null;

  const featuredGuide = posts.find(
    (post) => post.slug !== featuredMain?.slug && post.slug !== featuredRoute?.slug
  ) || null;

  const roteiroStories = posts
    .filter((post) => post.category && slugifyCategory(post.category) === 'roteiros')
    .slice(0, 4);

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <section className="bg-[#0F0F0F] pt-6 md:pt-8 pb-10 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="sr-only">Estrada a Dois — Viagens de moto, roteiros e dicas</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {featuredMain && (
              <div className="lg:col-span-2 h-[400px] md:h-[520px]">
                <Link href={`/blog/${featuredMain.slug}`} className="block relative w-full h-full rounded-2xl overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10"></div>
                  <SmartImage
                    src={featuredMain.image}
                    alt={featuredMain.title}
                    priority
                    sizes="(min-width: 1024px) 66vw, 100vw"
                    className="object-cover transform group-hover:scale-105 transition-transform duration-700"
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
                </Link>
              </div>
            )}

            <div className="flex flex-col gap-6 h-[400px] md:h-[520px]">
              {featuredRoute && (
                <div className="flex-1 relative rounded-2xl overflow-hidden group border-t-4 border-t-[#B6D200] border-x border-b border-white/10 shadow-xl">
                  <Link href={`/blog/${featuredRoute.slug}`} className="block w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent z-10"></div>
                    <SmartImage
                      src={featuredRoute.image}
                      alt={featuredRoute.title}
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-0 left-0 p-4 md:p-6 z-20 w-full">
                      <span className="inline-flex bg-[#B6D200] text-[#0F0F0F] text-[10px] md:text-[11px] font-black uppercase px-2.5 py-1 tracking-wider rounded mb-2">
                        🧭 Diário de Bordo
                      </span>
                      <h3 className="text-base md:text-xl font-bold text-white leading-tight group-hover:text-[#B6D200] transition-colors line-clamp-2">
                        {featuredRoute.title}
                      </h3>
                    </div>
                  </Link>
                </div>
              )}

              {featuredGuide && (
                <div className="flex-1 relative rounded-2xl overflow-hidden group border border-white/10">
                  <Link href={`/blog/${featuredGuide.slug}`} className="block w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10"></div>
                    <SmartImage
                      src={featuredGuide.image}
                      alt={featuredGuide.title}
                      sizes="(min-width: 1024px) 33vw, 100vw"
                      className="object-cover transform group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute bottom-0 left-0 p-6 z-20 w-full">
                      <span className="text-[#B6D200] text-[11px] font-black uppercase tracking-widest mb-2 block">
                        {featuredGuide.category}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-white leading-tight group-hover:text-[#B6D200] transition-colors line-clamp-2">
                        {featuredGuide.title}
                      </h3>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {roteiroStories.length > 0 && (
        <section className="bg-[#121212] text-white py-5 px-4 border-t border-white/10 border-b-[6px] border-[#B6D200]">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[#B6D200] text-[11px] md:text-xs font-black uppercase tracking-widest">
                🧭 Nossas viagens a dois
              </span>
              <Link href="/categoria/roteiros" className="text-[11px] md:text-xs font-bold text-gray-400 hover:text-[#B6D200] uppercase tracking-wider">
                Ver todos os roteiros →
              </Link>
            </div>

            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {roteiroStories.map((story) => (
                <Link
                  key={story.slug}
                  href={`/blog/${story.slug}`}
                  className="group shrink-0 w-[270px] sm:w-auto flex items-center gap-3 bg-[#1c1c1c] hover:bg-[#242424] p-2.5 rounded-xl border border-white/10 hover:border-[#B6D200]/70 transition-all"
                >
                  <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 relative bg-black/40">
                    <SmartImage src={story.image} alt={story.title} sizes="56px" className="object-cover group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-[#B6D200] uppercase tracking-wider block">Roteiro real</span>
                    <h4 className="text-white text-xs md:text-[13px] font-bold leading-snug line-clamp-2 group-hover:text-[#B6D200] transition-colors">
                      {story.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <main className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        {categories.map((cat) => {
          const categoryPosts = posts
            .filter((post) => post.category && slugifyCategory(post.category) === cat.slug)
            .slice(0, 3);
          const totalCategoryPosts = posts.filter(
            (post) => post.category && slugifyCategory(post.category) === cat.slug
          ).length;

          return (
            <section key={cat.slug} className="border-b border-gray-200/80 pb-16 last:border-0 last:pb-0">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-3.5 h-3.5 bg-[#B6D200] rounded-sm"></span>
                    <h2 className="font-brand text-2xl md:text-3xl text-[#0F0F0F] uppercase tracking-wide">
                      {cat.name}
                    </h2>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base font-medium">{cat.subtitle}</p>
                </div>
                <Link href={`/categoria/${cat.slug}`} className="text-xs font-black uppercase tracking-widest text-[#0F0F0F] hover:text-[#8ac200] transition-colors">
                  Ver mais {cat.name} →
                </Link>
              </div>

              {categoryPosts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryPosts.map((post) => (
                      <article key={post.slug} className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all group border border-gray-100 flex flex-col h-full">
                        <Link href={`/blog/${post.slug}`} className="block relative overflow-hidden aspect-[4/3]">
                          <SmartImage
                            src={post.image}
                            alt={post.title}
                            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-4 left-4 bg-[#B6D200] text-[#0F0F0F] text-[11px] font-black uppercase px-3 py-1 tracking-widest shadow-md">
                            {post.category}
                          </span>
                        </Link>
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="text-[12px] text-gray-600 font-bold uppercase tracking-wider mb-2">{post.date}</div>
                          <Link href={`/blog/${post.slug}`}>
                            <h3 className="text-xl font-bold text-[#0F0F0F] mb-3 leading-snug group-hover:text-[#B6D200] transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                          </Link>
                          <p className="text-[#444444] text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">{post.excerpt}</p>
                          <Link href={`/blog/${post.slug}`} className="text-[13px] font-black uppercase tracking-widest text-[#0F0F0F] group-hover:text-[#B6D200] transition-colors mt-auto">
                            Ler artigo →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="flex justify-center mt-10">
                    <Link href={`/categoria/${cat.slug}`} className="bg-[#0F0F0F] text-white font-black uppercase tracking-widest text-xs px-8 py-3.5 hover:bg-[#B6D200] hover:text-[#0F0F0F] transition-all shadow-md rounded-sm">
                      Ver mais em {cat.name} ({totalCategoryPosts})
                    </Link>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center py-12">
                  <h3 className="text-base font-bold text-[#0F0F0F] mb-1">Novos conteúdos de {cat.name} em breve</h3>
                  <p className="text-gray-500 text-sm">Estamos preparando novos conteúdos para esta seção.</p>
                </div>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}
