/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Product } from "@/lib/products";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import { formatPrice } from "@/lib/pricing";

/**
 * Catalog cell — one COLOURWAY (product × colour), aligned to the niceness.jp
 * thumbnail language: borderless on white, full-bleed square image, centered
 * serif name (letter-spaced) with a small tracked uppercase sub-line.
 *
 * `image` is that colour's variant photo (falls back to the product's featured
 * shot), `price` is the from-price for THIS colour, resolved server-side by the
 * caller (null for guests → a neutral "Trade pricing" tag). The customer's CLASS
 * name is never passed here, so it can't leak into the client payload.
 */
export function ProductCard({
  product,
  color,
  image,
  sizesMm,
  price,
  locale,
  dict,
}: {
  product: Product;
  color: string;
  image?: string;
  sizesMm: number[]; // sizes available in THIS colour
  price: number | null;
  locale: Locale;
  dict: Dictionary;
}) {
  const minMm = sizesMm.length ? Math.min(...sizesMm) : 0;
  const categoryLabel = dict.labels.category[product.category?.toLowerCase()] ?? product.category;
  const colorLabel = dict.labels.color[color.toLowerCase()] ?? color;
  const href = color
    ? `/${locale}/catalog/${product.slug}?color=${encodeURIComponent(color)}`
    : `/${locale}/catalog/${product.slug}`;

  return (
    <Link href={href} className="group flex flex-col">
      <div className="aspect-square overflow-hidden bg-stone-100">
        {image ? (
          <img
            src={image}
            alt={color ? `${product.name} — ${color}` : product.name}
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
        {/* Colour leads the meta line — it's what distinguishes sibling tiles. */}
        <p className="mt-[10px] text-[11px] uppercase tracking-[0.08em] text-stone-600">
          {color ? `${colorLabel} · ` : ""}
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
