/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import { TilePrice } from "./TilePrice";

/**
 * Catalog cell — one COLOURWAY (product × colour), aligned to the niceness.jp
 * thumbnail language: borderless on white, full-bleed square image, centered
 * serif name (letter-spaced) with a small tracked uppercase sub-line.
 *
 * Takes only client-safe scalars (no product object, no prices, no class) so
 * it can render inside the STATIC listing. The price line is the `TilePrice`
 * client island: guests get the neutral "Trade pricing" tag straight from the
 * page cache; signed-in buyers get their from-price hydrated from the gated
 * API. `image` is that colour's variant photo (falls back to the product's
 * featured shot).
 */
export function ProductCard({
  slug,
  name,
  category,
  color,
  image,
  sizesMm,
  locale,
  dict,
}: {
  slug: string;
  name: string;
  category: string;
  color: string;
  image?: string;
  sizesMm: number[]; // sizes available in THIS colour
  locale: Locale;
  dict: Dictionary;
}) {
  const minMm = sizesMm.length ? Math.min(...sizesMm) : 0;
  const categoryLabel = dict.labels.category[category?.toLowerCase()] ?? category;
  const colorLabel = dict.labels.color[color.toLowerCase()] ?? color;
  const href = color
    ? `/${locale}/catalog/${slug}?color=${encodeURIComponent(color)}`
    : `/${locale}/catalog/${slug}`;

  return (
    <Link href={href} className="group flex flex-col">
      <div className="aspect-square overflow-hidden bg-stone-100">
        {image ? (
          <img
            alt={color ? `${name} — ${color}` : name}
            src={image}
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
          {name}
        </h3>
        {/* Colour leads the meta line — it's what distinguishes sibling tiles. */}
        <p className="mt-[10px] text-[11px] uppercase tracking-[0.08em] text-stone-600">
          {color ? `${colorLabel} · ` : ""}
          {categoryLabel} · {dict.catalog.fromLigne} {minMm}mm
        </p>
        <TilePrice
          slug={slug}
          color={color}
          fromLabel={dict.catalog.fromLigne}
          tradeLabel={dict.catalog.cardTradePricing}
        />
      </div>
    </Link>
  );
}
