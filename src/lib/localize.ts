import type { ShopifyProduct } from "./shopify";
import type { Locale } from "./i18n-config";

/**
 * Localizes a product's display name for `locale`, falling back to the English
 * title. JA name/short come from Shopify metafields (hbw.name_ja / short_ja);
 * pages read `shortJa` directly for the JA short description. Pure + isomorphic.
 */
export function localizeProduct(product: ShopifyProduct, locale: Locale): ShopifyProduct {
  if (locale === "en" || !product.nameJa) return product;
  return { ...product, name: product.nameJa };
}
