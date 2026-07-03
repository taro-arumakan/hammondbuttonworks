"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import { type Locale, fmt } from "@/lib/i18n-config";

/**
 * Logged-in ordering panel. Prices come from the gated /api/price endpoint
 * (server-authoritative, class-aware) on every color/size/qty change, so the
 * client never holds the price ladder — only the single quote it asked for.
 * (Draft-order checkout is wired in Phase 3; for now it links to a quote.)
 */

type VariantView = { sku: string; color: string; sizeMm: number; inStock: boolean };

type Props = {
  productName: string;
  slug: string;
  leadTimeDays: number;
  colors: string[];
  sizesMm: number[];
  variants: VariantView[];
  productUrl: string;
  locale: Locale;
  dict: Dictionary;
};

type Quote = { unitPrice: number; currency: string; lineTotal: number; inStock: boolean };

function money(n: number, currency: string) {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(n);
}

export function TradeOrderPanel({
  productName,
  slug,
  leadTimeDays,
  colors,
  sizesMm,
  variants,
  locale,
  dict,
}: Props) {
  const t = dict.order;
  const [color, setColor] = useState(colors[0] ?? "");
  const [sizeMm, setSizeMm] = useState(sizesMm[0] ?? 0);
  const [qty, setQty] = useState(1);
  const [engraving, setEngraving] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => variants.find((v) => v.color === color && v.sizeMm === sizeMm),
    [variants, color, sizeMm],
  );

  useEffect(() => {
    if (!selected) {
      setQuote(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    fetch("/api/price", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, variantSku: selected.sku, qty: Math.max(1, qty) }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? t.pricingError);
        return r.json();
      })
      .then((data: Quote) => active && setQuote(data))
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [slug, selected, qty, t.pricingError]);

  const chip = (active: boolean) =>
    `rounded-lg border px-3 py-2 text-sm transition ${
      active ? "border-accent ring-1 ring-accent" : "border-stone-200 hover:border-stone-300"
    }`;

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-semibold">{t.heading}</h2>

      {/* Color */}
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-stone-700">{t.color}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button key={c} type="button" onClick={() => setColor(c)} className={chip(c === color)}>
              {c}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Size */}
      <fieldset className="mt-4">
        <legend className="text-sm font-medium text-stone-700">{t.size}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {sizesMm.map((s) => (
            <button key={s} type="button" onClick={() => setSizeMm(s)} className={chip(s === sizeMm)}>
              {s}mm
            </button>
          ))}
        </div>
      </fieldset>

      {/* Quantity */}
      <div className="mt-5">
        <label htmlFor="qty" className="text-sm font-medium text-stone-700">
          {t.quantity}
        </label>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="h-9 w-9 rounded-md border border-stone-300 text-lg leading-none"
            aria-label={t.decrease}
          >
            −
          </button>
          <input
            id="qty"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="h-9 w-24 rounded-md border border-stone-300 px-2 text-center"
          />
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="h-9 w-9 rounded-md border border-stone-300 text-lg leading-none"
            aria-label={t.increase}
          >
            +
          </button>
        </div>
      </div>

      {/* Engraving flag */}
      <label className="mt-4 flex items-center gap-2 text-sm text-stone-700">
        <input type="checkbox" checked={engraving} onChange={(e) => setEngraving(e.target.checked)} />
        {t.engraving}
      </label>

      {/* Price + expected shipping */}
      <div className="mt-5 rounded-lg bg-stone-50 p-4">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : loading || !quote ? (
          <p className="text-sm text-stone-400">{t.calculating}</p>
        ) : (
          <>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-stone-600">{t.unitPrice}</span>
              <span className="text-xl font-semibold">{money(quote.unitPrice, quote.currency)}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-sm text-stone-600">
                {t.lineTotal} ({qty})
              </span>
              <span className="font-medium">{money(quote.lineTotal, quote.currency)}</span>
            </div>
            <p className="mt-2 text-xs text-stone-500">
              {t.shipDate}:{" "}
              {quote.inStock ? t.inStock : fmt(t.madeToOrder, { days: leadTimeDays })}
            </p>
          </>
        )}
      </div>

      <a
        href={`/${locale}/quote?sku=${encodeURIComponent(selected?.sku ?? slug)}&qty=${qty}${engraving ? "&engraving=1" : ""}`}
        className="mt-4 block rounded-md bg-accent px-4 py-2.5 text-center font-medium text-white hover:opacity-90"
      >
        {t.customQuote}
      </a>
    </div>
  );
}
