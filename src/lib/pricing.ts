import "server-only";
import type { Tier, Variant } from "./schema";

/**
 * Server-only tier/quantity price resolver. Importing this in a client bundle
 * is a build error — prices NEVER cross into client code. Guests (no tier)
 * always resolve to `null`, which is how the catalog stays price-free for
 * unauthenticated visitors.
 */

export type ResolvedPrice = {
  unitPrice: number;
  currency: string;
  appliedMinQty: number;
};

export function resolvePrice(
  variant: Variant,
  tier: Tier | null | undefined,
  qty: number,
): ResolvedPrice | null {
  if (!tier) return null;

  const breaks = variant.priceByTier[tier];
  if (!breaks || breaks.length === 0) return null;

  // Breaks are validated as strictly ascending by minQty. Pick the highest
  // break whose minQty the quantity satisfies; fall back to the first.
  let chosen = breaks[0];
  for (const b of breaks) {
    if (qty >= b.minQty) chosen = b;
  }

  return {
    unitPrice: chosen.unitPrice,
    currency: chosen.currency,
    appliedMinQty: chosen.minQty,
  };
}

export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}
