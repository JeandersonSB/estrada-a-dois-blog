import { formatDateBR, getSortedPostsData, slugifyCategory } from '@/lib/posts';
import { SmartImage } from '@/components/SmartImage';
import { RotaBikerCTA } from '@/components/RotaBikerCTA';
import { HomeHero, type HeroSlide, type RoadItem } from '@/components/HomeHero';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

// O conteúdo da home só muda quando um novo deploy é publicado.
// Mantê-la totalmente estática evita revalidação em tempo de requisição.
export const revalidate = false;

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

  const isRoteiro = (post: { category?: string }) =>
    Boolean(post.category && slugifyCategory(post.category) === 'roteiros');

  // Carrossel: as 5 viagens (roteiros) mais recentes, com os números reais
  // preenchidos no painel (distância, duração e gasto). Campos vazios somem.
  const heroSlides: HeroSlide[] = posts.filter(isRoteiro).slice(0, 5).map((post) => ({
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    image: post.image,
    date: formatDateBR(post.date),
    stats: [
      post.trip_distance ? { value: post.trip_distance, label: 'distância' } : null,
      post.trip_duration ? { value: post.trip_duration, label: 'duração' } : null,
      post.trip_cost ? { value: post.trip_cost, label: 'gasto do casal' } : null,
    ].filter((stat): stat is { value: string; label: string } => stat !== null),
  }));

  // Faixa em movimento: os demais artigos (fora do carrossel).
  const heroSlugs = new Set(heroSlides.map((slide) => slide.slug));
  const roadItems: RoadItem[] = posts
    .filter((post) => !heroSlugs.has(post.slug))
    .slice(0, 10)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      image: post.image,
      label: isRoteiro(post) ? 'Roteiro real' : post.category,
    }));

  return (
    <div className="bg-[#f8f9fa] min-h-screen">
      <h1 className="sr-only">Estrada a Dois — Viagens de moto, roteiros e dicas</h1>
      <HomeHero slides={heroSlides} road={roadItems} />

      <main className="max-w-6xl mx-auto px-4 py-16 space-y-20">
        <RotaBikerCTA variant="home" />

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
                    <span className="w-3.5 h-3.5 bg-[#9FD131] rounded-sm"></span>
                    <h2 className="font-brand text-2xl md:text-3xl text-[#1C1C1C] uppercase tracking-wide">
                      {cat.name}
                    </h2>
                  </div>
                  <p className="text-gray-600 text-sm md:text-base font-medium">{cat.subtitle}</p>
                </div>
                <Link href={`/categoria/${cat.slug}`} className="text-xs font-black uppercase tracking-widest text-[#1C1C1C] hover:text-[#4A7310] transition-colors">
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
                            sizes="(min-width: 1024px) 363px, (min-width: 768px) calc(50vw - 28px), calc(100vw - 32px)"
                            className="object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-4 left-4 bg-[#9FD131] text-[#1C1C1C] text-[11px] font-black uppercase px-3 py-1 tracking-widest shadow-md">
                            {post.category}
                          </span>
                        </Link>
                        <div className="p-6 flex flex-col flex-grow">
                          <div className="text-[12px] text-gray-600 font-bold uppercase tracking-wider mb-2">{formatDateBR(post.date)}</div>
                          <Link href={`/blog/${post.slug}`}>
                            <h3 className="text-xl font-bold text-[#1C1C1C] mb-3 leading-snug group-hover:text-[#4A7310] transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                          </Link>
                          <p className="text-[#444444] text-sm leading-relaxed line-clamp-3 mb-6 flex-grow">{post.excerpt}</p>
                          <Link href={`/blog/${post.slug}`} className="text-[13px] font-black uppercase tracking-widest text-[#1C1C1C] group-hover:text-[#4A7310] transition-colors mt-auto">
                            Ler artigo →
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="flex justify-center mt-10">
                    <Link href={`/categoria/${cat.slug}`} className="bg-[#1C1C1C] text-white font-black uppercase tracking-widest text-xs px-8 py-3.5 hover:bg-[#9FD131] hover:text-[#1C1C1C] transition-all shadow-md rounded-sm">
                      Ver mais em {cat.name} ({totalCategoryPosts})
                    </Link>
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center py-12">
                  <h3 className="text-base font-bold text-[#1C1C1C] mb-1">Novos conteúdos de {cat.name} em breve</h3>
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