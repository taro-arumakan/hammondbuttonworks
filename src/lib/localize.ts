import type { ShopifyProduct } from "./shopify";
import type { Locale } from "./i18n-config";

/**
 * Product copy localization. Style names stay ENGLISH in every locale (owner
 * direction, 2026-07 — brand voice, niceness.jp-style); `hbw.name_ja` remains
 * in Shopify should that change. JA pages read `shortJa` directly for the
 * short description. Pure + isomorphic.
 */
export function localizeProduct(product: ShopifyProduct, _locale: Locale): ShopifyProduct {
  return product;
}
