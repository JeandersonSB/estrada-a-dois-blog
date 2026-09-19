import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { name, whatsapp, email, subject, message, _bot_honey } = await req.json();

    // 1. Anti-spam Honeypot: se preenchido, é um bot automático
    if (_bot_honey) {
      // Retorna sucesso falso sem incomodar o Telegram
      return NextResponse.json({ success: true });
    }

    // 2. Validação de campos obrigatórios e tipos
    if (!name || !message || typeof name !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Nome e mensagem são campos obrigatórios.' },
        { status: 400 }
      );
    }

    // 3. Limites de tamanho para prevenir sobrecarga e erro de tamanho da API do Telegram (max 4096 chars)
    if (name.length > 100 || message.length > 2500) {
      return NextResponse.json(
        { error: 'O tamanho da mensagem ou do nome excede o limite suportado.' },
        { status: 400 }
      );
    }

    const cleanWhatsapp = typeof whatsapp === 'string' ? whatsapp.slice(0, 35) : '';
    const cleanEmail = typeof email === 'string' ? email.slice(0, 150) : '';
    const cleanSubject = typeof subject === 'string' ? subject.slice(0, 150) : 'Dúvida sobre roteiro / viagem';

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
      (cleanWhatsapp ? `📱 <b>WhatsApp:</b> ${escapeHtml(cleanWhatsapp)}\n` : '') +
      (cleanEmail ? `📧 <b>E-mail:</b> ${escapeHtml(cleanEmail)}\n` : '') +
      `📌 <b>Assunto:</b> ${escapeHtml(cleanSubject)}\n\n` +
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
