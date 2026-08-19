import "server-only";
import {
  getShopifyProducts,
  getShopifyProductByHandle,
  type ShopifyProduct,
  type ShopifyVariant,
} from "./shopify";

/**
 * Product accessor for the storefront. Products now live in Shopify (headless
 * backend) rather than hard-coded JSON; this is a thin wrapper over the Admin
 * API reader in `shopify.ts`. The returned `ShopifyProduct` is the view-model
 * the pages/components consume.
 */

export type { ShopifyProduct as Product, ShopifyVariant as Variant };

/**
 * Since the public pages went static (2026-08), these run at BUILD/ISR time,
 * which makes their failure mode part of the deploy contract:
 *  - Shopify env NOT configured (local checkout without creds) → empty catalog
 *    with a warning; `next build` still passes, matching the pre-Shopify DX.
 *  - Env configured but Shopify errors → THROW: a build fails loudly (Vercel
 *    keeps the previous deployment live), and an ISR regeneration failure
 *    keeps serving the last good page rather than caching an empty catalog.
 */
function shopifyConfigured(): boolean {
  if (process.env.SHOPIFY_STORE_DOMAIN && process.env.SHOPIFY_ADMIN_TOKEN) return true;
  console.warn(
    "products: SHOPIFY_STORE_DOMAIN / SHOPIFY_ADMIN_TOKEN not set — serving an empty catalog (local no-creds mode).",
  );
  return false;
}

/**
 * `revalidate` is the Shopify fetch-cache TTL and — crucially — the floor for
 * any ISR page that calls this: Next reduces a route's revalidation interval
 * to its smallest fetch revalidate. Pages/sitemap pass PAGE_REVALIDATE so
 * "revalidate = 3600" actually means hourly; the gated APIs use the fresher
 * 60s default so quotes/orders track admin price edits closely.
 */
export const PAGE_REVALIDATE = 3600;

export async function getAllProducts(revalidate?: number): Promise<ShopifyProduct[]> {
  if (!shopifyConfigured()) return [];
  return getShopifyProducts(revalidate);
}

export async function getProductBySlug(
  slug: string,
  revalidate?: number,
): Promise<ShopifyProduct | null> {
  if (!shopifyConfigured()) return null;
  return getShopifyProductByHandle(slug, revalidate);
}

export function getVariantBySku(
  product: ShopifyProduct,
  sku: string,
): ShopifyVariant | undefined {
  return product.variants.find((v) => v.sku === sku);
}
