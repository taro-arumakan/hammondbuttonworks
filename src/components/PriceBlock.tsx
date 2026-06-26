import Link from "next/link";
import type { Product, Tier } from "@/lib/schema";
import type { Dictionary } from "@/lib/i18n";
import { type Locale, fmt } from "@/lib/i18n-config";
import { TradeOrderPanel } from "./TradeOrderPanel";

/**
 * Server component that decides what a viewer may see:
 *  - Guest  → a "sign in for trade pricing" CTA. No prices reach the payload.
 *  - Trade  → the interactive ordering panel (prices fetched server-side).
 */
export function PriceBlock({
  product,
  tier,
  productUrl,
  locale,
  dict,
}: {
  product: Product;
  tier: Tier | null;
  productUrl: string;
  locale: Locale;
  dict: Dictionary;
}) {
  const unitLabel = dict.labels.unit[product.unit] ?? product.unit;

  if (!tier) {
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
            href={`/${locale}/quote?sku=${encodeURIComponent(product.variants[0].variantSku)}`}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium hover:border-accent"
          >
            {dict.priceBlock.requestAccess}
          </Link>
        </div>
        <p className="mt-4 text-xs text-stone-500">
          {fmt(dict.priceBlock.moqLine, {
            moq: product.moq,
            unit: unitLabel,
            days: product.leadTimeDays,
          })}
        </p>
      </div>
    );
  }

  const snipcartEnabled = Boolean(process.env.NEXT_PUBLIC_SNIPCART_KEY);

  return (
    <TradeOrderPanel
      productName={product.name}
      slug={product.slug}
      unit={product.unit}
      unitLabel={unitLabel}
      moq={product.moq}
      material={product.material}
      holeType={product.holeType}
      face={product.face}
      productUrl={productUrl}
      snipcartEnabled={snipcartEnabled}
      locale={locale}
      dict={dict}
      variants={product.variants.map((v) => ({
        variantSku: v.variantSku,
        sizeLigne: v.sizeLigne,
        sizeMm: v.sizeMm,
        finish: v.finish,
        colorHex: v.colorHex,
        inStockSample: v.inStockSample,
      }))}
    />
  );
}
