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

Seu cadastro no Mapa Rota Biker foi confirmado. Obrigado por utilizar a ferramenta.

Com o mapa, você pode encontrar os monumentos da Rota Biker, planejar trajetos e registrar os lugares que já visitou.

Comece pelo tutorial em vídeo: https://www.youtube.com/watch?v=I-7Q-FWERXg

Suas marcações ficam associadas à sua conta Google para acesso em outros dispositivos.

Estamos sempre buscando melhorar. Se tiver uma sugestão ou encontrar algum problema, basta responder a este e-mail.

Acesse o mapa: https://www.estradaadois.com/rota-biker

Quer continuar essa viagem com a gente? Acompanhe nossas viagens de moto e os próximos roteiros no Instagram.
Siga o Estrada a Dois: https://www.instagram.com/estrada.a.dois/

Obrigado por se cadastrar.

Nos vemos na estrada!
Jeanderson e Ana Paula
Estrada a Dois
https://www.estradaadois.com

Você vai receber poucas novidades por mês sobre o Mapa Rota Biker. Para não receber mais, responda este e-mail com "Descadastrar".`,
    html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body style="margin:0;padding:0;background:#FFFFFF;font-family:Arial,Helvetica,sans-serif;"><div style="display:none;max-height:0;overflow:hidden;">Seu acesso está pronto. Veja o vídeo de 1 minuto e comece a planejar sua rota.</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFFFFF;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:14px;overflow:hidden;"><tr><td style="height:6px;background:#9FD131;font-size:0;line-height:0;">&nbsp;</td></tr><tr><td align="center" style="padding:28px 24px 8px;"><a href="https://www.estradaadois.com" target="_blank"><img src="https://www.estradaadois.com/images/logo-publisher-512x512.png" width="96" height="96" alt="Estrada a Dois" style="display:block;border:0;"></a></td></tr><tr><td align="center" style="padding:16px 32px 8px;"><p style="margin:0 0 10px;display:inline-block;background:#F1F8E3;color:#5E8A12;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;padding:6px 12px;border-radius:20px;">Cadastro confirmado</p><h1 style="margin:8px 0 0;color:#1C1C1C;font-size:26px;line-height:1.3;">Bem-vindo ao Mapa Rota Biker, ${greeting}! 🏍️</h1></td></tr><tr><td style="padding:20px 36px 8px;color:#444444;font-size:16px;line-height:1.65;"><p style="margin:0 0 16px;">Aqui é o <strong style="color:#1C1C1C;">Jeanderson e a Ana Paula</strong>, do Estrada a Dois. Que bom ter você com a gente!</p><p style="margin:0 0 16px;">Com o mapa você encontra os monumentos da Rota Biker, monta seu trajeto e marca os lugares que já visitou. Tudo fica salvo na sua conta Google, então dá para continuar de qualquer aparelho.</p><p style="margin:0 0 8px;"><strong style="color:#1C1C1C;">Comece por aqui:</strong> gravamos um vídeo curto mostrando o mapa na prática.</p></td></tr><tr><td style="padding:16px 36px 8px;"><a href="https://www.youtube.com/watch?v=I-7Q-FWERXg" target="_blank" style="display:block;text-decoration:none;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:12px;overflow:hidden;"><tr><td background="https://img.youtube.com/vi/I-7Q-FWERXg/hqdefault.jpg" style="background:#1C1C1C url('https://img.youtube.com/vi/I-7Q-FWERXg/hqdefault.jpg') center/cover no-repeat;height:300px;" align="center" valign="middle"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td align="center" style="width:76px;height:76px;background:#FF0000;border-radius:38px;color:#FFFFFF;font-size:30px;line-height:76px;">&#9658;</td></tr></table></td></tr></table></a><p style="margin:10px 0 0;color:#8A8A8A;font-size:13px;text-align:center;">Clique na imagem para assistir no YouTube</p></td></tr><tr><td align="center" style="padding:24px 32px 8px;"><a href="https://www.estradaadois.com/rota-biker" target="_blank" style="display:inline-block;background:#9FD131;color:#1C1C1C;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:8px;margin:4px;">Acessar o Mapa Rota Biker</a></td></tr><tr><td style="padding:24px 36px 8px;color:#444444;font-size:16px;line-height:1.65;"><p style="margin:0;">Achou algum problema ou tem uma sugestão? É só responder este email. A gente lê tudo.</p></td></tr><!-- bloco comunidade --><tr><td style="padding:20px 24px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#1C1C1C;border-radius:12px;"><tr><td style="padding:28px 28px 24px;"><p style="margin:0 0 8px;color:#9FD131;font-size:12px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;">Garupa da estrada</p><p style="margin:0 0 12px;color:#FFFFFF;font-size:21px;font-weight:bold;line-height:1.35;">Agora você faz parte da nossa turma</p><p style="margin:0 0 16px;color:#D9D9D9;font-size:15px;line-height:1.6;">De vez em quando vamos te mandar:</p><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;"><tr><td style="padding:4px 10px 4px 0;font-size:16px;">&#128205;</td><td style="padding:4px 0;color:#FFFFFF;font-size:15px;">Novas rotas e monumentos no mapa</td></tr><tr><td style="padding:4px 10px 4px 0;font-size:16px;">&#127949;</td><td style="padding:4px 0;color:#FFFFFF;font-size:15px;">Relatos e vídeos das nossas viagens de moto</td></tr><tr><td style="padding:4px 10px 4px 0;font-size:16px;">&#128161;</td><td style="padding:4px 0;color:#FFFFFF;font-size:15px;">Dicas práticas para planejar sua próxima viagem</td></tr></table><p style="margin:0 0 14px;color:#D9D9D9;font-size:15px;">E no dia a dia, acompanhe a gente no Instagram:</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center"><a href="https://www.instagram.com/estrada.a.dois/" target="_blank" style="display:block;background:#9FD131;color:#1C1C1C;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 20px;border-radius:8px;text-align:center;">Seguir @estrada.a.dois</a></td></tr></table></td></tr></table></td></tr><tr><td style="padding:24px 36px 28px;color:#444444;font-size:16px;line-height:1.65;"><p style="margin:0;">Nos vemos na estrada!<br><strong style="color:#1C1C1C;">Jeanderson e Ana Paula</strong><br><span style="color:#5E8A12;font-weight:bold;">Estrada a Dois</span></p></td></tr><tr><td align="center" style="padding:20px 32px 28px;border-top:1px solid #EEEEEE;color:#8A8A8A;font-size:12px;line-height:1.6;">Você recebeu este email porque se cadastrou no Mapa Rota Biker em estradaadois.com.<br>Vamos te mandar poucas novidades por mês. <a href="mailto:contato@estradaadois.com?subject=Descadastrar%20novidades" style="color:#8A8A8A;text-decoration:underline;">Não quero receber novidades</a>.<br><a href="https://www.estradaadois.com" style="color:#5E8A12;text-decoration:none;font-weight:bold;">estradaadois.com</a> ·<a href="https://www.youtube.com/@estradaadois2" style="color:#5E8A12;text-decoration:none;font-weight:bold;">YouTube</a> ·<a href="https://www.estradaadois.com/politica-de-privacidade#rota-biker" style="color:#5E8A12;text-decoration:none;font-weight:bold;">Privacidade</a></td></tr></table></td></tr></table></body></html>`,
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
        subject: 'Seu cadastro no Mapa Rota Biker está confirmado',
        text,
        html,
      }),
      cache: 'no-store',
    });

    if (!sendResponse.ok) {
      console.error('[rota-biker/welcome] Resend status:', sendResponse.status);
      return NextResponse.json({ error: 'Falha temporária no envio' }, { status: 503 });
    }

    // Add the new user to Resend Contacts so they receive future broadcasts.
    // Best effort: a failure here must not affect the signup or welcome email.
    // Contacts need a "Full access" key, kept apart from the sending-only key.
    const contactsApiKey = process.env.RESEND_CONTACTS_API_KEY;
    if (contactsApiKey) try {
      const contactResponse = await fetch('https://api.resend.com/contacts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${contactsApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          first_name: (user.displayName || '').trim().split(/\s+/)[0] || undefined,
          unsubscribed: false,
        }),
        cache: 'no-store',
      });
      if (!contactResponse.ok) {
        console.error('[rota-biker/welcome] Resend contacts status:', contactResponse.status);
      }
    } catch {
      console.error('[rota-biker/welcome] Falha ao adicionar contato');
    }

    // Resend stores this stable idempotency key for 24h, longer than the signup window.
    return new NextResponse(null, { status: 204 });
  } catch {
    console.error('[rota-biker/welcome] Falha ao processar cadastro');
    return NextResponse.json({ error: 'Falha temporária no envio' }, { status: 503 });
  }
}
