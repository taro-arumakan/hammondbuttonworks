import "server-only";
import type { ShopifyVariant } from "./shopify";
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

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}
