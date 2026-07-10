/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Product } from "@/lib/products";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import { formatPrice } from "@/lib/pricing";

/**
 * Catalog cell, aligned to the niceness.jp thumbnail language: borderless on
 * white, full-bleed square image, centered serif name (letter-spaced) with a
 * small tracked uppercase sub-line. `price` is resolved server-side by the caller
 * (null for guests → a neutral "Trade pricing" tag) — the customer's CLASS name
 * is never passed here, so it can't leak into the client payload. Shows "From ¥X".
 */
export function ProductCard({
  product,
  price,
  locale,
  dict,
}: {
  product: Product;
  price: number | null;
  locale: Locale;
  dict: Dictionary;
}) {
  const minMm = product.variants.length ? Math.min(...product.variants.map((v) => v.sizeMm)) : 0;
  const categoryLabel = dict.labels.category[product.category?.toLowerCase()] ?? product.category;

  return (
    <Link href={`/${locale}/catalog/${product.slug}`} className="group flex flex-col">
      <div className="aspect-square overflow-hidden bg-stone-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-stone-100" />
        )}
      </div>
      {/* niceness.jp text metrics: serif ~17px/1.5px tracking; 12px/1px sub;
          26px image→title, 10px title→sub; centered, generous bottom air. */}
      <div className="px-2 pt-[26px] pb-10 text-center">
        <h3 className="font-serif text-[17px] leading-tight tracking-[0.09em] text-foreground">
          {product.name}
        </h3>
        <p className="mt-[10px] text-[11px] uppercase tracking-[0.08em] text-stone-600">
          {categoryLabel} · {dict.catalog.fromLigne} {minMm}mm
        </p>
        {price != null ? (
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.08em] text-foreground">
            {dict.catalog.fromLigne} {formatPrice(price, product.currency)}
          </p>
        ) : (
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.08em] text-stone-400">
            {dict.catalog.cardTradePricing}
          </p>
        )}
      </div>
    </Link>
  );
}
