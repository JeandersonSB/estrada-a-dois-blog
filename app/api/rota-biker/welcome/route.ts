import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// The Resend idempotency window is 24 hours. This endpoint accepts
// only accounts created in the last 30 minutes, so retries cannot send twice.
const NEW_ACCOUNT_WINDOW_MS = 30 * 60 * 1000;

type FirebaseAccount = {
  localId?: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
  createdAt?: string;
  disabled?: boolean;
  providerUserInfo?: Array<{ providerId?: string }>;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

function welcomeEmail(name: string) {
  const firstName = name.trim().split(/\s+/)[0] || 'viajante';
  const greeting = escapeHtml(firstName);
  return {
    text: `Olá, ${firstName}!

Aqui é o Jeanderson e a Ana Paula, do Estrada a Dois!

Vimos que você se cadastrou no nosso Mapa Rota Biker e queremos agradecer por fazer parte desse projeto.

Criamos essa ferramenta para facilitar a vida de quem ama viajar de moto, descobrir novos destinos e colecionar histórias pela estrada.

Com o mapa, você pode encontrar os monumentos da Rota Biker, planejar trajetos e registrar os lugares que já visitou.

E você está entre os primeiros a utilizar essa ferramenta! 🏍️💚

Estamos sempre buscando melhorar. Se tiver uma sugestão ou encontrar algum problema, basta responder a este e-mail.

Acesse o mapa: https://www.estradaadois.com/rota-biker
Acompanhe nossas viagens: https://www.instagram.com/estrada.a.dois/

Muito obrigado pela confiança e por fazer parte dessa jornada.

Nos vemos na estrada!
Jeanderson e Ana Paula
Estrada a Dois
https://www.estradaadois.com

Este é um e-mail único de boas-vindas ao cadastro no Mapa Rota Biker.`,
    html: `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#f5f6f3;color:#242424;font-family:Arial,Helvetica,sans-serif"><div style="max-width:600px;margin:24px auto;background:#fff;border-radius:12px;overflow:hidden"><div style="background:#242424;padding:27px 30px;font-size:23px;font-weight:800;color:#b6d200">ESTRADA A DOIS</div><div style="padding:30px;line-height:1.65"><h1 style="font-size:23px;margin:0 0 20px">Olá, ${greeting}! 🏍️</h1><p>Aqui é o <strong>Jeanderson e a Ana Paula</strong>, do Estrada a Dois!</p><p>Vimos que você se cadastrou no nosso <strong>Mapa Rota Biker</strong> e queremos agradecer por fazer parte desse projeto.</p><p>Criamos essa ferramenta para facilitar a vida de quem ama viajar de moto, descobrir novos destinos e colecionar histórias pela estrada.</p><p>Com o mapa, você pode encontrar os monumentos da Rota Biker, planejar trajetos e registrar os lugares que já visitou.</p><p><strong>E você está entre os primeiros a utilizar essa ferramenta!</strong> 🏍️💚</p><p>Estamos sempre buscando melhorar. Se tiver alguma sugestão ou encontrar um problema, basta responder a este e-mail.</p><p style="margin:28px 0"><a href="https://www.estradaadois.com/rota-biker" style="display:inline-block;background:#b6d200;color:#242424;font-weight:bold;text-decoration:none;padding:13px 22px;border-radius:6px">Acessar o Mapa Rota Biker</a></p><p>Acompanhe também <a style="color:#487000" href="https://www.instagram.com/estrada.a.dois/">nossas viagens no Instagram</a>.</p><p>Muito obrigado pela confiança e por fazer parte dessa jornada!</p><p><strong>Nos vemos na estrada!</strong></p><p>Jeanderson e Ana Paula<br><strong>Estrada a Dois</strong></p></div><div style="padding:16px 30px;background:#f0f2ec;color:#555;font-size:12px">Mensagem única de boas-vindas ao seu cadastro no Mapa Rota Biker.<br><a href="https://www.estradaadois.com/politica-de-privacidade#rota-biker" style="color:#487000">Política de Privacidade</a></div></div></body></html>`,
  };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  if (!/^Bearer [^\s]+$/.test(authHeader) || authHeader.length > 10000) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const firebaseApiKey = process.env.NEXT_PUBLIC_BIKER_FIREBASE_API_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!firebaseApiKey || !resendApiKey) {
    return NextResponse.json({ error: 'Serviço indisponível' }, { status: 503 });
  }

  try {
    // Identity Toolkit verifies the Firebase ID token server-side.
    // Never trust email, name or UID supplied by the browser.
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseApiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: authHeader.slice(7) }),
        cache: 'no-store',
      },
    );
    if (!authResponse.ok) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const accounts = await authResponse.json() as { users?: FirebaseAccount[] };
    const user = accounts.users?.[0];
    if (!user?.localId || !user.emailVerified || !user.email || user.disabled ||
      !user.providerUserInfo?.some(provider => provider.providerId === 'google.com')) {
      return new NextResponse(null, { status: 204 });
    }

    const ageMs = Date.now() - Number(user.createdAt);
    if (!Number.isFinite(ageMs) || ageMs < 0 || ageMs > NEW_ACCOUNT_WINDOW_MS) {
      // Existing users do not receive retroactive messages.
      return new NextResponse(null, { status: 204 });
    }

    const { text, html } = welcomeEmail(user.displayName || '');
    const sendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `rota-biker-boas-vindas-${user.localId}`,
      },
      body: JSON.stringify({
        from: 'Estrada a Dois <contato@estradaadois.com>',
        to: [user.email],
        reply_to: 'contato@estradaadois.com',
        subject: '🏍️ Obrigado por fazer parte do Estrada a Dois!',
        text,
        html,
      }),
      cache: 'no-store',
    });

    if (!sendResponse.ok && sendResponse.status !== 409) {
      console.error('[rota-biker/welcome] Resend status:', sendResponse.status);
      return NextResponse.json({ error: 'Falha temporária no envio' }, { status: 503 });
    }

    // Resend returns 409 for concurrent same-key requests; the first request wins.
    return new NextResponse(null, { status: 204 });
  } catch {
    console.error('[rota-biker/welcome] Falha ao processar cadastro');
    return NextResponse.json({ error: 'Falha temporária no envio' }, { status: 503 });
  }
}
