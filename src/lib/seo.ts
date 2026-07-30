import { LOCALES, DEFAULT_LOCALE, type Locale } from "./i18n-config";

/**
 * Canonical URL + hreflang helpers.
 *
 * Deliberately does NOT use `headers()` (unlike `url.ts`'s `baseUrl()`): reading
 * headers inside `generateMetadata` would opt every page out of static
 * rendering, which is the opposite of what the SEO work is for. The canonical
 * origin is a constant, so derive it from env with a hard-coded fallback.
 *
 * Every public page declares:
 *   - `canonical` — one address per page, so the `?color=…` / filter variants
 *     consolidate instead of competing as near-duplicates.
 *   - `languages` — reciprocal hreflang between /en and /ja, plus x-default.
 */

const FALLBACK_ORIGIN = "https://hammondbutton.works";

/**
 * Canonical site origin, no trailing slash. A malformed NEXT_PUBLIC_SITE_URL
 * must fall back rather than propagate: the layout feeds this to `new URL()`
 * for `metadataBase`, and a throw inside generateMetadata silently strips the
 * ENTIRE <head> metadata (title, description, canonical) from every page while
 * still returning 200s — a site-wide SEO blackout with no visible error.
 */
export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.error(`seo: NEXT_PUBLIC_SITE_URL is not a valid URL ("${configured}"); using ${FALLBACK_ORIGIN}`);
    }
  }
  return FALLBACK_ORIGIN;
}

/** Absolute URL for a locale-less path, e.g. ("ja", "/catalog") -> …/ja/catalog */
export function absoluteUrl(locale: Locale, path = ""): string {
  const p = path && !path.startsWith("/") ? `/${path}` : path;
  return `${siteUrl()}/${locale}${p}`;
}

/**
 * `alternates` block for Next metadata. `path` is the locale-less path
 * ("" for home, "/catalog", "/catalog/pebble"). Filter/sort queries must NOT
 * be included — the canonical is the bare URL. The one legitimate query is
 * pagination ("/catalog?page=2"): paginated listings self-canonicalise.
 */
export function localeAlternates(locale: Locale, path = "") {
  const languages: Record<string, string> = {};
  for (const l of LOCALES) languages[l] = absoluteUrl(l, path);
  // x-default: where a user of an unlisted language should land.
  languages["x-default"] = absoluteUrl(DEFAULT_LOCALE, path);
  return { canonical: absoluteUrl(locale, path), languages };
}
