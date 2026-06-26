import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/session";
import { startSession } from "@/lib/auth";
import { lookupAccount } from "@/lib/allowlist";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";

/**
 * Magic-link landing route. Validates the signed, short-lived token, then
 * re-checks the allowlist (so revoked accounts can't reuse an old link) before
 * issuing a session cookie. The `locale` query param keeps the user in their
 * language after sign-in.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const token = req.nextUrl.searchParams.get("token");
  const rawLocale = req.nextUrl.searchParams.get("locale");
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const payload = await verifyToken(token, "magic");

  if (!payload) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=invalid`, req.url));
  }

  // Re-validate against the current allowlist at the moment of sign-in.
  const account = lookupAccount(payload.sub);
  if (!account) {
    return NextResponse.redirect(new URL(`/${locale}/login?status=notfound`, req.url));
  }

  await startSession(account);
  return NextResponse.redirect(new URL(`/${locale}/catalog`, req.url));
}
