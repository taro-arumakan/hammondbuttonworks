import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createDraftOrder } from "@/lib/orders";
import { buildOrderLines, shipDate, UnknownSkuError } from "@/lib/order-lines";

/**
 * Checkout — turns the cart into a Shopify DRAFT order (bank-transfer flow;
 * no payment gateway). The client sends only (slug, sku, qty, engraving);
 * variants and prices are re-resolved server-side by `buildOrderLines`, which
 * the staff draft-order tool also uses — so the class price and ship notes are
 * identical on both paths. Middleware 401s guests before this runs; the session
 * is re-checked here.
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

  let built;
  try {
    built = await buildOrderLines(parsed.data.lines, customerClass);
  } catch (e) {
    if (e instanceof UnknownSkuError) {
      // Unlike the quote endpoint, checkout must not silently drop a line.
      return NextResponse.json(
        { error: `Item no longer available: ${e.sku}`, sku: e.sku },
        { status: 409 },
      );
    }
    throw e;
  }
  const { lines: orderLines, currency, maxDays, shippingJa } = built;

  // JA for the order note; buyer-facing response string follows the UI locale.
  const shippingForBuyer =
    parsed.data.locale === "ja"
      ? shippingJa
      : maxDays
        ? `${shipDate(maxDays)} (~${maxDays} days, made-to-order items)`
        : "in stock — ships promptly";

  try {
    const draft = await createDraftOrder({
      email,
      company: companyName,
      customerClass,
      currency,
      lines: orderLines,
      expectedShipping: shippingJa,
      locale: parsed.data.locale,
    });
    return NextResponse.json({ name: draft.name, id: draft.id, expectedShipping: shippingForBuyer });
  } catch (e) {
    console.error("checkout: draft order failed:", e);
    return NextResponse.json(
      { error: "Order could not be placed. Please try again or request a quote." },
      { status: 502 },
    );
  }
}
