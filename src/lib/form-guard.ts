import "server-only";

/**
 * Anti-spam "time-trap" for public forms. The form page mints a short signed
 * token stamped with its render time; the handler then rejects a submission
 * that arrives implausibly fast (a bot POSTing instantly) or without a valid
 * token (a bot POSTing straight to the API without ever loading the page).
 *
 * Complements the honeypot field in QuoteForm — the honeypot catches bots that
 * blindly fill every field, this catches bots that fill only the real ones or
 * skip the page entirely. Cloudflare Turnstile is the stronger layer on top.
 *
 * HMAC-SHA256 over base64url(json), the same construction as the session
 * tokens, so the timestamp can't be forged or replayed with a doctored age.
 * Server-rendered into the form HTML, so it needs no client JS and can't be
 * spoofed the way a client-set timestamp could.
 */

const MIN_FILL_MS = 3_000; // a human can't complete the form faster than this
const MAX_AGE_MS = 3 * 60 * 60 * 1000; // token valid 3h (page left open a while)

type FormTokenPayload = { iat: number };

export async function issueFormToken(): Promise<string> {
  const body = b64uEncode(JSON.stringify({ iat: Date.now() } satisfies FormTokenPayload));
  return `${body}.${await sign(body)}`;
}

export type FormGuardResult = "ok" | "too_fast" | "invalid";

/** Verify signature + plausibility of the elapsed fill time. */
export async function checkFormToken(token: unknown): Promise<FormGuardResult> {
  if (typeof token !== "string") return "invalid";
  const dot = token.indexOf(".");
  if (dot < 1) return "invalid";
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  if (!timingSafeEqual(sig, await sign(body))) return "invalid";

  let payload: FormTokenPayload;
  try {
    payload = JSON.parse(b64uDecode(body));
  } catch {
    return "invalid";
  }
  const age = Date.now() - payload.iat;
  if (typeof payload.iat !== "number" || !Number.isFinite(age) || age < 0 || age > MAX_AGE_MS) {
    return "invalid";
  }
  if (age < MIN_FILL_MS) return "too_fast";
  return "ok";
}

// --- HMAC-SHA256 + base64url (Web Crypto; matches src/lib/session.ts) --------

let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is not set — cannot sign form tokens.");
    keyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
  }
  return keyPromise;
}

async function sign(data: string): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", await getKey(), new TextEncoder().encode(data));
  return b64uBytes(new Uint8Array(mac));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function b64uBytes(bytes: Uint8Array): string {
  let s = "";
  for (const byte of bytes) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64uEncode(str: string): string {
  return b64uBytes(new TextEncoder().encode(str));
}

function b64uDecode(s: string): string {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  return new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
}
