import { NextResponse } from "next/server";
import { issueFormToken } from "@/lib/form-guard";

/**
 * Mints the anti-spam time-trap token for the quote form (see form-guard.ts).
 *
 * The token used to be server-rendered into the page, which forced the quote
 * page dynamic; now the page is static and the form fetches its token on
 * mount. The guarantee is unchanged — and it is NOT "bots can't get one"
 * (curl can call this): it's a signed, unforgeable timestamp enforcing a
 * ≥3s minimum fill time and 3h expiry, with /api/quote's per-IP rate limit
 * as the volume backstop. Ungated: it holds nothing sensitive.
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { token: await issueFormToken() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
