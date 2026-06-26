import { TIERS, type Tier } from "./schema";

/**
 * Approved trade accounts. There is no customer database in the pilot — access
 * is governed by this allowlist: a few seeded demo accounts plus any extras
 * supplied via the TRADE_ALLOWLIST env var ("email|tier|Company", comma-sep).
 * Env entries take precedence over the seeded demos.
 */

export type Account = {
  email: string;
  tier: Tier;
  company: string;
};

const SEEDED: Account[] = [
  { email: "buyer@example-standard.com", tier: "tier_standard", company: "Standard Trade Co." },
  { email: "buyer@example-volume.com", tier: "tier_volume", company: "Volume Apparel Ltd." },
  { email: "buyer@example-partner.com", tier: "tier_partner", company: "Partner Mills & Co." },
];

function fromEnv(): Account[] {
  const raw = process.env.TRADE_ALLOWLIST;
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry): Account | null => {
      const [email, tier, company] = entry.split("|").map((x) => x?.trim() ?? "");
      if (!email || !(TIERS as readonly string[]).includes(tier)) return null;
      return { email, tier: tier as Tier, company: company || email };
    })
    .filter((a): a is Account => a !== null);
}

export function lookupAccount(email: string): Account | undefined {
  const norm = email.trim().toLowerCase();
  // Env first so an operator can override a seeded demo by email.
  return [...fromEnv(), ...SEEDED].find((a) => a.email.toLowerCase() === norm);
}
