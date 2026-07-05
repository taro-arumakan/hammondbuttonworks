import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { currentClass } from "@/lib/auth";
import { getProductBySlug, getVariantBySku } from "@/lib/products";
import { resolvePrice } from "@/lib/pricing";

/**
 * Batch price/availability resolution for the cart page. Same gating contract
 * as /api/price (middleware 401s guests; class re-checked here): the client
 * sends only (slug, sku, qty) and gets back this account's own prices plus
 * authoritative availability/lead-time — nothing is trusted from the client.
 */

const Body = z.object({
  lines: z
    .array(
      z.object({
        slug: z.string(),
        sku: z.string(),
        qty: z.number().int().positive().max(100000),
      }),
    )
    .min(1)
    .max(50),
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

  // Cart lines usually span few products — resolve each slug once.
  const slugs = [...new Set(parsed.data.lines.map((l) => l.slug))];
  const products = new Map(
    await Promise.all(
      slugs.map(async (slug) => [slug, await getProductBySlug(slug)] as const),
    ),
  );

  let currency = "JPY";
  let total = 0;
  const lines = [];
  for (const line of parsed.data.lines) {
    const product = products.get(line.slug) ?? null;
    const variant = product ? getVariantBySku(product, line.sku) : undefined;
    if (!product || !variant) {
      // Stale line (product unpublished / variant removed) — tell the client
      // so the cart page can flag it for removal instead of failing the cart.
      lines.push({ slug: line.slug, sku: line.sku, qty: line.qty, missing: true as const });
      continue;
    }
    const price = resolvePrice(variant, customerClass, product.currency)!;
    currency = product.currency;
    const lineTotal =
      product.currency === "JPY"
        ? Math.round(price.unitPrice * line.qty)
        : Number((price.unitPrice * line.qty).toFixed(2));
    total += lineTotal;
    lines.push({
      slug: line.slug,
      sku: line.sku,
      qty: line.qty,
      missing: false as const,
      name: product.name,
      color: variant.color,
      sizeMm: variant.sizeMm,
      unitPrice: price.unitPrice,
      lineTotal,
      inStock: variant.inStock,
      leadTimeDays: product.leadTimeDays,
    });
  }

  const present = lines.filter((l) => !l.missing) as Extract<
    (typeof lines)[number],
    { missing: false }
  >[];
  const mtoDays = present.filter((l) => !l.inStock).map((l) => l.leadTimeDays);

  return NextResponse.json({
    currency,
    lines,
    total: currency === "JPY" ? Math.round(total) : Number(total.toFixed(2)),
    allInStock: present.length > 0 && mtoDays.length === 0,
    maxLeadDays: mtoDays.length ? Math.max(...mtoDays) : 0,
  });
}
