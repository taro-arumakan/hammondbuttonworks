import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentClass } from "@/lib/auth";
import { getProductBySlug, getVariantBySku } from "@/lib/products";
import { resolvePrice } from "@/lib/pricing";

/**
 * Gated price resolution for interactive variant/quantity changes.
 *
 * Middleware already 401s guests before this runs; we re-check the customer
 * class here too (defense in depth) — pricing is NEVER computed without an
 * authenticated class. The response carries only this account's own price.
 */
const Body = z.object({
  slug: z.string(),
  variantSku: z.string(),
  qty: z.number().int().positive(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const customerClass = await currentClass();
  if (!customerClass) {
    return NextResponse.json({ error: "Trade login required." }, { status: 401 });
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
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
