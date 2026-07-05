import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getProductBySlug, getVariantBySku } from "@/lib/products";
import { resolvePrice } from "@/lib/pricing";
import { createDraftOrder, type DraftOrderLine } from "@/lib/orders";

/**
 * Checkout — turns the cart into a Shopify DRAFT order (bank-transfer flow;
 * no payment gateway). The client sends only (slug, sku, qty, engraving);
 * variants and prices are re-resolved server-side, and the class-computed
 * unit price is stamped on every line (see lib/orders.ts). Middleware 401s
 * guests before this runs; the session is re-checked here.
 */

const Body = z.object({
  locale: z.string().max(8).default("en"),
  lines: z
    .array(
      z.object({
        slug: z.string(),
        sku: z.string(),
        qty: z.number().int().positive().max(100000),
        engraving: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(50),
});

/** today + N days, formatted for the shop timezone (Asia/Tokyo). */
function shipDate(days: number): string {
  const d = new Date(Date.now() + days * 86400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(d); // YYYY-MM-DD
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Trade login required." }, { status: 401 });
  }
  const { email, customerClass, companyName } = session.user;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const slugs = [...new Set(parsed.data.lines.map((l) => l.slug))];
  const products = new Map(
    await Promise.all(
      slugs.map(async (slug) => [slug, await getProductBySlug(slug)] as const),
    ),
  );

  let currency = "JPY";
  const orderLines: DraftOrderLine[] = [];
  const mtoDays: number[] = [];
  for (const line of parsed.data.lines) {
    const product = products.get(line.slug) ?? null;
    const variant = product ? getVariantBySku(product, line.sku) : undefined;
    if (!product || !variant) {
      // Unlike the quote endpoint, checkout must not silently drop a line.
      return NextResponse.json(
        { error: `Item no longer available: ${line.sku}`, sku: line.sku },
        { status: 409 },
      );
    }
    currency = product.currency;
    const price = resolvePrice(variant, customerClass, product.currency)!;
    if (!variant.inStock) mtoDays.push(product.leadTimeDays);
    orderLines.push({
      variantId: variant.id,
      quantity: line.qty,
      unitPrice: price.unitPrice,
      engraving: line.engraving,
      shipNote: variant.inStock
        ? "In stock — ships promptly"
        : `Made to order — ~${product.leadTimeDays} days (est. ${shipDate(product.leadTimeDays)})`,
    });
  }

  const expectedShipping = mtoDays.length
    ? `${shipDate(Math.max(...mtoDays))} (~${Math.max(...mtoDays)} days, made-to-order items)`
    : "in stock — ships promptly";

  try {
    const draft = await createDraftOrder({
      email,
      company: companyName,
      customerClass,
      currency,
      lines: orderLines,
      expectedShipping,
      locale: parsed.data.locale,
    });
    return NextResponse.json({ name: draft.name, id: draft.id, expectedShipping });
  } catch (e) {
    console.error("checkout: draft order failed:", e);
    return NextResponse.json(
      { error: "Order could not be placed. Please try again or request a quote." },
      { status: 502 },
    );
  }
}
