/**
 * Customer classes (B2B pricing segments).
 *
 *   standard  ×1.00   base price
 *   plus5     ×1.05   +5%
 *   plus10    ×1.10   +10%
 *
 * Names encode the RATE, not a rank ("plus" gave no room for a second tier —
 * added 2026-09-04). The multiplier lives here rather than in Shopify so a rate
 * change is one line, not a migration across every customer record; the
 * `hbw.pricing_segment` metafield stores only these stable keys.
 *
 * Plain module (no deps) so both Edge (session) and Node code can import it.
 */
export const CUSTOMER_CLASSES = ["standard", "plus5", "plus10"] as const;
export type CustomerClass = (typeof CUSTOMER_CLASSES)[number];

export const CLASS_MULTIPLIER: Record<CustomerClass, number> = {
  standard: 1.0,
  plus5: 1.05,
  plus10: 1.1,
};

export function isCustomerClass(v: string | undefined | null): v is CustomerClass {
  return !!v && (CUSTOMER_CLASSES as readonly string[]).includes(v);
}
