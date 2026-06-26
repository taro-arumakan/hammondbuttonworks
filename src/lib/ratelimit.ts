/**
 * Minimal in-memory fixed-window rate limiter. Good enough to blunt abuse of
 * the quote endpoint in the pilot; it is per-instance and resets on redeploy.
 * Graduate to a shared store (e.g. Upstash) if/when running multiple instances.
 */

type Window = { count: number; resetAt: number };

const store = new Map<string, Window>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number } {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  existing.count += 1;
  return { ok: true, remaining: limit - existing.count };
}
