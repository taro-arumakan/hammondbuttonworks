import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/session";
import { startSession } from "@/lib/auth";
import { resolveTradeAccount } from "@/lib/shopify";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";

/**
 * Clean-URL magic-link landing: `/{locale}/signin/{token}`.
 *
 * Reads as a normal sign-in page rather than `/api/auth/verify?token=…`, which
 * phishing filters (iCloud/Proofpoint) flag on a brand-new domain. Verification
 * is identical to the legacy route: validate the signed, short-lived token, then
 * RE-RESOLVE the account (Shopify segment-gated, allowlist fallback) at click
 * time — so a de-segmented/removed customer can't reuse an old link and the
 * class reflects current admin state. The legacy `/api/auth/verify` route is
 * kept for any links still in flight.
 *
 * (The token is a JWT — its dots put this path past the middleware matcher's
 * file-extension exclusion, so middleware is skipped; that's fine, this route
 * needs neither the locale redirect nor the price gate.)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ locale: string; token: string }> },
): Promise<NextResponse> {
  const { locale: rawLocale, token } = await params;
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  const payload = await verifyToken(token, "magic");
  if (!payload) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=invalid`, req.url));
  }

  const account = await resolveTradeAccount(payload.sub);
  if (!account) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=notfound`, req.url));
  }

  await startSession(account);
  return NextResponse.redirect(new URL(`/${locale}/catalog`, req.url));
}
