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

export async function getAllProducts(): Promise<ShopifyProduct[]> {
  return getShopifyProducts();
}

export async function getProductBySlug(slug: string): Promise<ShopifyProduct | null> {
  return getShopifyProductByHandle(slug);
}

export function getVariantBySku(
  product: ShopifyProduct,
  sku: string,
): ShopifyVariant | undefined {
  return product.variants.find((v) => v.sku === sku);
}
