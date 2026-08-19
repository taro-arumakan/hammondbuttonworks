"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { type Locale, fmt } from "@/lib/i18n-config";
import { useAccountHint } from "@/lib/account-hint";
import { TradeOrderPanel, type VariantView } from "./TradeOrderPanel";

/**
 * Decides what a viewer sees on the (static) product page:
 *  - Guest → a "sign in for trade pricing" CTA. This is the prerendered HTML,
 *    so the cached page contains no prices by construction.
 *  - Trade (account-hint cookie) → the interactive ordering panel, which
 *    fetches its prices from the gated /api/price.
 *
 * ⚠️ Client component — every prop is serialized into the page payload. It
 * takes ONLY display scalars and the price-free `VariantView` list, never the
 * product object (whose variants carry basePrice) and never the class name.
 *
 * The `?color=` preselect (from catalog tiles) is read from location.search
 * after mount — reading it server-side would force the page dynamic, and
 * useSearchParams would swap the prerendered HTML for a Suspense fallback.
 */
export function PriceBlock({
  slug,
  leadTimeDays,
  colors,
  sizesMm,
  variants,
  productName,
  locale,
  dict,
}: {
  slug: string;
  leadTimeDays: number;
  colors: string[];
  sizesMm: number[];
  variants: VariantView[];
  productName: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const account = useAccountHint();
  // null = not yet read (pre-mount); "" = no preselect in the URL.
  const [initialColor, setInitialColor] = useState<string | null>(null);

  useEffect(() => {
    setInitialColor(new URLSearchParams(window.location.search).get("color") ?? "");
  }, []);

  if (!account) {
    return (
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6">
        <h2 className="text-lg font-semibold">{dict.priceBlock.heading}</h2>
        <p className="mt-2 text-sm text-stone-600">{dict.priceBlock.body}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/login`}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {dict.priceBlock.login}
          </Link>
          <Link
            href={`/${locale}/quote?sku=${encodeURIComponent(variants[0]?.sku ?? slug)}`}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium hover:border-accent"
          >
            {dict.priceBlock.requestAccess}
          </Link>
        </div>
        <p className="mt-4 text-xs text-stone-500">
          {fmt(dict.priceBlock.moqLine, { days: leadTimeDays })}
        </p>
      </div>
    );
  }

  // One frame while the URL preselect is read — the panel initializes its
  // colour state from `initialColor` at mount, so it must not mount earlier.
  if (initialColor === null) return null;

  return (
    <TradeOrderPanel
      productName={productName}
      slug={slug}
      leadTimeDays={leadTimeDays}
      colors={colors}
      initialColor={initialColor || undefined}
      sizesMm={sizesMm}
      locale={locale}
      dict={dict}
      variants={variants}
    />
  );
}
