import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, whatsapp, email, subject, message } = await req.json();

    if (!name || !message) {
      return NextResponse.json(
        { error: 'Nome e mensagem são campos obrigatórios.' },
        { status: 400 }
      );
    }

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      console.error('TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID não definidos nas variáveis de ambiente.');
      return NextResponse.json(
        { error: 'Serviço de notificação temporariamente indisponível no servidor.' },
        { status: 500 }
      );
    }

    const escapeHtml = (str: string) =>
      String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const texto =
      `📬 <b>NOVA MENSAGEM DO FORMULÁRIO DO BLOG!</b>\n\n` +
      `👤 <b>Nome:</b> ${escapeHtml(name)}\n` +
      (whatsapp ? `📱 <b>WhatsApp:</b> ${escapeHtml(whatsapp)}\n` : '') +
      (email ? `📧 <b>E-mail:</b> ${escapeHtml(email)}\n` : '') +
      `📌 <b>Assunto:</b> ${escapeHtml(subject || 'Dúvida sobre roteiro / viagem')}\n\n` +
      `💬 <b>Mensagem:</b>\n${escapeHtml(message)}`;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: texto,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });

    const data = await res.json();
    if (!data.ok) {
      console.error('Erro retornado pela API do Telegram:', data);
      return NextResponse.json(
        { error: 'Falha ao entregar mensagem no Telegram.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Erro na rota /api/contato:', err);
    return NextResponse.json(
      { error: 'Ocorreu um erro interno ao enviar sua mensagem.' },
      { status: 500 }
    );
  }
}
