import { CUSTOMER_CLASSES, type CustomerClass } from "./customer";
import type { Locale } from "./i18n-config";

/**
 * Trade-account FALLBACK. Shopify is the source of truth for real customers
 * (segment-gated — see `resolveTradeAccount` in ./shopify); this allowlist is the
 * fallback used for local dev, the public preview, and emergency access when
 * Shopify can't be reached. A few seeded demo accounts plus any extras via
 * TRADE_ALLOWLIST env ("email|class|Company", comma-separated). Env wins over demos.
 */

export type Account = {
  email: string;
  customerClass: CustomerClass;
  company: string;
  /** Preferred email language (Shopify `customer.locale`); undefined for
   *  allowlist/demo accounts → caller falls back to the site locale. */
  locale?: Locale;
};

const SEEDED: Account[] = [
  { email: "buyer@example-standard.com", customerClass: "standard", company: "Standard Trade Co." },
  { email: "buyer@example-plus.com", customerClass: "plus", company: "Plus Apparel Ltd." },
];

function fromEnv(): Account[] {
  const raw = process.env.TRADE_ALLOWLIST;
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry): Account | null => {
      const [email, cls, company] = entry.split("|").map((x) => x?.trim() ?? "");
      if (!email || !(CUSTOMER_CLASSES as readonly string[]).includes(cls)) return null;
      return { email, customerClass: cls as CustomerClass, company: company || email };
    })
    .filter((a): a is Account => a !== null);
}

export function lookupAccount(email: string): Account | undefined {
  const norm = email.trim().toLowerCase();
  return [...fromEnv(), ...SEEDED].find((a) => a.email.toLowerCase() === norm);
}
