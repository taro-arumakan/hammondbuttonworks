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
  color,
  colorLabel,
  image,
  sizesMm,
  locale,
  dict,
}: {
  slug: string;
  name: string;
  color: string; // exact option value — the identity the link carries
  colorLabel: string; // what the buyer reads (see productColorLabels)
  image?: string;
  sizesMm: number[]; // sizes available in THIS colour
  locale: Locale;
  dict: Dictionary;
}) {
  const minMm = sizesMm.length ? Math.min(...sizesMm) : 0;
  // A trailing "~" ("10mm~", "¥118~") marks a minimum when this colour comes
  // in several sizes; a single-size colourway (most metal designs) shows the
  // bare size and price. Same mark in both locales.
  const ranged = sizesMm.length > 1;
  const sizeLabel = sizesMm.length ? `${minMm}mm${ranged ? "~" : ""}` : "";
  // Colour leads the meta line — it's what distinguishes sibling tiles. The
  // categories are not on the tile: a design carries several (owner's
  // classification, 2026-10-09), which would crowd the line; they are a
  // catalog filter and a row on the product page instead.
  const meta = [color ? colorLabel : "", sizeLabel]
    .filter(Boolean)
    .join(" · ");
  const href = color
    ? `/${locale}/catalog/${slug}?color=${encodeURIComponent(color)}`
    : `/${locale}/catalog/${slug}`;

  return (
    <Link href={href} className="group flex flex-col">
      <div className="aspect-square overflow-hidden bg-stone-100">
        {image ? (
          <img
            alt={color ? `${name} — ${colorLabel}` : name}
            src={image}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-stone-100" />
        )}
      </div>
      {/* niceness.jp text metrics: 17px product number (Arimo); 12px/1px sub;
          26px image→title, 10px title→sub; centered, generous bottom air. */}
      <div className="px-2 pt-[26px] pb-10 text-center">
        <h3 className="font-code text-[17px] leading-tight tracking-[0.06em] text-foreground">
          {name}
        </h3>
        <p className="mt-[10px] text-[11px] uppercase tracking-[0.08em] text-stone-600">
          {meta}
        </p>
        <TilePrice
          slug={slug}
          color={color}
          ranged={ranged}
          tradeLabel={dict.catalog.cardTradePricing}
        />
      </div>
    </Link>
  );
}
