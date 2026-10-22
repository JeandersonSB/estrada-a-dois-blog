import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  hasValidOauthState,
  OAUTH_STATE_COOKIE,
  safeJsonForInlineScript,
  trustedCmsOrigins,
} from '@/lib/oauth-security';

function clearStateCookie(response: NextResponse): NextResponse {
  response.cookies.set(OAUTH_STATE_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

function authError(message: string, status: number): NextResponse {
  return clearStateCookie(new NextResponse(message, {
    status,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'Referrer-Policy': 'no-referrer',
    },
  }));
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  // A returned code is useless unless this is the browser that started the
  // sign-in flow. The state must match the one-time HttpOnly cookie.
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;
  const receivedState = params.get('state');
  if (!hasValidOauthState(expectedState, receivedState)) {
    return authError('Sessão de login inválida ou expirada. Feche esta janela e tente novamente.', 403);
  }

  if (params.has('error')) {
    return authError('A autorização do GitHub não foi concluída.', 400);
  }

  const code = params.get('code');
  if (!code || code.length > 2048) {
    return authError('Código de autorização inválido.', 400);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return authError('Login temporariamente indisponível.', 503);
  }

  try {
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });
    if (!tokenResponse.ok) {
      return authError('Não foi possível concluir a autenticação.', 502);
    }

    const data: unknown = await tokenResponse.json();
    const accessToken =
      data && typeof data === 'object' && 'access_token' in data
        ? (data as { access_token?: unknown }).access_token
        : null;
    if (typeof accessToken !== 'string' || !accessToken || accessToken.length > 4096) {
      return authError('O GitHub não retornou uma autorização válida.', 400);
    }

    // The CMS expects a string message, not an object. Serialize the full
    // message safely because OAuth tokens must never be interpolated raw in HTML.
    const successMessage = 'authorization:github:success:' +
      JSON.stringify({ token: accessToken, provider: 'github' });
    const safeMessage = safeJsonForInlineScript(successMessage);
    const safeAllowedOrigins = safeJsonForInlineScript(trustedCmsOrigins());
    const nonce = randomBytes(20).toString('base64');

    const html = [
      '<!doctype html>',
      '<html lang="pt-BR"><head><meta charset="utf-8">',
      '<meta name="referrer" content="no-referrer">',
      '<title>Autorização do painel</title></head><body>',
      '<script nonce="' + nonce + '">',
      '(function () {',
      '  "use strict";',
      '  const openerWindow = window.opener;',
      '  if (!openerWindow) { window.close(); return; }',
      '  const allowedOrigins = new Set(' + safeAllowedOrigins + ');',
      '  const successMessage = ' + safeMessage + ';',
      '  let delivered = false;',
      '  function deliver(origin) {',
      '    if (delivered || !allowedOrigins.has(origin)) return;',
      '    delivered = true;',
      '    window.removeEventListener("message", receiveMessage);',
      '    openerWindow.postMessage(successMessage, origin);',
      '    window.setTimeout(function () { window.close(); }, 150);',
      '  }',
      '  function receiveMessage(event) {',
      '    if (event.source !== openerWindow || !allowedOrigins.has(event.origin)) return;',
      '    if (event.data !== "authorizing:github") return;',
      '    deliver(event.origin);',
      '  }',
      '  window.addEventListener("message", receiveMessage);',
      '  // This initial notification contains no token and is required by the CMS.',
      '  openerWindow.postMessage("authorizing:github", "*");',
      '  // Preserve compatibility with CMS versions that do not echo the handshake.',
      '  // The token is sent only to explicitly listed, exact trusted origins.',
      '  window.setTimeout(function () {',
      '    if (delivered) return;',
      '    for (const origin of allowedOrigins) {',
      '      try { openerWindow.postMessage(successMessage, origin); } catch (_) {}',
      '    }',
      '    window.setTimeout(function () { window.close(); }, 200);',
      '  }, 900);',
      '})();',
      '</script>',
      '</body></html>',
    ].join('\n');

    return clearStateCookie(new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy':
          "default-src 'none'; script-src 'nonce-" + nonce +
          "'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
      },
    }));
  } catch {
    // Never log the exchanged token, GitHub code or browser auth state.
    return authError('Ocorreu um erro ao autenticar. Tente novamente.', 502);
  }
}
