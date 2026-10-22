import { NextResponse } from 'next/server';
import { newOauthState, OAUTH_STATE_COOKIE, OAUTH_STATE_MAX_AGE_SECONDS } from '@/lib/oauth-security';

export async function GET() {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new NextResponse('Login temporariamente indisponível.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // The state is unpredictable and bound to this browser through an HttpOnly cookie.
  // GitHub returns it to /api/callback, where it must be verified before token exchange.
  const state = newOauthState();
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('scope', 'repo,user');
  githubAuthUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(githubAuthUrl.toString(), 302);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
  });
  return response;
}
