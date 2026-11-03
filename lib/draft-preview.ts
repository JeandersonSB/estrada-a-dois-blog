import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import matter from 'gray-matter';

const REPO = 'JeandersonSB/estrada-a-dois-blog';
export const PREVIEW_INTENT_COOKIE = 'ead_preview_intent';
export const PREVIEW_SESSION_COOKIE = 'ead_preview_editor';
export const PREVIEW_SESSION_SECONDS = 8 * 60 * 60;
export const PREVIEW_LINK_SECONDS = 7 * 24 * 60 * 60;

// Derive independent keys from the existing server-only OAuth client secret.
// This does not add a new environmental dependency or expose a secret to the CMS.
function keyFor(purpose: string): Buffer {
  const root = process.env.GITHUB_CLIENT_SECRET;
  if (!root || root.length < 24) throw new Error('Preview signing is not configured');
  return createHmac('sha256', root).update('estrada-a-dois:' + purpose + ':v1').digest();
}

export function canonicalDraftSlug(value: unknown): string | null {
  if (typeof value !== 'string' || value.length < 3 || value.length > 150) return null;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) ? value : null;
}

function signature(payload: string): Buffer {
  return createHmac('sha256', keyFor('preview-link')).update(payload).digest();
}

export function createPreviewToken(slug: string): string {
  const payload = Buffer.from(JSON.stringify({
    v: 1, slug, expires: Math.floor(Date.now() / 1000) + PREVIEW_LINK_SECONDS,
  })).toString('base64url');
  return payload + '.' + signature(payload).toString('base64url');
}

export function isValidPreviewToken(token: string | null, requestedSlug: string): boolean {
  if (!token || token.length > 1024 || !canonicalDraftSlug(requestedSlug)) return false;
  const parts = token.split('.');
  if (parts.length !== 2 || !/^[A-Za-z0-9_-]+$/.test(parts[0]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[1])) return false;
  const received = Buffer.from(parts[1], 'base64url');
  const expected = signature(parts[0]);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return false;
  try {
    const data: unknown = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    if (!data || typeof data !== 'object') return false;
    const p = data as { v?: unknown; slug?: unknown; expires?: unknown };
    const now = Math.floor(Date.now() / 1000);
    return p.v === 1 && p.slug === requestedSlug &&
      typeof p.expires === 'number' && Number.isSafeInteger(p.expires) &&
      p.expires > now && p.expires <= now + PREVIEW_LINK_SECONDS;
  } catch {
    return false;
  }
}

export function encryptEditorSession(accessToken: string): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFor('preview-session'), nonce);
  const plaintext = Buffer.from(JSON.stringify({
    token: accessToken,
    expires: Math.floor(Date.now() / 1000) + PREVIEW_SESSION_SECONDS,
  }));
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return [nonce, cipher.getAuthTag(), ciphertext].map(part => part.toString('base64url')).join('.');
}

export function readEditorSession(value: string | undefined): string | null {
  if (!value || value.length > 8192) return null;
  try {
    const parts = value.split('.');
    if (parts.length !== 3) return null;
    const [nonce, tag, body] = parts.map(part => Buffer.from(part, 'base64url'));
    if (nonce.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv('aes-256-gcm', keyFor('preview-session'), nonce);
    decipher.setAuthTag(tag);
    const json = Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
    const result: unknown = JSON.parse(json);
    if (!result || typeof result !== 'object') return null;
    const p = result as { token?: unknown; expires?: unknown };
    return typeof p.token === 'string' && p.token.length > 0 &&
      typeof p.expires === 'number' && p.expires > Math.floor(Date.now() / 1000)
      ? p.token : null;
  } catch {
    return null;
  }
}

export async function isRepoEditor(accessToken: string): Promise<boolean> {
  try {
    const result = await fetch('https://api.github.com/repos/' + REPO, {
      headers: {
        Authorization: 'Bearer ' + accessToken,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store', signal: AbortSignal.timeout(8000),
    });
    if (!result.ok) return false;
    const data = await result.json() as { permissions?: { push?: boolean; admin?: boolean; maintain?: boolean } };
    return Boolean(data.permissions?.push || data.permissions?.admin || data.permissions?.maintain);
  } catch { return false; }
}

export type DraftArticle = {
  slug: string;
  title: string;
  date: string;
  category: string;
  image: string;
  image_alt?: string;
  excerpt: string;
  markdown: string;
};

export async function getDraftFromGitHub(slug: string, editorToken?: string): Promise<DraftArticle | null> {
  if (!canonicalDraftSlug(slug)) return null;
  const url = 'https://api.github.com/repos/' + REPO + '/contents/content/posts/' +
    encodeURIComponent(slug) + '.md?ref=main';
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (editorToken) headers.Authorization = 'Bearer ' + editorToken;
  try {
    const response = await fetch(url, {
      headers, cache: 'no-store', signal: AbortSignal.timeout(9000),
    });
    if (!response.ok) return null;
    const data = await response.json() as { content?: string; encoding?: string; size?: number };
    if (data.encoding !== 'base64' || typeof data.content !== 'string' || (data.size ?? 0) > 250_000) return null;
    const source = Buffer.from(data.content.replace(/\s/g, ''), 'base64').toString('utf8');
    const parsed = matter(source);
    // Only explicitly unpublished entries are eligible, even if their file is public on GitHub.
    if (typeof parsed.data.status !== 'string' || !parsed.data.status.includes('Rascunho')) return null;
    return {
      slug,
      title: String(parsed.data.title || 'Artigo sem título'),
      date: parsed.data.date instanceof Date ? parsed.data.date.toISOString().slice(0, 10) : String(parsed.data.date || '').slice(0, 10),
      category: String(parsed.data.category || 'Roteiros'),
      excerpt: String(parsed.data.excerpt || ''),
      image: String(parsed.data.image || ''),
      image_alt: typeof parsed.data.image_alt === 'string' ? parsed.data.image_alt : undefined,
      markdown: parsed.content.replace(/^\s*#\s+[^\r\n]+\r?\n+/, ''),
    };
  } catch {
    return null;
  }
}

export function githubDraftImage(src: string): string {
  if (!src.startsWith('/images/blog/') || src.includes('..') || /[<>"']/.test(src)) return src;
  return 'https://raw.githubusercontent.com/' + REPO + '/main/public' + src.split('/').map((part, i) => i === 0 ? '' : encodeURIComponent(part)).join('/');
}
