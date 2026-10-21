import type { Metadata } from 'next';
import Explorer from './Explorer';
export const metadata: Metadata = {
  title: 'Rota Biker — meu mapa de visitas',
  description: 'Marque os monumentos que já visitou, planeje suas próximas paradas e acompanhe seu progresso.',
  manifest: '/rota-biker.webmanifest',
  appleWebApp: { capable: true, title: 'Rota Biker', statusBarStyle: 'default' },
  alternates: { canonical: '/rota-biker' },
};
export default function Page() { return <Explorer />; }
