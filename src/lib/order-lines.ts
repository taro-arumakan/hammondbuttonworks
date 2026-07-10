import "server-only";
import { getAllProducts } from "./products";
import { resolvePrice } from "./pricing";
import type { DraftOrderLine } from "./orders";
import type { CustomerClass } from "./customer";

/**
 * The single place an order's lines are built. BOTH the storefront checkout and
 * the staff draft-order tool go through here, so the class multiplier (×1.1) and
 * the ship-note wording can never diverge between them — a divergence would mean
 * mispriced invoices, which is the exact failure `priceOverride` exists to avoid.
 *
 * Variants are re-resolved from Shopify by SKU server-side; the caller never
 * supplies a price.
 */

export type LineSpec = { sku: string; qty: number; engraving?: boolean };

export class UnknownSkuError extends Error {
  constructor(readonly sku: string) {
    super(`Unknown or unavailable SKU: ${sku}`);
  }
}

/** today + N days in the shop timezone (Asia/Tokyo), as YYYY-MM-DD. */
export function shipDate(days: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(d);
}

export type BuiltOrder = {
  lines: DraftOrderLine[];
  currency: string;
  maxDays: number; // 0 when everything is in stock
  /** Order-level shipping summary, Japanese (the order note + 請求書 are JA). */
  shippingJa: string;
};

export async function buildOrderLines(
  specs: LineSpec[],
  customerClass: CustomerClass,
): Promise<BuiltOrder> {
  const products = await getAllProducts();
  const bySku = new Map(
    products.flatMap((p) => p.variants.map((v) => [v.sku, { product: p, variant: v }] as const)),
  );

  let currency = "JPY";
  const lines: DraftOrderLine[] = [];
  const mtoDays: number[] = [];

  for (const spec of specs) {
    const hit = bySku.get(spec.sku);
    if (!hit) throw new UnknownSkuError(spec.sku);
    const { product, variant } = hit;
    currency = product.currency;

    const price = resolvePrice(variant, customerClass, product.currency)!;
    if (!variant.inStock) mtoDays.push(product.leadTimeDays);

    lines.push({
      variantId: variant.id,
      quantity: spec.qty,
      unitPrice: price.unitPrice, // base × class multiplier — stamped as priceOverride
      engraving: !!spec.engraving,
      shipNote: variant.inStock
        ? "在庫あり — 短納期で出荷"
        : `受注生産 — 約${product.leadTimeDays}日（出荷目安 ${shipDate(product.leadTimeDays)}）`,
    });
  }

  const maxDays = mtoDays.length ? Math.max(...mtoDays) : 0;
  const shippingJa = maxDays
    ? `${shipDate(maxDays)}（約${maxDays}日・受注生産品を含む）`
    : "在庫あり — 短納期で出荷";

  return { lines, currency, maxDays, shippingJa };
}
