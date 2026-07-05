import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";
import { detectLocale, isLocale } from "@/lib/i18n-config";

/**
 * Server-side gate + locale routing, run on the Edge before pages render.
 *
 *  1. APIs: never locale-prefixed. The price-bearing API is gated here — guests
 *     get 401; there is no client payload to "unlock". (Catalog/product pages
 *     stay PUBLIC for SEO and simply contain no prices for guests.)
 *  2. Page routes: ensure a supported `/{locale}` prefix, redirecting bare
 *     paths to the visitor's detected language.
 *  3. A reserved `/{locale}/account` area is gated for future use.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) API routes — no locale handling; gate price-bearing endpoints.
  if (pathname.startsWith("/api")) {
    if (
      pathname.startsWith("/api/price") ||
      pathname.startsWith("/api/cart") ||
      pathname.startsWith("/api/checkout")
    ) {
      const token = req.cookies.get(SESSION_COOKIE)?.value;
      const session = await verifyToken(token, "session");
      if (!session) {
        return NextResponse.json({ error: "Trade login required." }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  // 2) Ensure a locale prefix on page routes.
  const first = pathname.split("/")[1];
  if (!isLocale(first)) {
    const locale = detectLocale(req.headers.get("accept-language"));
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // 3) Reserved gated area: /{locale}/account
  const segments = pathname.split("/");
  if (segments[2] === "account") {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifyToken(token, "session");
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = `/${segments[1]}/login`;
      url.searchParams.set("next", pathname + search);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on page routes + /api/price, but skip Next internals and static files
  // (anything with a file extension).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
