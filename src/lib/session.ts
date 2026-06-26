import type { Tier } from "./schema";

/**
 * Signed magic-link + session tokens, built on Web Crypto HMAC-SHA256 so they
 * work in BOTH the Edge runtime (middleware) and Node (route handlers / server
 * actions). Format: `base64url(json).base64url(hmac)`.
 *
 * This module is intentionally free of `next/headers` and `server-only` so the
 * Edge middleware can import it. Cookie read/write lives in `auth.ts`.
 */

export const SESSION_COOKIE = "hbw_session";

export type TokenKind = "magic" | "session";

export type TokenPayload = {
  sub: string; // account email
  tier: Tier;
  company: string;
  typ: TokenKind;
  iat: number; // issued-at (epoch seconds)
  exp: number; // expiry (epoch seconds)
};

const TTL_SECONDS: Record<TokenKind, number> = {
  magic: 15 * 60, // 15 minutes
  session: 30 * 24 * 60 * 60, // 30 days
};

type TokenInput = { email: string; tier: Tier; company: string };

export async function createToken(kind: TokenKind, input: TokenInput): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: input.email,
    tier: input.tier,
    company: input.company,
    typ: kind,
    iat: now,
    exp: now + TTL_SECONDS[kind],
  };
  const body = b64uEncode(JSON.stringify(payload));
  const sig = await sign(body);
  return `${body}.${sig}`;
}

export async function verifyToken(
  token: string | null | undefined,
  kind: TokenKind,
): Promise<TokenPayload | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  const expected = await sign(body);
  if (!timingSafeEqual(sig, expected)) return null;

  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64uDecode(body));
  } catch {
    return null;
  }

  if (payload.typ !== kind) return null;
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

// --- HMAC ---------------------------------------------------------------------

let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      throw new Error("AUTH_SECRET is not set — cannot sign/verify tokens.");
    }
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
  const key = await getKey();
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return b64uBytes(new Uint8Array(mac));
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// --- base64url helpers (Edge + Node safe) ------------------------------------

function b64uBytes(bytes: Uint8Array): string {
  let s = "";
  for (const byte of bytes) s += String.fromCharCode(byte);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64uEncode(str: string): string {
  return b64uBytes(new TextEncoder().encode(str));
}

function b64uDecode(b64u: string): string {
  const b64 = b64u.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}
