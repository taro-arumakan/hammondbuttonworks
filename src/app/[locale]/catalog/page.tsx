import type { Metadata } from "next";
import { PAGE_REVALIDATE, getAllProducts } from "@/lib/products";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";
import { toColorways, toTiles } from "@/lib/catalog";
import { CatalogBrowser } from "@/components/CatalogBrowser";

/**
 * The catalog listing — STATIC since 2026-08. This page (one document per
 * locale, revalidated hourly) embeds the price-free tile set and defers all
 * filtering / sorting / pagination to the CatalogBrowser client component.
 *
 * That collapses the entire faceted URL space (?category=&size=&color=&sort=
 * &page=…) onto a single cached document: Vercel ignores the query string when
 * serving a prerendered route, so the crawler traffic that walked millions of
 * facet permutations through a server render in 2026-07 now costs an edge
 * cache hit instead of a function invocation. Guests get price-free HTML by
 * construction; signed-in buyers hydrate prices via the gated batch API.
 */
// Must be a literal (Next statically analyzes segment config) — keep in sync
// with PAGE_REVALIDATE in lib/products.ts, which the data fetches also use.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  // Canonical is the bare listing for EVERY query variant (the page is static,
  // so it can no longer read ?page= to self-canonicalise). Deeper pagination
  // as a crawl-discovery path is covered by the sitemap, which lists every
  // product × locale.
  return {
    title: dict.nav.catalog,
    description: dict.catalog.subtitleGuest,
    alternates: localeAlternates(locale, "/catalog"),
  };
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  const products = (await getAllProducts(PAGE_REVALIDATE)).map((p) => localizeProduct(p, locale));
  // The grid's unit is the colourway (product × colour) — each tile carries that
  // colour's own photo. `toTiles` strips variants/prices: what crosses into the
  // client payload here must never include a price (invariant #1).
  const tiles = toTiles(toColorways(products));

  // Plain listing — no heading/description/guest banner (owner direction,
  // 2026-07); the per-card "Trade pricing — sign in" tag carries the hint.
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <CatalogBrowser tiles={tiles} locale={locale} basePath={`/${locale}/catalog`} dict={dict} />
    </div>
  );
}
