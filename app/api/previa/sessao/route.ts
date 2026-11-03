import { NextRequest, NextResponse } from 'next/server';
import {
  encryptEditorSession, isRepoEditor, PREVIEW_SESSION_COOKIE, PREVIEW_SESSION_SECONDS,
} from '@/lib/draft-preview';
import { isTrustedCmsOrigin } from '@/lib/oauth-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const headers = {
  'Cache-Control': 'no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  if (!origin || !isTrustedCmsOrigin(origin)) {
    return NextResponse.json({ error: 'Origem não autorizada.' }, { status: 403, headers });
  }
  let payload: unknown;
  try { payload = await request.json(); } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400, headers });
  }
  const accessToken = (payload as { token?: unknown } | null)?.token;
  if (typeof accessToken !== 'string' || accessToken.length < 12 || accessToken.length > 4096) {
    return NextResponse.json({ error: 'Autorização GitHub inválida.' }, { status: 400, headers });
  }
  if (!(await isRepoEditor(accessToken))) {
    return NextResponse.json({ error: 'Sua conta do GitHub não possui permissão para editar o Estrada a Dois.' }, { status: 403, headers });
  }
  const response = NextResponse.json({ ok: true }, { headers });
  response.cookies.set(PREVIEW_SESSION_COOKIE, encryptEditorSession(accessToken), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PREVIEW_SESSION_SECONDS,
  });
  return response;
}
