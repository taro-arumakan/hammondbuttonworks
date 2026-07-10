import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { staffSession } from "@/lib/auth";
import { resolveTradeAccount } from "@/lib/shopify";
import { createDraftOrder } from "@/lib/orders";
import { buildOrderLines, UnknownSkuError } from "@/lib/order-lines";

/**
 * Staff tool — create an order on a customer's behalf (phone / LINE orders).
 *
 * The whole reason this exists: Shopify's draft-order admin UI only exposes
 * `appliedDiscount`, which can only REDUCE a price. There is no UI control that
 * raises one, so a manually-built draft order silently bills a `plus` customer
 * at 100%. Here we go through the same `buildOrderLines` + `createDraftOrder`
 * path as storefront checkout, which stamps `priceOverride` at the customer's
 * class — so the ×1.1 can never be forgotten or drift from the storefront.
 *
 * Auth: staff session (middleware 401s /api/admin/* without one). The staff
 * email is recorded on the order note for audit.
 */
const Body = z.object({
  email: z.string().email(),
  lines: z
    .array(
      z.object({
        sku: z.string().min(1),
        qty: z.number().int().positive().max(100000),
        engraving: z.boolean().default(false),
      }),
    )
    .min(1)
    .max(50),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const staff = await staffSession();
  if (!staff) return NextResponse.json({ error: "Staff login required." }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "入力内容を確認してください。" }, { status: 400 });
  }

  // Segment-gated: the class comes from Shopify, never from the form.
  const account = await resolveTradeAccount(parsed.data.email);
  if (!account) {
    return NextResponse.json(
      { error: "このメールアドレスの取引先が見つかりません（Shopify で価格区分を設定してください）。" },
      { status: 404 },
    );
  }

  let built;
  try {
    built = await buildOrderLines(parsed.data.lines, account.customerClass);
  } catch (e) {
    if (e instanceof UnknownSkuError) {
      return NextResponse.json(
        { error: `品番が見つかりません: ${e.sku}`, sku: e.sku },
        { status: 409 },
      );
    }
    throw e;
  }

  try {
    const order = await createDraftOrder({
      email: account.email,
      company: account.company,
      customerClass: account.customerClass,
      currency: built.currency,
      lines: built.lines,
      expectedShipping: built.shippingJa,
      locale: account.locale ?? "ja",
      createdBy: staff.email, // audit trail on the order note
    });
    const total = built.lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
    console.info(`admin: order ${order.name} created for ${account.email} by ${staff.email}`);
    return NextResponse.json({
      name: order.name,
      company: account.company,
      expectedShipping: built.shippingJa,
      total,
      currency: built.currency,
    });
  } catch (e) {
    console.error("admin: draft order failed:", e);
    return NextResponse.json({ error: "注文を作成できませんでした。" }, { status: 502 });
  }
}
