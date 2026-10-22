import { randomBytes, timingSafeEqual } from 'node:crypto';

export const OAUTH_STATE_COOKIE = 'ead_github_oauth_state';
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;

export function newOauthState(): string {
  return randomBytes(32).toString('hex');
}

export function hasValidOauthState(expected?: string | null, actual?: string | null): boolean {
  if (!expected || !actual) return false;
  if (!/^[0-9a-f]{64}$/.test(expected) || !/^[0-9a-f]{64}$/.test(actual)) return false;
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'));
}

// Only the production CMS hosts managed by Estrada a Dois can receive GitHub tokens.
// Do not allow every *.vercel.app subdomain: other users can create those.
export function trustedCmsOrigins(isProduction = process.env.NODE_ENV === 'production'): string[] {
  const origins = [
    'https://www.estradaadois.com',
    'https://estradaadois.com',
    'https://estrada-a-dois-blog.vercel.app',
    'https://estrada-a-dois-blog-jeandeerson-1438.vercel.app',
  ];
  if (!isProduction) origins.push('http://localhost:3000');
  return origins;
}

export function isTrustedCmsOrigin(origin: string, isProduction = process.env.NODE_ENV === 'production'): boolean {
  return trustedCmsOrigins(isProduction).includes(origin);
}

// Serialize untrusted token-provider output into an HTML <script> without allowing
// the literal closing tag or HTML delimiters to escape the script element.
export function safeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value ?? null).replace(/[<>&\u2028\u2029]/g, (char) => {
    switch (char) {
      case '<': return '\\u003c';
      case '>': return '\\u003e';
      case '&': return '\\u0026';
      case '\u2028': return '\\u2028';
      case '\u2029': return '\\u2029';
      default: return char;
    }
  });
}
