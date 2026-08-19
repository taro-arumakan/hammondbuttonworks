import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentClass } from "@/lib/auth";
import { getProductBySlug, getVariantBySku } from "@/lib/products";
import { resolvePrice, fromUnitPriceOf } from "@/lib/pricing";

/**
 * Gated price resolution. Two shapes on one endpoint (so the middleware guest
 * 401 covers both):
 *
 *  - Single quote  { slug, variantSku, qty }   — the product page's order
 *    panel, on every colour/size/qty change.
 *  - Tile batch    { tiles: [{ slug, color }] } — from-prices for the catalog
 *    tiles. Since the listing went static (2026-08), a signed-in page view
 *    hydrates every visible tile's from-price through ONE call here (see
 *    price-batcher.ts) instead of prices being server-rendered.
 *
 * Middleware already 401s guests before this runs; we re-check the customer
 * class here too (defense in depth) — pricing is NEVER computed without an
 * authenticated class. Responses carry only this account's own prices.
 */
const QuoteBody = z.object({
  slug: z.string(),
  variantSku: z.string(),
  qty: z.number().int().positive(),
});

const BatchBody = z.object({
  tiles: z
    .array(z.object({ slug: z.string(), color: z.string() }))
    .min(1)
    .max(60), // keep in sync with BATCH_MAX in price-batcher.ts
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const customerClass = await currentClass();
  if (!customerClass) {
    return NextResponse.json({ error: "Trade login required." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);

  const batch = BatchBody.safeParse(body);
  if (batch.success) {
    // Tile batch: resolve each colourway's cheapest variant × class multiplier.
    const slugs = [...new Set(batch.data.tiles.map((t) => t.slug))];
    // Per-slug catch: getProductBySlug throws on a Shopify error (deliberate
    // for build loudness) — here one throttled lookup must degrade to "that
    // tile keeps its tag" (uncached client-side, so it retries), not 500 the
    // whole batch.
    const products = new Map(
      await Promise.all(
        slugs.map(async (s) => [s, await getProductBySlug(s).catch(() => null)] as const),
      ),
    );
    const prices = [];
    for (const { slug, color } of batch.data.tiles) {
      const product = products.get(slug) ?? null;
      if (!product) continue; // unknown/unpublished — omit, client keeps its tag
      const variants = product.variants.filter((v) => v.color === color);
      const amount = fromUnitPriceOf(variants, product.currency, customerClass);
      if (amount == null) continue;
      prices.push({ slug, color, amount, currency: product.currency });
    }
    return NextResponse.json({ prices });
  }

  const parsed = QuoteBody.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const { slug, variantSku, qty } = parsed.data;
  const product = await getProductBySlug(slug);
  const variant = product ? getVariantBySku(product, variantSku) : undefined;
  if (!product || !variant) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const price = resolvePrice(variant, customerClass, product.currency);
  if (!price) {
    return NextResponse.json({ error: "Trade login required." }, { status: 401 });
  }

  return NextResponse.json({
    unitPrice: price.unitPrice,
    currency: price.currency,
    lineTotal: price.currency === "JPY"
      ? Math.round(price.unitPrice * qty)
      : Number((price.unitPrice * qty).toFixed(2)),
    inStock: variant.inStock,
  });
}
