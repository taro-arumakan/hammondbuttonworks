import Link from "next/link";
import type { Product } from "@/lib/products";
import type { Dictionary } from "@/lib/i18n";
import { type Locale, fmt } from "@/lib/i18n-config";
import type { CustomerClass } from "@/lib/customer";
import { TradeOrderPanel } from "./TradeOrderPanel";

/**
 * Decides what a viewer may see:
 *  - Guest → a "sign in for trade pricing" CTA. No prices reach the payload.
 *  - Trade → the interactive ordering panel (prices fetched server-side).
 */
export function PriceBlock({
  product,
  customerClass,
  productUrl,
  locale,
  dict,
}: {
  product: Product;
  customerClass: CustomerClass | null;
  productUrl: string;
  locale: Locale;
  dict: Dictionary;
}) {
  if (!customerClass) {
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
            href={`/${locale}/quote?sku=${encodeURIComponent(product.variants[0]?.sku ?? product.slug)}`}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium hover:border-accent"
          >
            {dict.priceBlock.requestAccess}
          </Link>
        </div>
        <p className="mt-4 text-xs text-stone-500">
          {fmt(dict.priceBlock.moqLine, { days: product.leadTimeDays })}
        </p>
      </div>
    );
  }

  return (
    <TradeOrderPanel
      productName={product.name}
      slug={product.slug}
      leadTimeDays={product.leadTimeDays}
      colors={product.colors}
      sizesMm={product.sizesMm}
      productUrl={productUrl}
      locale={locale}
      dict={dict}
      variants={product.variants.map((v) => ({
        sku: v.sku,
        color: v.color,
        sizeMm: v.sizeMm,
        inStock: v.inStock,
      }))}
    />
  );
}
