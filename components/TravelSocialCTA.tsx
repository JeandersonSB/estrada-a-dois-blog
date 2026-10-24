'use client';

const links = [
  { network: 'instagram', label: 'Seguir no Instagram', href: 'https://www.instagram.com/estrada.a.dois/' },
  { network: 'youtube', label: 'Ver no YouTube', href: 'https://www.youtube.com/@estradaadois2' },
] as const;

function trackClick(articleSlug: string, category: string, network: string, href: string) {
  const w = window as typeof window & {
    dataLayer?: Record<string, unknown>[];
    gtag?: (...args: unknown[]) => void;
  };
  const params = {
    social_network: network,
    article_slug: articleSlug,
    cta_type: category === 'Roteiros' ? 'roteiros_viagens' : 'guia_pratico',
    article_category: category,
    link_url: href,
  };
  if (typeof w.gtag === 'function') {
    w.gtag('event', 'social_cta_click', params);
  } else {
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: 'social_cta_click', ...params });
  }
}

export function TravelSocialCTA({ articleSlug, category = 'Roteiros' }: { articleSlug: string; category?: string }) {
  const isTravel = category === 'Roteiros';
  return (
    <aside aria-label="Acompanhe o Estrada a Dois nas redes sociais" className="mt-12 rounded-2xl bg-[#403939] px-6 py-8 md:px-9 md:py-10 text-white shadow-lg">
      <h2 className="text-xl md:text-2xl font-black mb-3">🏍️ {isTravel ? 'Continue essa viagem com a gente!' : 'Leve essas dicas para a próxima viagem!'}</h2>
      <p className="text-white/90 leading-relaxed mb-6">
        {isTravel
          ? 'Gostou desse roteiro? No nosso Instagram compartilhamos fotos, bastidores e os lugares que descobrimos pelo caminho. Acompanhe nossas próximas aventuras de moto!'
          : 'Acompanhe o Estrada a Dois no Instagram e no YouTube para ver nossas viagens de moto, preparativos e aprendizados na estrada.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        {links.map(({ network, label, href }) => (
          <a
            key={network}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick(articleSlug, category, network, href)}
            className={network === 'instagram'
              ? 'inline-flex items-center justify-center rounded-xl bg-[#B6D200] px-6 py-3 font-extrabold text-[#403939] hover:bg-white transition-colors'
              : 'inline-flex items-center justify-center rounded-xl border-2 border-[#B6D200] px-6 py-3 font-extrabold text-white hover:bg-[#B6D200] hover:text-[#403939] transition-colors'}
          >
            {label} ↗
          </a>
        ))}
      </div>
    </aside>
  );
}
