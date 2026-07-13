import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken, verifyStaffToken } from "@/lib/session";
import { STAFF_COOKIE, adminHost } from "@/lib/staff";
import { detectLocale, isLocale } from "@/lib/i18n-config";

/**
 * Server-side gate + locale routing, run on the Edge before pages render.
 *
 *  0. The ADMIN surface (`/admin`, `/api/admin`) is served ONLY on ADMIN_HOST
 *     (e.g. admin.hammondbutton.works) and requires a staff session. On the
 *     public host it 404s — the surface isn't even confirmed to exist. Same app
 *     and deploy, so the pricing/order logic can never fork; just a separate
 *     hostname. With ADMIN_HOST unset (local dev) admin is reachable anywhere.
 *  1. APIs: never locale-prefixed. The price-bearing API is gated here — guests
 *     get 401; there is no client payload to "unlock". (Catalog/product pages
 *     stay PUBLIC for SEO and simply contain no prices for guests.)
 *  2. Page routes: ensure a supported `/{locale}` prefix, redirecting bare
 *     paths to the visitor's detected language.
 *  3. A reserved `/{locale}/account` area is gated for future use.
 */

/** Reachable without a staff session (otherwise you could never sign in).
 *  NB the trailing slash on `/admin/signin/` — without it this would also match
 *  `/admin/signin-link`, exposing the link-minter page to anonymous visitors. */
function isOpenAdminPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/signin/") ||
    pathname.startsWith("/api/admin/auth/")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  const host = (req.headers.get("host") ?? "").toLowerCase();

  // 0) Canonical host: send the `www` alias and the production *.vercel.app URL
  //    to the bare apex, so there is one address (one cookie scope, one set of
  //    SEO signals). Only these exact hosts are rewritten — preview deployments
  //    (hammondbuttonworks-<hash>.vercel.app), localhost, and the admin host are
  //    intentionally left alone.
  if (host === "www.hammondbutton.works" || host === "hammondbuttonworks.vercel.app") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    url.hostname = "hammondbutton.works";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // 1) Admin surface — host-scoped + staff-gated.
  const ADMIN_HOST = adminHost();
  const onAdminHost = !ADMIN_HOST || host === ADMIN_HOST;
  const isAdminPath = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  if (isAdminPath) {
    // Wrong host → pretend it doesn't exist.
    if (!onAdminHost) return new NextResponse("Not found", { status: 404 });

    if (!isOpenAdminPath(pathname)) {
      const staff = await verifyStaffToken(req.cookies.get(STAFF_COOKIE)?.value, "staff");
      if (!staff) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ error: "Staff login required." }, { status: 401 });
        }
        const url = req.nextUrl.clone();
        url.pathname = "/admin/login";
        url.search = "";
        url.searchParams.set("next", pathname + search);
        return NextResponse.redirect(url);
      }
    }
    return NextResponse.next(); // admin is never locale-prefixed
  }

  // The admin host serves the admin surface only — never the storefront.
  if (ADMIN_HOST && onAdminHost) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // 2) API routes — no locale handling; gate price-bearing endpoints.
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

  // 3) Ensure a locale prefix on page routes.
  const first = pathname.split("/")[1];
  if (!isLocale(first)) {
    const locale = detectLocale(req.headers.get("accept-language"));
    const url = req.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  // 4) Reserved gated area: /{locale}/account
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
  matcher: [
    // Page routes + /api/price, skipping Next internals and static files
    // (anything with a file extension).
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
    // Admin is matched EXPLICITLY: the pattern above drops any path containing
    // a dot, and a magic-link token is `base64url.base64url` — so without these
    // two entries `/admin/signin/<token>` would bypass the middleware and be
    // served on the public host, outside the ADMIN_HOST 404 gate.
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
