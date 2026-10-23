import { NextResponse } from 'next/server';
import { checkContactRateLimit } from '@/lib/contact-rate-limit';
import { ContactRequestError, readContactRequest } from '@/lib/contact-request';

function json(body: object, status = 200, headers: Record<string, string> = {}) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
}

export async function POST(req: Request) {
  try {
    // Apply the limit before reading the body or calling an external service.
    const limit = checkContactRateLimit(req.headers.get('x-vercel-forwarded-for'));
    if (!limit.allowed) {
      return json(
        { error: 'Muitas mensagens em pouco tempo. Tente novamente mais tarde.' },
        429, { 'Retry-After': String(limit.retryAfterSeconds) }
      );
    }
    const { name, message, whatsapp, email, subject, honeypot } = await readContactRequest(req);
    if (honeypot) return json({ success: true });

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('Serviço de contato não configurado.');
      return json(
        { error: 'Serviço de notificação temporariamente indisponível no servidor.' },
        503
      );
    }
    // Plain text prevents HTML injection and entity expansion past Telegram's
    // 4096-character limit. The validated fields fit within that limit.
    const texto =
      `📬 NOVA MENSAGEM DO FORMULÁRIO DO BLOG!\n\n` +
      `👤 Nome: ${name}\n` +
      (whatsapp ? `📱 WhatsApp: ${whatsapp}\n` : '') +
      (email ? `📧 E-mail: ${email}\n` : '') +
      `📌 Assunto: ${subject}\n\n` +
      `💬 Mensagem:\n${message}`;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        disable_web_page_preview: true,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error('Falha do provedor de contato.', { status: res.status });
      return json(
        { error: 'Falha ao entregar mensagem no Telegram.' },
        502
      );
    }

    return json({ success: true });
  } catch (err: unknown) {
    if (err instanceof ContactRequestError) return json({ error: err.message }, err.status);
    // Fetch errors can include the Telegram URL containing the bot token.
    // Do not log the error object, request body or provider response.
    console.error('Falha ao processar solicitação de contato.');
    return json(
      { error: 'Ocorreu um erro interno ao enviar sua mensagem.' },
      502
    );
  }
}
