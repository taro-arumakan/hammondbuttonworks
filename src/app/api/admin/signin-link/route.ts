import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/session";
import { resolveTradeAccount } from "@/lib/shopify";
import { baseUrl } from "@/lib/url";
import { rateLimit } from "@/lib/ratelimit";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";

/**
 * Staff tool — mint a magic sign-in link for an ONBOARDED customer to relay by
 * hand (LINE / SMS / phone) when their email bounces or is suppressed. The link
 * is channel-agnostic: signed, single-use, and now valid 24h so a human has time
 * to pass it along.
 *
 *   GET /api/admin/signin-link?email=<customer>&secret=<STAFF_LINK_SECRET>[&locale=ja]
 *   → { url, email, company, expiresAt }
 *
 * Guarded by STAFF_LINK_SECRET. It only mints for customers `resolveTradeAccount`
 * already accepts (segment-gated) — so a leaked secret can RE-ISSUE access to an
 * onboarded customer, never CREATE access for a new one.
 */
const MANUAL_LINK_TTL = 24 * 60 * 60; // 24 hours

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.STAFF_LINK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STAFF_LINK_SECRET not configured." }, { status: 503 });
  }
  const provided =
    req.headers.get("x-admin-secret") ?? req.nextUrl.searchParams.get("secret") ?? "";
  if (!constantTimeEqual(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`admin-link:${ip}`, 20, 10 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim() ?? "";
  if (!email) return NextResponse.json({ error: "Missing email." }, { status: 400 });

  const account = await resolveTradeAccount(email);
  if (!account) {
    return NextResponse.json(
      { error: "No onboarded customer for that email — set their pricing_segment in Shopify first." },
      { status: 404 },
    );
  }

  const rawLocale = req.nextUrl.searchParams.get("locale");
  const locale = isLocale(rawLocale) ? rawLocale : (account.locale ?? DEFAULT_LOCALE);

  const token = await createToken(
    "magic",
    { email: account.email, customerClass: account.customerClass, company: account.company },
    MANUAL_LINK_TTL,
  );
  const url = `${await baseUrl()}/${locale}/signin/${token}`;
  const expiresAt = new Date((Math.floor(Date.now() / 1000) + MANUAL_LINK_TTL) * 1000).toISOString();

  return NextResponse.json({ url, email: account.email, company: account.company, expiresAt });
}

/** Length-leaking-resistant string compare (both are our own high-entropy secret). */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}
