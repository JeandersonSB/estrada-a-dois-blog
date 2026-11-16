'use client';

import Link from 'next/link';

function trackClick(source: string) {
  const w = window as typeof window & {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  };
  const params = { cta_source: source, link_url: '/rota-biker' };
  if (typeof w.gtag === 'function') {
    w.gtag('event', 'rota_biker_cta_click', params);
  } else {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: 'rota_biker_cta_click', ...params });
  }
}

const features = [
  '44 monumentos no mapa',
  'Marque os que já visitou',
  'Monte rotas com até 10 paradas',
];

/**
 * Chamada para o mapa gratuito da Rota Biker.
 * variant="article" aparece no fim dos artigos; variant="home" é a faixa da página inicial.
 */
export function RotaBikerCTA({ articleSlug, variant = 'article' }: { articleSlug?: string; variant?: 'article' | 'home' }) {
  const source = variant === 'home' ? 'home' : `artigo:${articleSlug || ''}`;
  const isHome = variant === 'home';

  return (
    <aside
      aria-label="Mapa gratuito da Rota Biker"
      className={
        isHome
          ? 'relative overflow-hidden rounded-3xl bg-[#B6D200] px-6 py-8 md:px-12 md:py-10 text-[#0F0F0F] shadow-xl'
          : 'mt-12 relative overflow-hidden rounded-2xl bg-[#B6D200] px-6 py-8 md:px-9 md:py-9 text-[#0F0F0F] shadow-lg'
      }
    >
      <div className={isHome ? 'md:flex md:items-center md:justify-between md:gap-10' : ''}>
        <div>
          <p className="text-xs font-black uppercase tracking-widest mb-2">🗺️ Ferramenta gratuita</p>
          <h2 className={isHome ? 'text-3xl md:text-4xl font-black leading-tight mb-3' : 'text-2xl md:text-3xl font-black leading-tight mb-3'}>
            Mapa da Rota Biker
          </h2>
          <p className="font-semibold leading-relaxed mb-5 max-w-2xl">
            Encontre os monumentos da Rota Biker, marque os que você já visitou e planeje sua próxima viagem
            com rota pronta para abrir no Google Maps.
          </p>
          <ul className="flex flex-wrap gap-2 mb-6 md:mb-0">
            {features.map((feature) => (
              <li key={feature} className="rounded-full bg-[#0F0F0F]/10 px-3 py-1 text-sm font-bold">
                ✓ {feature}
              </li>
            ))}
          </ul>
        </div>
        <Link
          href="/rota-biker"
          onClick={() => trackClick(source)}
          className={
            (isHome ? 'md:mt-0 md:shrink-0 ' : 'mt-6 ') +
            'inline-flex items-center justify-center rounded-xl bg-[#0F0F0F] px-7 py-4 font-extrabold text-white hover:bg-white hover:text-[#0F0F0F] transition-colors'
          }
        >
          Abrir o mapa grátis →
        </Link>
      </div>
    </aside>
  );
}
