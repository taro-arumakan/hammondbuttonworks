#!/usr/bin/env node
/**
 * Post-build guard for invariant #1: a guest's prerendered HTML (and RSC
 * payload) must contain ZERO price data. Runs after `next build` (wired into
 * the npm build script, so Vercel deploys are gated too).
 *
 * Also asserts the pages are actually PRERENDERED — if someone reintroduces a
 * request-time dependency (auth()/cookies()/searchParams) the .html files
 * disappear and this fails, which is the point: static-ness is the cost fix
 * for the 2026-07 crawler incident, not an accident of the build.
 *
 * Ban list (numeric/value forms only — the i18n dictionaries legitimately ship
 * LABEL strings like "unitPrice":"Unit price"):
 *   ¥1,234 / ￥1234       formatted prices
 *   "basePrice":<digit>   raw Shopify variant price
 *   "unitPrice":<digit>   resolved price
 *   "amount":<digit>      batch-API price shape
 *   customerClass         the tier must never be serialized
 *   pricing_segment       ditto (Shopify metafield key)
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";

const PAGES = [
  "en", "ja",
  "en/catalog", "ja/catalog",
  "en/login", "ja/login",
  "en/quote", "ja/quote",
  "en/cart", "ja/cart",
  "en/about", "ja/about",
];

const BANNED = [
  [/[¥￥]\s?\d[\d,]*/, "formatted price"],
  [/"basePrice"\s*:\s*\d/, "raw basePrice"],
  [/"unitPrice"\s*:\s*\d/, "resolved unitPrice"],
  [/"amount"\s*:\s*\d/, "price amount"],
  [/customerClass/, "customer class"],
  [/pricing_segment/, "pricing segment"],
];

let failed = false;
let scanned = 0;

function scan(path, required) {
  if (!existsSync(path)) {
    if (required) {
      console.error(`✗ ${path} missing — page is no longer prerendered (static-ness regression)`);
      failed = true;
    }
    return;
  }
  scanned++;
  const body = readFileSync(path, "utf8");
  for (const [re, label] of BANNED) {
    const m = body.match(re);
    if (m) {
      console.error(`✗ ${path}: ${label} leaked: …${m[0]}…`);
      failed = true;
    }
  }
  return body;
}

for (const page of PAGES) {
  for (const ext of ["html", "rsc"]) scan(`.next/server/app/${page}.${ext}`, true);
}

// PRODUCT PAGES — the highest-risk surface: PriceBlock's props serialize into
// these pages' RSC payloads, and this exact page type carried the historical
// basePrice leak. Enumerate whatever generateStaticParams prerendered.
let productPages = 0;
for (const locale of ["en", "ja"]) {
  const dir = `.next/server/app/${locale}/catalog`;
  if (!existsSync(dir)) continue;
  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".html") && !entry.endsWith(".rsc")) continue;
    scan(`${dir}/${entry}`, true);
    if (entry.endsWith(".html")) productPages++;
  }
}

// On a real deploy (Shopify creds present) the checks above must not silently
// degrade: an empty catalog page + zero prerendered product pages means the
// catalog fetch quietly returned nothing (lost env vars, token rotation typo)
// — which would ship a green deploy where every product URL 404s.
if (process.env.SHOPIFY_STORE_DOMAIN) {
  if (productPages === 0) {
    console.error("✗ Shopify env is set but no product pages were prerendered — empty catalog?");
    failed = true;
  }
  for (const locale of ["en", "ja"]) {
    const listing = `.next/server/app/${locale}/catalog.html`;
    const body = existsSync(listing) ? readFileSync(listing, "utf8") : "";
    if (!new RegExp(`href="/${locale}/catalog/[a-z0-9-]`).test(body)) {
      console.error(`✗ ${listing}: no product links in the prerendered listing — empty catalog?`);
      failed = true;
    }
  }
}

if (failed) {
  console.error("guard-guest-html: FAILED — guest payload contains price data or pages went dynamic.");
  process.exit(1);
}
console.log(
  `guard-guest-html: OK — ${scanned} files scanned (${productPages} product pages), 0 price strings in guest HTML/RSC.`,
);
