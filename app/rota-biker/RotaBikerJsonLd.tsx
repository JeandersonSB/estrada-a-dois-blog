import monuments from './monuments.json';
import { META_DESCRIPTION, OFFICIAL_LIST_URL, ROTA_BIKER_FAQ, UPDATED_ISO } from './seo';

const SITE = 'https://www.estradaadois.com';
const PAGE = `${SITE}/rota-biker`;

const cleanName = (name: string) => name.replace(/\s*—\s*em construção\s*$/i, '');
const pad = (n: number) => String(n).padStart(2, '0');

// Dados estruturados gerados do mesmo catálogo do mapa: ao mudar monuments.json,
// o JSON-LD acompanha. Nunca descrever este mapa como oficial.
export default function RotaBikerJsonLd() {
  const list = [...monuments].sort((a, b) => a.number - b.number);
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${PAGE}#webpage`,
        url: PAGE,
        name: 'Mapa Rota Biker: monumentos e rotas | Estrada a Dois',
        description: META_DESCRIPTION,
        inLanguage: 'pt-BR',
        dateModified: UPDATED_ISO,
        isPartOf: { '@type': 'WebSite', '@id': `${SITE}/#website`, url: SITE, name: 'Estrada a Dois' },
        isBasedOn: OFFICIAL_LIST_URL,
        mainEntity: { '@id': `${PAGE}#mapa` },
        about: { '@id': `${PAGE}#monumentos` },
      },
      {
        '@type': 'WebApplication',
        '@id': `${PAGE}#mapa`,
        name: 'Mapa Rota Biker do Estrada a Dois',
        url: PAGE,
        applicationCategory: 'TravelApplication',
        operatingSystem: 'Web, Android, iOS',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'BRL' },
        publisher: { '@type': 'Organization', name: 'Estrada a Dois', url: SITE },
      },
      {
        '@type': 'ItemList',
        '@id': `${PAGE}#monumentos`,
        name: 'Monumentos da Rota Biker',
        numberOfItems: list.length,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        itemListElement: list.map((m, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'TouristAttraction',
            name: `Monumento Rota Biker nº ${pad(m.number)}: ${cleanName(m.name)}`,
            address: {
              '@type': 'PostalAddress',
              addressLocality: m.city,
              ...(m.stateCode ? { addressRegion: m.stateCode } : {}),
              addressCountry: m.country === 'Paraguai' ? 'PY' : 'BR',
            },
            geo: { '@type': 'GeoCoordinates', latitude: m.lat, longitude: m.lng },
          },
        })),
      },
      {
        '@type': 'FAQPage',
        '@id': `${PAGE}#faq`,
        mainEntity: ROTA_BIKER_FAQ.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }} />;
}
