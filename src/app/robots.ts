import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/i18n-config";
import { siteUrl } from "@/lib/seo";

/**
 * robots.txt for /robots.txt.
 *
 * ⚠️ TWO traps, both previously hit — keep the rules FULLY ANCHORED.
 *
 * 1. In robots.txt, `*` matches ANY sequence INCLUDING `/`. So an unanchored
 *    rule like `/*​/cart` also matches `/en/catalog/cart-toggle`, which would
 *    silently deindex every product whose handle starts with "cart" (likewise
 *    `/*​/login`). Every rule below is therefore written with a literal locale
 *    prefix and no leading wildcard.
 *
 * 2. `color` is BOTH a listing filter and the product colourway preselect:
 *
 *      /en/catalog?color=Blue           ← listing filter, block (combinatorial)
 *      /en/catalog/pebble?color=Blue    ← product page,   MUST stay crawlable
 *
 *    Every internal link to a product carries `?color=…` (ProductCard), so a
 *    blanket `Disallow: /*?*` — or even `/*?color=` — would sever the only
 *    crawl path to the products. `/{locale}/catalog?` only matches when `?`
 *    immediately follows `catalog`, so deeper product URLs never match.
 *
 * `page` is intentionally NOT blocked: listing pagination is a discovery path.
 *
 * Not listed: the admin surface. It 404s on the public host and already sends
 * `noindex, nofollow` on its own host — naming it here would only advertise it.
 */

/** Listing facets that explode combinatorially and carry no unique content. */
const FACET_PARAMS = ["category", "size", "color", "stock", "sort"] as const;

/** Locale-scoped utility routes: gated, or otherwise worthless to crawl. */
const UTILITY_PATHS = ["cart", "login", "signin/"] as const;

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/api/",
    ...LOCALES.flatMap((l) => UTILITY_PATHS.map((p) => `/${l}/${p}`)),
    ...LOCALES.flatMap((l) => FACET_PARAMS.map((k) => `/${l}/catalog?*${k}=`)),
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      // Meta's AI crawler exhausted the Vercel free tier walking the faceted
      // catalog (2026-07). The firewall denies it everywhere EXCEPT /robots.txt
      // — this group is the eviction notice it reads there. Crawlers obey the
      // most specific matching group, so this fully overrides `*` for this UA.
      { userAgent: "meta-externalagent", disallow: "/" },
    ],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
