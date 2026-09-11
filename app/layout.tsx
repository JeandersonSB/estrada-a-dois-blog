import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CookieBanner } from '@/components/CookieBanner';

const inter = Inter({ subsets: ['latin'] });

const queraBrand = localFont({
  src: './fonts/Quera.woff2',
  variable: '--font-brand',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://estrada-a-dois-blog.vercel.app'),
  title: {
    default: 'Estrada a Dois | Portal de Notícias e Motociclismo',
    template: '%s | Estrada a Dois',
  },
  description: 'O portal definitivo sobre motociclismo: notícias, lançamentos de motos, modelos, tecnologia e equipamentos.',
  keywords: ['motos', 'motociclismo', 'lançamentos de motos', 'motos elétricas', 'equipamentos para motociclistas', 'estrada a dois'],
  authors: [{ name: 'Estrada a Dois' }],
  creator: 'Estrada a Dois',
  publisher: 'Estrada a Dois',
  openGraph: {
    title: 'Estrada a Dois | Portal de Notícias e Motociclismo',
    description: 'O portal definitivo sobre motociclismo: notícias, lançamentos de motos, modelos, tecnologia e equipamentos.',
    url: 'https://estrada-a-dois-blog.vercel.app',
    siteName: 'Estrada a Dois',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estrada a Dois | Portal de Notícias e Motociclismo',
    description: 'O portal definitivo sobre motociclismo: notícias, lançamentos de motos, modelos, tecnologia e equipamentos.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} ${queraBrand.variable} min-h-screen flex flex-col`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  );
}
