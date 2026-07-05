"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { type Locale, fmt } from "@/lib/i18n-config";
import {
  useCart,
  updateQty,
  removeFromCart,
  clearCart,
  type CartItem,
} from "@/lib/cart-client";

/**
 * Cart page body (logged-in only; the server shell redirects guests). Prices
 * and availability come from the gated /api/cart/quote on every cart change —
 * the client stores only selections. "Place order" POSTs to /api/checkout,
 * which creates the Shopify draft order (bank-transfer flow).
 */

type QuoteLine =
  | { slug: string; sku: string; qty: number; missing: true }
  | {
      slug: string;
      sku: string;
      qty: number;
      missing: false;
      name: string;
      color: string;
      sizeMm: number;
      unitPrice: number;
      lineTotal: number;
      inStock: boolean;
      leadTimeDays: number;
    };

type CartQuote = {
  currency: string;
  lines: QuoteLine[];
  total: number;
  allInStock: boolean;
  maxLeadDays: number;
};

type OrderResult = { name: string; expectedShipping: string };

function money(n: number, currency: string) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(n);
}

export function CartView({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const t = dict.cart;
  const items = useCart();
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<OrderResult | null>(null);

  // Re-quote whenever the cart changes.
  useEffect(() => {
    if (items.length === 0) {
      setQuote(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lines: items.map(({ slug, sku, qty }) => ({ slug, sku, qty })) }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? t.errorGeneric);
        return r.json();
      })
      .then((q: CartQuote) => active && setQuote(q))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [items, t.errorGeneric]);

  const placeOrder = useCallback(async () => {
    setPlacing(true);
    setError(null);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          lines: items.map(({ slug, sku, qty, engraving }) => ({ slug, sku, qty, engraving })),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? t.errorGeneric);
      setPlaced({ name: data.name, expectedShipping: data.expectedShipping });
      clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : t.errorGeneric);
    } finally {
      setPlacing(false);
    }
  }, [items, locale, t.errorGeneric]);

  // --- Success state ---------------------------------------------------------
  if (placed) {
    return (
      <div className="frame-double mt-8 bg-surface px-6 py-14 text-center">
        <h2 className="font-serif text-2xl text-foreground">{t.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-xl text-stone-600">
          {fmt(t.successBody, { name: placed.name })}
        </p>
        <p className="mt-2 text-sm text-stone-500">
          {fmt(t.successShipping, { date: placed.expectedShipping })}
        </p>
        <Link
          href={`/${locale}/catalog`}
          className="mt-6 inline-block rounded-md bg-foreground px-4 py-2.5 text-background hover:bg-accent"
        >
          {t.continueShopping}
        </Link>
      </div>
    );
  }

  // --- Empty state -----------------------------------------------------------
  if (items.length === 0) {
    return (
      <div className="frame-double mt-8 bg-surface px-6 py-14 text-center">
        <p className="text-stone-600">{t.empty}</p>
        <Link
          href={`/${locale}/catalog`}
          className="mt-4 inline-block text-sm text-accent underline hover:text-foreground"
        >
          {t.browseCatalog}
        </Link>
      </div>
    );
  }

  const lineFor = (i: CartItem): QuoteLine | undefined =>
    quote?.lines.find((l) => l.sku === i.sku);

  return (
    <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
      {/* Lines */}
      <div className="frame-double min-w-0 flex-1 bg-surface">
        <ul className="divide-y divide-line">
          {items.map((i) => {
            const line = lineFor(i);
            const stale = line?.missing === true;
            return (
              <li key={`${i.sku}-${i.engraving}`} className="flex flex-wrap items-center gap-4 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-lg leading-tight text-foreground">{i.name}</p>
                  <p className="mt-0.5 text-xs uppercase tracking-wide text-stone-500">
                    {i.color} · {i.sizeMm}mm · {i.sku}
                  </p>
                  {i.engraving && (
                    <p className="mt-0.5 text-xs text-accent">{t.engravingYes}</p>
                  )}
                  <p className="mt-1 text-xs text-stone-500">
                    {stale ? (
                      <span className="text-red-600">{t.staleLine}</span>
                    ) : line && !line.missing ? (
                      line.inStock ? t.shipInStock : fmt(t.shipMto, { days: line.leadTimeDays })
                    ) : null}
                  </p>
                </div>

                {/* Qty */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => updateQty(i.sku, i.engraving, Math.max(1, i.qty - 1))}
                    className="h-8 w-8 border border-line text-lg leading-none hover:border-accent"
                    aria-label={dict.order.decrease}
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={i.qty}
                    onChange={(e) =>
                      updateQty(i.sku, i.engraving, Math.max(1, Number(e.target.value) || 1))
                    }
                    className="h-8 w-16 border border-line bg-surface px-1 text-center text-sm"
                    aria-label={t.qty}
                  />
                  <button
                    type="button"
                    onClick={() => updateQty(i.sku, i.engraving, i.qty + 1)}
                    className="h-8 w-8 border border-line text-lg leading-none hover:border-accent"
                    aria-label={dict.order.increase}
                  >
                    +
                  </button>
                </div>

                {/* Prices */}
                <div className="w-28 text-right text-sm">
                  {line && !line.missing ? (
                    <>
                      <p className="font-medium text-foreground">
                        {money(line.lineTotal, quote!.currency)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {money(line.unitPrice, quote!.currency)} {dict.catalog.perUnit}
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-stone-400">{loading ? "…" : "—"}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(i.sku, i.engraving)}
                  className="text-xs text-stone-400 underline hover:text-red-600"
                >
                  {t.remove}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Summary */}
      <aside className="w-full shrink-0 lg:w-80">
        <div className="frame-double bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-stone-600">{t.orderTotal}</span>
            <span className="font-serif text-2xl text-foreground">
              {quote ? money(quote.total, quote.currency) : "…"}
            </span>
          </div>
          <p className="mt-3 border-t border-line pt-3 text-xs text-stone-500">
            {t.shipEstimate}:{" "}
            {quote
              ? quote.allInStock
                ? t.shipEstimateAll
                : fmt(t.shipEstimateMto, { days: quote.maxLeadDays })
              : "…"}
          </p>
          <p className="mt-2 text-xs text-stone-500">{t.bankNote}</p>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="button"
            onClick={placeOrder}
            disabled={placing || loading || !quote || quote.lines.some((l) => l.missing)}
            className="mt-4 w-full rounded-md bg-accent px-4 py-2.5 font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {placing ? t.placing : t.placeOrder}
          </button>
        </div>
      </aside>
    </div>
  );
}
