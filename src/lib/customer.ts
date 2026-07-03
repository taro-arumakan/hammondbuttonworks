/**
 * Customer classes (B2B). Two levels: `standard` pays the base price (×1.0),
 * `plus` pays +10% (×1.1). This replaces the old 3-tier quantity-break model.
 * Plain module (no deps) so both Edge (session) and Node code can import it.
 */
export const CUSTOMER_CLASSES = ["standard", "plus"] as const;
export type CustomerClass = (typeof CUSTOMER_CLASSES)[number];

export const CLASS_MULTIPLIER: Record<CustomerClass, number> = {
  standard: 1.0,
  plus: 1.1,
};

export function isCustomerClass(v: string | undefined | null): v is CustomerClass {
  return !!v && (CUSTOMER_CLASSES as readonly string[]).includes(v);
}
