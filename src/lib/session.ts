import type { CustomerClass } from "./customer";

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
  customerClass: CustomerClass;
  company: string;
  typ: TokenKind;
  iat: number; // issued-at (epoch seconds)
  exp: number; // expiry (epoch seconds)
};

const TTL_SECONDS: Record<TokenKind, number> = {
  magic: 15 * 60, // 15 minutes
  session: 30 * 24 * 60 * 60, // 30 days
};

type TokenInput = { email: string; customerClass: CustomerClass; company: string };

export async function createToken(
  kind: TokenKind,
  input: TokenInput,
  ttlSeconds?: number, // override the default TTL (e.g. a 24h manually-relayed link)
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: TokenPayload = {
    sub: input.email,
    customerClass: input.customerClass,
    company: input.company,
    typ: kind,
    iat: now,
    exp: now + (ttlSeconds ?? TTL_SECONDS[kind]),
  };
  const body = b64uEncode(JSON.stringify(payload));
  const sig = await sign(body);
  return `${body}.${sig}`;
}

/** Signature + expiry check. Callers still must check `typ`. */
async function parseVerified(token: string | null | undefined): Promise<{ typ: string; exp: number } | null> {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot < 1) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);

  if (!timingSafeEqual(sig, await sign(body))) return null;

  let payload: { typ: string; exp: number };
  try {
    payload = JSON.parse(b64uDecode(body));
  } catch {
    return null;
  }
  if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return payload;
}

export async function verifyToken(
  token: string | null | undefined,
  kind: TokenKind,
): Promise<TokenPayload | null> {
  const payload = await parseVerified(token);
  if (!payload || payload.typ !== kind) return null;
  return payload as unknown as TokenPayload;
}

// --- Staff tokens ---------------------------------------------------------------
// Separate payload + cookie from customer sessions: staff have no customer class,
// and a staff session must never be mistaken for a buyer session (or vice-versa).

export type StaffTokenKind = "staff-magic" | "staff";
export type StaffTokenPayload = { sub: string; typ: StaffTokenKind; iat: number; exp: number };

const STAFF_TTL: Record<StaffTokenKind, number> = {
  "staff-magic": 15 * 60, // emailed sign-in link
  staff: 12 * 60 * 60, // working day
};

export async function createStaffToken(kind: StaffTokenKind, email: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: StaffTokenPayload = {
    sub: email,
    typ: kind,
    iat: now,
    exp: now + STAFF_TTL[kind],
  };
  const body = b64uEncode(JSON.stringify(payload));
  return `${body}.${await sign(body)}`;
}

export async function verifyStaffToken(
  token: string | null | undefined,
  kind: StaffTokenKind,
): Promise<StaffTokenPayload | null> {
  const payload = await parseVerified(token);
  if (!payload || payload.typ !== kind) return null;
  return payload as StaffTokenPayload;
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
