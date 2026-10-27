import type { Metadata } from 'next';
import Explorer from './Explorer';
import MapGuide from './MapGuide';
export const metadata: Metadata = {
  title: { absolute: 'Mapa Rota Biker: monumentos e rotas | Estrada a Dois' },
  description: 'Explore os monumentos da Rota Biker, planeje rotas com várias paradas e marque os locais visitados. Use grátis no celular ou computador.',
  manifest: '/rota-biker.webmanifest',
  appleWebApp: { capable: true, title: 'Rota Biker', statusBarStyle: 'default' },
  alternates: { canonical: '/rota-biker' },
};
export default function Page() { return <><Explorer /><MapGuide /></>; }
