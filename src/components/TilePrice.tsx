"use client";

import { useEffect, useState } from "react";
import { useAccountHint } from "@/lib/account-hint";
import { requestFromPrice, type FromPrice } from "@/lib/price-batcher";
import { formatMoney } from "@/lib/money";

/**
 * The price line of a catalog tile, hydrated client-side so the tile itself
 * can be served from the static page cache.
 *
 *  - Guest (no account hint): the neutral "Trade pricing — sign in" tag; no
 *    network call is ever made. This is also the SSR / prerender output, so
 *    the cached guest HTML contains no prices BY CONSTRUCTION (invariant #1).
 *  - Signed-in: asks the batcher for this colourway's from-price (one pooled
 *    POST per page view) and swaps the tag for the price when it arrives.
 */
export function TilePrice({
  slug,
  color,
  fromLabel,
  tradeLabel,
}: {
  slug: string;
  color: string;
  /** dict.catalog.fromLigne — "From" */
  fromLabel: string;
  /** dict.catalog.cardTradePricing — the guest tag */
  tradeLabel: string;
}) {
  const account = useAccountHint();
  const [price, setPrice] = useState<FromPrice | null>(null);

  useEffect(() => {
    if (!account) {
      setPrice(null);
      return;
    }
    let active = true;
    requestFromPrice(slug, color).then((p) => {
      if (active) setPrice(p);
    });
    return () => {
      active = false;
    };
  }, [account, slug, color]);

  if (price) {
    return (
      <p className="mt-1.5 text-[11px] uppercase tracking-[0.08em] text-foreground">
        {fromLabel} {formatMoney(price.amount, price.currency)}
      </p>
    );
  }
  return (
    <p className="mt-1.5 text-[11px] uppercase tracking-[0.08em] text-stone-400">
      {tradeLabel}
    </p>
  );
}
