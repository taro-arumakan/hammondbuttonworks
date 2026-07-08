import "server-only";
import { isCustomerClass } from "./customer";
import { lookupAccount, type Account } from "./allowlist";

/**
 * Shopify Admin GraphQL client + product reader (headless backend).
 *
 * Server-only: uses the Admin API token, and prices must never reach the guest
 * bundle. The storefront reads the catalog through here instead of hard-coded
 * JSON. Returns a clean view-model (`ShopifyProduct`) that the pages consume.
 *
 * Data model in Shopify (see scripts/seed-shopify.mjs):
 *  - design = Product; `productType` = category (Military/Classic/Work)
 *  - options: Color (value carries the species, e.g. "Brown (Rosewood)") × Size ("15mm")
 *  - variant.price = base price per (color × size), in the shop currency (JPY)
 *  - metafields hbw.{name_ja, short_ja, lead_time_days}; variant hbw.in_stock
 */

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-07";

function endpoint(): string {
  if (!DOMAIN || !TOKEN) {
    throw new Error("SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN must be set");
  }
  return `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`;
}

export async function shopifyFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "X-Shopify-Access-Token": TOKEN as string, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    // Product data is fairly static; cache briefly and revalidate.
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: unknown };
  if (json.errors) throw new Error("Shopify GraphQL: " + JSON.stringify(json.errors));
  return json.data as T;
}

/** Like shopifyFetch, but never cached — for mutations (orders must not replay). */
export async function shopifyMutate<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "X-Shopify-Access-Token": TOKEN as string, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Shopify HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message?: string }[] };
  if (json.errors) {
    throw new Error("Shopify GraphQL: " + (json.errors[0]?.message ?? JSON.stringify(json.errors)));
  }
  return json.data as T;
}

// --- Trade account resolution (login) ----------------------------------------

type CustomerNode = {
  email: string | null;
  displayName: string | null;
  defaultAddress: { company: string | null } | null;
  segment: { value: string | null } | null;
};

const CUSTOMER_BY_EMAIL = `
  query CustomerByEmail($q: String!) {
    customers(first: 5, query: $q) {
      nodes {
        email
        displayName
        defaultAddress { company }
        segment: metafield(namespace: "hbw", key: "pricing_segment") { value }
      }
    }
  }`;

/**
 * Resolve a trade account from Shopify by email — the source of truth for real
 * customers. Access is SEGMENT-GATED: an account is returned only when a matching
 * customer has `hbw.pricing_segment` set to a valid class (standard | plus).
 * Missing customer, or missing/invalid segment → null ("not yet onboarded").
 * Setting the segment in the Shopify admin is the whole onboarding step.
 *
 * Shopify's `customers` search tokenises, so we re-check the email exactly. Any
 * error (network, scope) → null so the caller can fall back to the allowlist.
 */
export async function resolveCustomerAccount(email: string): Promise<Account | null> {
  const norm = email.trim().toLowerCase();
  if (!norm) return null;
  let data: { customers: { nodes: CustomerNode[] } };
  try {
    // no-store: reflect the current admin state at sign-in, not a cached segment.
    data = await shopifyMutate(CUSTOMER_BY_EMAIL, { q: `email:${norm}` });
  } catch {
    return null;
  }
  const node = data.customers.nodes.find((n) => n.email?.trim().toLowerCase() === norm);
  if (!node) return null;
  const seg = node.segment?.value ?? null;
  if (!isCustomerClass(seg)) return null; // segment unset/invalid → no access
  const company =
    node.defaultAddress?.company?.trim() || node.displayName?.trim() || node.email || norm;
  return { email: node.email ?? norm, customerClass: seg, company };
}

/**
 * Trade-account gate used by login + magic-link verify. Shopify is authoritative
 * (segment-gated); the env/seeded allowlist is a fallback for local dev, the
 * public preview, and emergency grants when Shopify can't be reached.
 */
export async function resolveTradeAccount(email: string): Promise<Account | null> {
  return (await resolveCustomerAccount(email)) ?? lookupAccount(email) ?? null;
}

// --- View model --------------------------------------------------------------
export type ShopifyVariant = {
  id: string;
  sku: string;
  color: string; // option value, e.g. "Brown (Rosewood)"
  sizeMm: number;
  basePrice: number; // shop currency (JPY), before customer-class multiplier
  inStock: boolean;
};

export type ShopifyProduct = {
  id: string;
  slug: string; // Shopify handle
  name: string;
  nameJa?: string;
  shortJa?: string;
  category: string; // productType
  createdAt: string; // ISO timestamp, for "newest" sorting
  descriptionHtml: string;
  image?: string;
  images: string[];
  leadTimeDays: number;
  colors: string[];
  sizesMm: number[];
  currency: string;
  variants: ShopifyVariant[];
};

// --- Queries -----------------------------------------------------------------
let currencyCache: string | null = null;
export async function shopCurrency(): Promise<string> {
  if (currencyCache) return currencyCache;
  const d = await shopifyFetch<{ shop: { currencyCode: string } }>(
    `{ shop { currencyCode } }`,
  );
  currencyCache = d.shop.currencyCode;
  return currencyCache;
}

const PRODUCT_FIELDS = `
  id
  handle
  title
  productType
  createdAt
  descriptionHtml
  featuredMedia { preview { image { url } } }
  media(first: 12) { nodes { preview { image { url } } } }
  nameJa: metafield(namespace: "hbw", key: "name_ja") { value }
  shortJa: metafield(namespace: "hbw", key: "short_ja") { value }
  lead: metafield(namespace: "hbw", key: "lead_time_days") { value }
  options { name optionValues { name } }
  variants(first: 100) {
    nodes {
      id
      sku
      price
      selectedOptions { name value }
      inStock: metafield(namespace: "hbw", key: "in_stock") { value }
    }
  }
`;

type RawVariant = {
  id: string;
  sku: string | null;
  price: string;
  selectedOptions: { name: string; value: string }[];
  inStock: { value: string } | null;
};
type RawProduct = {
  id: string;
  handle: string;
  title: string;
  productType: string;
  createdAt: string;
  descriptionHtml: string;
  featuredMedia: { preview: { image: { url: string } | null } | null } | null;
  media: { nodes: { preview: { image: { url: string } | null } | null }[] };
  nameJa: { value: string } | null;
  shortJa: { value: string } | null;
  lead: { value: string } | null;
  options: { name: string; optionValues: { name: string }[] }[];
  variants: { nodes: RawVariant[] };
};

function sizeToMm(size: string): number {
  return parseFloat(String(size).replace(/[^\d.]/g, "")) || 0;
}

function mapProduct(p: RawProduct, currency: string): ShopifyProduct {
  const colorOpt = p.options.find((o) => o.name.toLowerCase() === "color");
  const sizeOpt = p.options.find((o) => o.name.toLowerCase() === "size");
  const images = p.media.nodes.map((n) => n.preview?.image?.url).filter((u): u is string => !!u);
  const image = p.featuredMedia?.preview?.image?.url ?? images[0];

  const variants: ShopifyVariant[] = p.variants.nodes.map((v) => {
    const color = v.selectedOptions.find((o) => o.name.toLowerCase() === "color")?.value ?? "";
    const size = v.selectedOptions.find((o) => o.name.toLowerCase() === "size")?.value ?? "";
    return {
      id: v.id,
      sku: v.sku ?? "",
      color,
      sizeMm: sizeToMm(size),
      basePrice: Number(v.price),
      inStock: v.inStock?.value === "true",
    };
  });

  return {
    id: p.id,
    slug: p.handle,
    name: p.title,
    nameJa: p.nameJa?.value,
    shortJa: p.shortJa?.value,
    category: p.productType,
    createdAt: p.createdAt,
    descriptionHtml: p.descriptionHtml,
    image,
    images,
    leadTimeDays: p.lead ? Number(p.lead.value) : 30,
    colors: colorOpt?.optionValues.map((v) => v.name) ?? [],
    sizesMm: (sizeOpt?.optionValues.map((v) => sizeToMm(v.name)) ?? []).sort((a, b) => a - b),
    currency,
    variants,
  };
}

export async function getShopifyProducts(): Promise<ShopifyProduct[]> {
  const currency = await shopCurrency();
  const out: ShopifyProduct[] = [];
  let cursor: string | null = null;
  // Paginate so this scales to the full ~200-design catalog.
  do {
    const d: { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: RawProduct[] } } =
      await shopifyFetch(
        `query($cursor: String) {
           products(first: 50, after: $cursor, sortKey: TITLE, query: "status:active") {
             pageInfo { hasNextPage endCursor }
             nodes { ${PRODUCT_FIELDS} }
           }
         }`,
        { cursor },
      );
    out.push(...d.products.nodes.map((p) => mapProduct(p, currency)));
    cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null;
  } while (cursor);
  return out;
}

export async function getShopifyProductByHandle(handle: string): Promise<ShopifyProduct | null> {
  const currency = await shopCurrency();
  const d = await shopifyFetch<{ productByHandle: RawProduct | null }>(
    `query($handle: String!) { productByHandle(handle: $handle) { ${PRODUCT_FIELDS} } }`,
    { handle },
  );
  return d.productByHandle ? mapProduct(d.productByHandle, currency) : null;
}
