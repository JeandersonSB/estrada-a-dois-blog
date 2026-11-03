/* eslint-disable @next/next/no-img-element */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import {
  canonicalDraftSlug, getDraftFromGitHub, githubDraftImage, isValidPreviewToken,
} from '@/lib/draft-preview';
import { formatDateBR, addTargetBlankToExternalLinks } from '@/lib/posts';
import { TravelSocialCTA } from '@/components/TravelSocialCTA';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata: Metadata = {
  title: 'Pré-visualização privada de artigo',
  description: 'Página de revisão de rascunho não publicado do Estrada a Dois.',
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
  referrer: 'no-referrer',
};

export default async function DraftPreviewPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { slug: rawSlug } = await params;
  const { token: rawToken } = await searchParams;
  const slug = canonicalDraftSlug(rawSlug);
  const token = typeof rawToken === 'string' ? rawToken : null;
  if (!slug || !isValidPreviewToken(token, slug)) notFound();

  const draft = await getDraftFromGitHub(slug);
  // The link stops serving a draft after publication, even before its seven-day expiry.
  if (!draft) notFound();

  const processed = await remark().use(remarkGfm).use(remarkHtml).process(draft.markdown);
  const html = addTargetBlankToExternalLinks(processed.toString()).replace(
    /src="(\/images\/blog\/[^"]+)"/g,
    (_match, path: string) => 'src="' + githubDraftImage(path) + '"',
  );
  const cover = draft.image && draft.image.startsWith('/images/blog/')
    ? githubDraftImage(draft.image)
    : draft.image;

  return (
    <main className="bg-[#f8f9fa] min-h-screen" style={{ color: '#444' }}>
      <article className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-9 rounded-xl border-2 border-[#B6D200] bg-white px-5 py-4 text-center">
          <p className="font-black text-[#403939] text-lg">Pré-visualização · Artigo não publicado</p>
          <p className="text-sm text-gray-600 mt-1">Link de revisão temporário. Esta página não aparece no blog público.</p>
        </div>
        <header className="mb-10 text-center">
          <span className="inline-block bg-[#B6D200] text-[#0F0F0F] text-xs font-black uppercase px-4 py-1.5 tracking-widest mb-6">{draft.category}</span>
          <h1 className="text-4xl md:text-5xl font-black text-[#0F0F0F] mb-6 leading-tight">{draft.title}</h1>
          <div className="text-gray-500 font-bold uppercase tracking-widest text-sm flex items-center justify-center">
            <span>Por Estrada a Dois</span>
            {draft.date && <><span className="w-1.5 h-1.5 rounded-full bg-[#B6D200] mx-3" /><time dateTime={draft.date}>{formatDateBR(draft.date)}</time></>}
          </div>
        </header>
        {cover && (
          <div className="relative w-full aspect-[16/9] md:h-[500px] mb-12 rounded-2xl overflow-hidden shadow-2xl">
            <img src={cover} alt={draft.image_alt || draft.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <div className="prose prose-lg md:prose-xl mx-auto text-[#444444] prose-headings:font-black prose-headings:text-[#0F0F0F] prose-a:text-[#B6D200] prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg prose-blockquote:border-l-4 prose-blockquote:border-[#B6D200] prose-blockquote:bg-white prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:shadow-sm prose-blockquote:not-italic prose-blockquote:font-medium prose-strong:text-[#0F0F0F]"
          dangerouslySetInnerHTML={{ __html: html }} />
        {['Roteiros', 'Dicas', 'Equipamentos', 'Manutenção'].includes(draft.category) && (
          <TravelSocialCTA articleSlug={slug} category={draft.category} />
        )}
        <div className="mt-12 text-center text-sm text-gray-500">
          Conteúdo sujeito a revisão. Para ver a versão definitiva, aguarde a publicação no Estrada a Dois.
        </div>
      </article>
    </main>
  );
}
