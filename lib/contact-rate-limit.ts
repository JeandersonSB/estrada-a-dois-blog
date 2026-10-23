import { createHash, randomBytes } from 'node:crypto';

type ContactLimit = { allowed: boolean; retryAfterSeconds: number };
type Window = { count: number; expiresAt: number };

const WINDOW_MS = 10 * 60 * 1000;
const MAX_MESSAGES = 5;
const MAX_ENTRIES = 2048;
const sessionSalt = randomBytes(16).toString('hex');
const windows = new Map<string, Window>();

// Best-effort protection within each serverless instance.
// Strong distributed limits should additionally be configured in the Vercel WAF.
export function checkContactRateLimit(ip: string | null, now = Date.now()): ContactLimit {
  // A missing or malformed header must not turn off abuse protection. Vercel
  // supplies the real client address; unknown callers share a bounded bucket.
  const identity = ip && ip.length <= 120 && /^[0-9a-fA-F.:]+$/.test(ip) ? ip : 'unknown';
  const key = createHash('sha256').update(sessionSalt + ':' + identity).digest('hex');
  const existing = windows.get(key);
  if (!existing || existing.expiresAt <= now) {
    // Keep instance memory bounded during traffic floods.
    if (windows.size >= MAX_ENTRIES) {
      for (const [id, entry] of windows) {
        if (entry.expiresAt <= now) windows.delete(id);
      }
      if (windows.size >= MAX_ENTRIES) {
        const oldest = windows.keys().next().value;
        if (oldest) windows.delete(oldest);
      }
    }
    windows.set(key, { count: 1, expiresAt: now + WINDOW_MS });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= MAX_MESSAGES) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)) };
  }
  existing.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}
