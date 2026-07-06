import "server-only";
import { shopifyMutate } from "./shopify";
import type { CustomerClass } from "./customer";

/**
 * Draft-order creation (Phase 3 checkout). Every storefront order becomes a
 * Shopify DRAFT order: the operator sends the 請求書/invoice from Shopify
 * admin and marks it paid on bank transfer — there is no payment gateway.
 *
 * Class pricing: Shopify stores only the base (standard ×1.0) variant price.
 * The computed class price (base × multiplier, e.g. plus ×1.1) is stamped on
 * each line via `priceOverride`, so the draft order / invoice totals are
 * correct for the buyer's class while the catalog keeps a single price.
 * NEVER create these lines without the override — a manual draft order in
 * admin would silently bill a plus buyer at 100% (see ops runbook, OT-24).
 */

export type DraftOrderLine = {
  variantId: string; // gid://shopify/ProductVariant/...
  quantity: number;
  unitPrice: number; // computed class price, shop currency
  engraving: boolean;
  /** Per-line ship note shown in admin/invoice (Japanese — processors are JA). */
  shipNote: string;
};

export type DraftOrderResult = {
  id: string;
  name: string; // order name (e.g. "#1001") or draft name ("#D12") if completion failed
};

const MUTATION = `
  mutation CreateDraftOrder($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder { id name }
      userErrors { field message }
    }
  }
`;

// Completing with paymentPending moves the order into the main Orders list
// (financial status "Payment pending") so staff work one list; it's marked
// paid in admin when the bank transfer arrives.
const COMPLETE = `
  mutation CompleteDraftOrder($id: ID!) {
    draftOrderComplete(id: $id, paymentPending: true) {
      draftOrder { id name order { id name } }
      userErrors { field message }
    }
  }
`;

export async function createDraftOrder(opts: {
  email: string;
  company: string;
  customerClass: CustomerClass;
  currency: string;
  lines: DraftOrderLine[];
  /** Order-level expected-shipping summary, e.g. "2026-08-04 (~30 days)". */
  expectedShipping: string;
  locale: string;
}): Promise<DraftOrderResult> {
  // Note + line attributes are Japanese-first: the order processors (and the
  // 請求書 recipients) are Japanese.
  const note =
    `ストアフロントB2B注文 — ${opts.company}（${opts.customerClass}）\n` +
    `購入者メール: ${opts.email}\n` +
    `支払い: 銀行振込（請求書を送付。オンライン決済なし）\n` +
    `出荷予定: ${opts.expectedShipping}\n` +
    `言語: ${opts.locale}`;

  const input = {
    email: opts.email,
    tags: ["storefront", `class:${opts.customerClass}`],
    note,
    lineItems: opts.lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      // Stamp the class-computed unit price (see module docblock).
      priceOverride: { amount: String(l.unitPrice), currencyCode: opts.currency },
      customAttributes: [
        { key: "刻印", value: l.engraving ? "あり" : "なし" },
        { key: "出荷予定", value: l.shipNote },
      ],
    })),
  };

  let result = await tryCreate(input);
  if (result.emailRejected) {
    // Shopify validates email domains (demo/test accounts may use fake ones).
    // The order matters more than the email field — retry without it; the
    // buyer email is already in the note for the operator.
    const { email: _drop, ...withoutEmail } = input;
    result = await tryCreate(withoutEmail);
  }
  if (result.error || !result.draftOrder) {
    throw new Error("Draft order rejected: " + (result.error ?? "unknown error"));
  }

  // Complete → real order, "Payment pending". If completion fails the draft
  // still exists, so don't fail checkout — staff can complete it in admin.
  try {
    const c = await shopifyMutate<{
      draftOrderComplete: {
        draftOrder: { order: { id: string; name: string } | null } | null;
        userErrors: { field: string[] | null; message: string }[];
      };
    }>(COMPLETE, { id: result.draftOrder.id });
    const order = c.draftOrderComplete.draftOrder?.order;
    if (c.draftOrderComplete.userErrors.length || !order) {
      console.error(
        "orders: draftOrderComplete failed, order left as draft:",
        c.draftOrderComplete.userErrors[0]?.message,
      );
      return result.draftOrder;
    }
    return { id: order.id, name: order.name };
  } catch (e) {
    console.error("orders: draftOrderComplete threw, order left as draft:", e);
    return result.draftOrder;
  }
}

async function tryCreate(input: Record<string, unknown>): Promise<{
  draftOrder: DraftOrderResult | null;
  error: string | null;
  emailRejected: boolean;
}> {
  const d = await shopifyMutate<{
    draftOrderCreate: {
      draftOrder: { id: string; name: string } | null;
      userErrors: { field: string[] | null; message: string }[];
    };
  }>(MUTATION, { input });
  const { draftOrder, userErrors } = d.draftOrderCreate;
  const first = userErrors[0];
  return {
    draftOrder,
    error: first?.message ?? null,
    emailRejected:
      !draftOrder &&
      userErrors.some(
        (e) => e.field?.includes("email") || /email/i.test(e.message),
      ),
  };
}
