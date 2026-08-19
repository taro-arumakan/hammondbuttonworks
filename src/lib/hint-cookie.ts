/**
 * The account-HINT cookie — the one piece of session state client JS may read.
 *
 * Public pages are statically rendered (no `auth()` in the render path — that's
 * what keeps them CDN-cacheable and crawler-proof), so the client decides
 * "am I signed in?" from this non-httpOnly cookie, set/cleared strictly
 * alongside the real (httpOnly, signed) session cookie in `auth.ts`.
 *
 * It is a DISPLAY HINT, never an authority:
 *  - carries email + company name only — NEVER the customer class, and never
 *    anything a competitor shouldn't see over the buyer's shoulder;
 *  - every price still comes from the gated APIs, which verify the signed
 *    session cookie server-side. A forged/stale hint gets a 401 and the UI
 *    drops back to the guest state (see `account-hint.ts`).
 *
 * Isomorphic on purpose: imported by server code (auth.ts) for the name/codec
 * and by client code (account-hint.ts) for reading. No directives, no deps.
 */

export const HINT_COOKIE = "hbw_ui";

export type AccountHint = {
  email: string;
  /** Company display name (falls back to email in the UI when absent). */
  company?: string;
};

/**
 * Server-side value for cookies().set(): BARE JSON. Next's cookie serializer
 * applies encodeURIComponent itself (@edge-runtime/cookies), so pre-encoding
 * here double-encodes — document.cookie then yields "%257B…", the client's
 * single decode returns "%7B…", JSON.parse throws, and every signed-in
 * island silently renders the guest state. (Found the hard way in review.)
 */
export function encodeHint(hint: AccountHint): string {
  return JSON.stringify(hint);
}

/** Client-side decode of the raw document.cookie value (percent-encoded once
 *  by Next's serializer at set time). */
export function decodeHint(raw: string | undefined | null): AccountHint | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      typeof (parsed as AccountHint).email === "string"
    ) {
      const { email, company } = parsed as AccountHint;
      return { email, ...(typeof company === "string" ? { company } : {}) };
    }
  } catch {
    /* malformed cookie → treat as signed out */
  }
  return null;
}
