import { NextRequest, NextResponse } from 'next/server';
import {
  canonicalDraftSlug, createPreviewToken, getDraftFromGitHub,
  isRepoEditor, PREVIEW_SESSION_COOKIE, readEditorSession,
} from '@/lib/draft-preview';
import { isTrustedCmsOrigin } from '@/lib/oauth-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const noStoreHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  // The browser only submits this from the Estrada a Dois CMS / preview manager.
  if (!origin || !isTrustedCmsOrigin(origin)) {
    return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403, headers: noStoreHeaders });
  }
  const token = readEditorSession(request.cookies.get(PREVIEW_SESSION_COOKIE)?.value);
  if (!token) {
    return NextResponse.json({ error: 'Entre com o GitHub para gerar links de prévia.' }, { status: 401, headers: noStoreHeaders });
  }
  if (!(await isRepoEditor(token))) {
    return NextResponse.json({ error: 'Sua conta não tem permissão de edição neste repositório.' }, { status: 403, headers: noStoreHeaders });
  }
  let incoming: unknown;
  try { incoming = await request.json(); } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400, headers: noStoreHeaders });
  }
  const slug = canonicalDraftSlug((incoming as { slug?: unknown } | null)?.slug);
  if (!slug) {
    return NextResponse.json({ error: 'Informe o identificador válido do artigo.' }, { status: 400, headers: noStoreHeaders });
  }
  const draft = await getDraftFromGitHub(slug, token);
  if (!draft) {
    return NextResponse.json({ error: 'Rascunho não encontrado. Salve o artigo como Rascunho no Admin antes de criar a prévia.' }, { status: 404, headers: noStoreHeaders });
  }
  const previewToken = createPreviewToken(slug);
  const url = 'https://www.estradaadois.com/previa/' + encodeURIComponent(slug) + '?token=' + encodeURIComponent(previewToken);
  return NextResponse.json({
    url, title: draft.title, expiresInDays: 7,
  }, { status: 200, headers: noStoreHeaders });
}
