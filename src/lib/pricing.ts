import "server-only";
import type { ShopifyVariant } from "./shopify";
import type { Product } from "./products";
import { CLASS_MULTIPLIER, type CustomerClass } from "./customer";

/**
 * Server-only price resolver. Importing this in a client bundle is a build
 * error — prices NEVER cross into client code. Guests (no class) resolve to
 * `null`, which is how the catalog stays price-free for unauthenticated views.
 *
 * price = variant.basePrice × class multiplier (standard ×1.0, plus ×1.1).
 * No quantity breaks. JPY is rounded to whole yen.
 */

export type ResolvedPrice = {
  unitPrice: number;
  currency: string;
};

export function resolvePrice(
  variant: ShopifyVariant,
  customerClass: CustomerClass | null | undefined,
  currency: string,
): ResolvedPrice | null {
  if (!customerClass) return null;
  const raw = variant.basePrice * CLASS_MULTIPLIER[customerClass];
  const unitPrice = currency === "JPY" ? Math.round(raw) : Math.round(raw * 100) / 100;
  return { unitPrice, currency };
}

/**
 * "From" unit price for a product (cheapest variant × class), or null for guests.
 * Resolving here — and having callers pass the returned NUMBER to the card rather
 * than the customer's class — keeps the tier name (`standard`/`plus`) out of the
 * client RSC payload. (Any prop handed to a component in the tree is serialized;
 * a bare price is fine to expose to the logged-in buyer, the class name is not.)
 */
export function fromUnitPrice(product: Product, customerClass: CustomerClass | null): number | null {
  if (!customerClass || !product.variants.length) return null;
  const cheapest = product.variants.reduce(
    (a, b) => (b.basePrice < a.basePrice ? b : a),
    product.variants[0],
  );
  return resolvePrice(cheapest, customerClass, product.currency)?.unitPrice ?? null;
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}
