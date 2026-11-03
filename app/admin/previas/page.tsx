import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { PREVIEW_SESSION_COOKIE, readEditorSession } from '@/lib/draft-preview';
import { PreviewLinks } from './PreviewLinks';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Compartilhar rascunhos',
  robots: { index: false, follow: false, noarchive: true },
};

export default async function PreviewAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const cookieStore = await cookies();
  const token = readEditorSession(cookieStore.get(PREVIEW_SESSION_COOKIE)?.value);
  const params = await searchParams;
  return (
    <main className="min-h-screen bg-[#f8f9fa] px-4 py-14">
      <div className="max-w-2xl mx-auto rounded-2xl bg-white shadow-lg p-6 md:p-10">
        <div className="text-xs font-black uppercase tracking-widest text-[#768800] mb-4">Estrada a Dois · Painel Admin</div>
        <h1 className="text-3xl font-black text-[#282828] mb-3">Compartilhar prévia de artigo</h1>
        <p className="text-gray-600 mb-6">
          Envie o rascunho para a Paula revisar no celular, com a aparência do blog,
          antes de publicar. O link vale sete dias.
        </p>
        <PreviewLinks hasSession={Boolean(token)} initialSlug={params.slug || ''} />
        <div className="border-t border-gray-200 mt-8 pt-5">
          <a className="text-sm font-semibold underline text-[#403939]" href="https://www.estradaadois.com/admin/">
            Voltar ao editor de artigos
          </a>
        </div>
      </div>
    </main>
  );
}
