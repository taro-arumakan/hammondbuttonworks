/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { Product } from "@/lib/products";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import type { CustomerClass } from "@/lib/customer";
import { resolvePrice, formatPrice } from "@/lib/pricing";

/**
 * Flat, gridline-separated catalog cell. Prices show only for a logged-in
 * customer class — guests see a neutral "Trade pricing" tag (no numbers ever
 * enter the guest payload). Card shows "From ¥X" (min variant × class).
 */
export function ProductCard({
  product,
  customerClass,
  locale,
  dict,
}: {
  product: Product;
  customerClass: CustomerClass | null;
  locale: Locale;
  dict: Dictionary;
}) {
  const minMm = product.variants.length ? Math.min(...product.variants.map((v) => v.sizeMm)) : 0;
  const cheapest = product.variants.reduce(
    (a, b) => (b.basePrice < a.basePrice ? b : a),
    product.variants[0],
  );
  const priced = customerClass && cheapest
    ? resolvePrice(cheapest, customerClass, product.currency)
    : null;
  const categoryLabel = dict.labels.category[product.category?.toLowerCase()] ?? product.category;

  return (
    <Link
      href={`/${locale}/catalog/${product.slug}`}
      className="group flex flex-col border-r border-b border-line bg-surface transition-colors hover:bg-background"
    >
      <div className="aspect-square overflow-hidden">
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
      <div className="border-t border-line px-4 py-3">
        <h3 className="font-serif text-lg leading-tight text-foreground">{product.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
          {categoryLabel} · {dict.catalog.fromLigne} {minMm}mm
        </p>
        <div className="mt-2 text-sm">
          {priced ? (
            <span className="font-medium text-foreground">
              {dict.catalog.fromLigne} {formatPrice(priced.unitPrice, priced.currency)}
            </span>
          ) : (
            <span className="text-xs text-stone-500">{dict.catalog.cardTradePricing}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
