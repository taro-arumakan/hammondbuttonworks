import type { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/products";
import { DEFAULT_LOCALE, LOCALES } from "@/lib/i18n-config";
import { absoluteUrl } from "@/lib/seo";

/**
 * XML sitemap for /sitemap.xml.
 *
 * This is the safety net that makes the robots.txt filter rules safe: every
 * internal link to a product carries `?color=…` (see ProductCard), and the
 * filtered catalog URLs are disallowed — so the sitemap is what guarantees
 * Google still discovers every canonical product URL.
 *
 * Listed pages are the public, indexable ones only. `/cart`, `/login`,
 * `/signin/*` and the whole admin surface are deliberately absent (and
 * disallowed in robots.ts).
 *
 * NB middleware skips any path containing a dot, so /sitemap.xml is served
 * directly and never locale-redirected.
 */

// NB: the effective interval is 60s, not this — Next lowers a route's
// revalidate to the smallest `next.revalidate` of any fetch inside it, and
// shopifyFetch declares 60. Harmless (ISR only regenerates when requested);
// kept as the intent-documenting ceiling.
export const revalidate = 3600;

const STATIC_PATHS: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" }[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/catalog", priority: 0.9, changeFrequency: "weekly" },
  { path: "/quote", priority: 0.7, changeFrequency: "monthly" },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" },
];

/** One entry per locale, each cross-linking the others via hreflang. */
function entriesFor(
  path: string,
  opts: { lastModified?: Date; priority: number; changeFrequency: "daily" | "weekly" | "monthly" },
): MetadataRoute.Sitemap {
  const languages: Record<string, string> = Object.fromEntries(
    LOCALES.map((l) => [l, absoluteUrl(l, path)]),
  );
  // Mirror the <head> tags: every alternate set advertises an x-default too.
  languages["x-default"] = absoluteUrl(DEFAULT_LOCALE, path);
  return LOCALES.map((locale) => ({
    url: absoluteUrl(locale, path),
    lastModified: opts.lastModified,
    changeFrequency: opts.changeFrequency,
    priority: opts.priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_PATHS.flatMap(({ path, priority, changeFrequency }) =>
    entriesFor(path, { priority, changeFrequency }),
  );

  // A Shopify outage must not 500 the sitemap — still serve the static pages.
  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await getAllProducts();
    productEntries = products.flatMap((p) =>
      entriesFor(`/catalog/${p.slug}`, {
        lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
        priority: 0.8,
        changeFrequency: "weekly",
      }),
    );
  } catch (err) {
    console.error("sitemap: product fetch failed, serving static pages only:", err);
  }

  return [...staticEntries, ...productEntries];
}
