import type { Metadata } from 'next';
import Explorer from './Explorer';
import MapGuide from './MapGuide';
import RotaBikerJsonLd from './RotaBikerJsonLd';
import { META_DESCRIPTION } from './seo';
export const metadata: Metadata = {
  title: { absolute: 'Mapa Rota Biker: monumentos e rotas | Estrada a Dois' },
  description: META_DESCRIPTION,
  manifest: '/rota-biker.webmanifest',
  appleWebApp: { capable: true, title: 'Rota Biker', statusBarStyle: 'default' },
  alternates: { canonical: '/rota-biker' },
};
export default function Page() { return <><RotaBikerJsonLd /><Explorer /><MapGuide /></>; }
