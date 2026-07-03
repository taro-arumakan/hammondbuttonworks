import { CUSTOMER_CLASSES, type CustomerClass } from "./customer";

/**
 * Approved trade accounts. No customer database in the storefront — access is
 * governed by this allowlist (Shopify holds the real customer records). A few
 * seeded demo accounts plus any extras via TRADE_ALLOWLIST env
 * ("email|class|Company", comma-separated). Env entries win over the demos.
 */

export type Account = {
  email: string;
  customerClass: CustomerClass;
  company: string;
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
