import "server-only";
import type { Locale } from "./i18n-config";
import { shopifyMutate } from "./shopify";

/**
 * Newsletter subscribers live in Shopify as customers with e-mail marketing
 * consent SUBSCRIBED and the `newsletter` tag, so the list is managed (and
 * mailed) from the Shopify admin. A subscriber gets no trade access: access is
 * gated on the `hbw.pricing_segment` metafield, which this never sets.
 *
 * An existing customer (e.g. a trade buyer) keeps their record; only their
 * marketing consent and tag are updated.
 */

const FIND = `
  query NewsletterFind($q: String!) {
    customers(first: 5, query: $q) { nodes { id email } }
  }`;

const CREATE = `
  mutation NewsletterCreate($input: CustomerInput!) {
    customerCreate(input: $input) { userErrors { field message } }
  }`;

const CONSENT = `
  mutation NewsletterConsent($input: CustomerEmailMarketingConsentUpdateInput!) {
    customerEmailMarketingConsentUpdate(input: $input) { userErrors { field message } }
  }`;

const TAG = `
  mutation NewsletterTag($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) { userErrors { field message } }
  }`;

type UserErrors = { userErrors: { field: string[] | null; message: string }[] };

function check(op: string, r: UserErrors) {
  if (r.userErrors.length) {
    throw new Error(`${op}: ${r.userErrors.map((e) => e.message).join("; ")}`);
  }
}

export async function subscribeNewsletter(email: string, locale: Locale): Promise<void> {
  const norm = email.trim().toLowerCase();
  if (!process.env.SHOPIFY_STORE_DOMAIN || !process.env.SHOPIFY_ADMIN_TOKEN) {
    // Local dev / no-creds preview: same console fallback as email.ts.
    console.log(`📰 [newsletter console fallback] subscribe ${norm} (${locale})`);
    return;
  }

  const emailMarketingConsent = {
    marketingState: "SUBSCRIBED",
    marketingOptInLevel: "SINGLE_OPT_IN",
    consentUpdatedAt: new Date().toISOString(),
  };

  const found = await shopifyMutate<{ customers: { nodes: { id: string; email: string | null }[] } }>(
    FIND,
    { q: `email:${norm}` },
  );
  // Shopify's search tokenises, so re-check the address exactly.
  const existing = found.customers.nodes.find((n) => n.email?.trim().toLowerCase() === norm);

  if (!existing) {
    const r = await shopifyMutate<{ customerCreate: UserErrors }>(CREATE, {
      input: { email: norm, locale, tags: ["newsletter"], emailMarketingConsent },
    });
    check("customerCreate", r.customerCreate);
    return;
  }

  const c = await shopifyMutate<{ customerEmailMarketingConsentUpdate: UserErrors }>(CONSENT, {
    input: { customerId: existing.id, emailMarketingConsent },
  });
  check("customerEmailMarketingConsentUpdate", c.customerEmailMarketingConsentUpdate);
  const t = await shopifyMutate<{ tagsAdd: UserErrors }>(TAG, {
    id: existing.id,
    tags: ["newsletter"],
  });
  check("tagsAdd", t.tagsAdd);
}
