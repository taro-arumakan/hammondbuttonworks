/**
 * Price formatting, safe for BOTH server and client bundles (unlike
 * `pricing.ts`, which is server-only because it holds the resolver). A price
 * that reaches the client via the gated APIs is the buyer's own — formatting
 * it here leaks nothing. ja-JP narrow-symbol style, matching the JPY-first
 * shop (¥1,234; two decimals for non-JPY).
 */
export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(amount);
}
