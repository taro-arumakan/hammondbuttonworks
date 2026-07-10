import { NextRequest, NextResponse } from "next/server";
import { createToken } from "@/lib/session";
import { staffSession } from "@/lib/auth";
import { resolveTradeAccount } from "@/lib/shopify";
import { baseUrl } from "@/lib/url";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";

/**
 * Staff tool — mint a magic sign-in link for an ONBOARDED customer to relay by
 * hand (LINE / SMS / phone) when their email bounces or is suppressed. The link
 * is channel-agnostic: signed, single-use, and valid 24h so a human has time to
 * pass it along.
 *
 *   GET /api/admin/signin-link?email=<customer>[&locale=ja]  → { url, … }
 *
 * Auth: the staff session (middleware 401s /api/admin/* without one). It only
 * mints for customers `resolveTradeAccount` already accepts (segment-gated), so
 * it can RE-ISSUE access to an onboarded customer, never CREATE it.
 */
const MANUAL_LINK_TTL = 24 * 60 * 60; // 24 hours

export async function GET(req: NextRequest): Promise<NextResponse> {
  const staff = await staffSession();
  if (!staff) return NextResponse.json({ error: "Staff login required." }, { status: 401 });

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

  console.info(`admin: signin-link minted for ${account.email} by ${staff.email}`);
  return NextResponse.json({ url, email: account.email, company: account.company, expiresAt });
}
