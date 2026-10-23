const MAX_BODY_BYTES = 8192;

export class ContactRequestError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type ContactMessage = {
  name: string;
  message: string;
  whatsapp: string;
  email: string;
  subject: string;
  honeypot: boolean;
};

// Bound the bytes actually received, including requests without Content-Length.
// Checking the header alone lets chunked requests bypass the size limit.
export async function readContactRequest(req: Request): Promise<ContactMessage> {
  const mediaType = req.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'application/json') {
    throw new ContactRequestError('Envie a mensagem no formato JSON.', 415);
  }

  const allowedOrigins = new Set([
    'https://www.estradaadois.com',
    'https://estradaadois.com',
    'https://estrada-a-dois-blog.vercel.app',
    'https://estrada-a-dois-blog-jeandeerson-1438.vercel.app',
  ]);
  if (process.env.NODE_ENV !== 'production') allowedOrigins.add('http://localhost:3000');
  const origin = req.headers.get('origin');
  if ((origin && !allowedOrigins.has(origin)) || req.headers.get('sec-fetch-site') === 'cross-site') {
    throw new ContactRequestError('Origem da solicitação não permitida.', 403);
  }

  const declaredSize = Number(req.headers.get('content-length') || 0);
  if (Number.isFinite(declaredSize) && declaredSize > MAX_BODY_BYTES) {
    throw new ContactRequestError('Mensagem muito grande.', 413);
  }

  const reader = req.body?.getReader();
  if (!reader) throw new ContactRequestError('Mensagem inválida.', 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new ContactRequestError('Mensagem muito grande.', 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  let data: unknown;
  try {
    const body = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      body.set(chunk, offset);
      offset += chunk.byteLength;
    }
    data = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body));
  } catch {
    throw new ContactRequestError('Mensagem JSON inválida.', 400);
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new ContactRequestError('Mensagem inválida.', 400);
  }

  const fields = data as Record<string, unknown>;
  if (fields._bot_honey) {
    return { name: '', message: '', whatsapp: '', email: '', subject: '', honeypot: true };
  }
  const text = (field: string, maxLength: number, required = false): string => {
    const value = fields[field];
    if (value === undefined && !required) return '';
    if (typeof value !== 'string' || value.length > maxLength || (required && !value.trim())) {
      throw new ContactRequestError('Confira os campos e o tamanho da mensagem.', 400);
    }
    return value.trim();
  };
  return {
    name: text('name', 100, true),
    message: text('message', 2500, true),
    whatsapp: text('whatsapp', 35),
    email: text('email', 150),
    subject: text('subject', 150) || 'Dúvida sobre roteiro / viagem',
    honeypot: false,
  };
}
