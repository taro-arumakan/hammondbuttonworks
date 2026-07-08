/**
 * Create HBW's app-owned metafield DEFINITIONS on the Shopify store.
 * Idempotent: skips a definition that already exists (namespace+key+ownerType).
 *
 * Run:  set -a; source .env.local; set +a; node scripts/define-metafields.mjs
 *
 * Why a definition (not just an ad-hoc value): a definition gives the field a
 * type + validation (a fixed choice list → a dropdown in admin, no typos) and,
 * with pin:true, surfaces it on the resource's admin page so staff can set it.
 *
 * hbw.pricing_segment (CUSTOMER): the B2B pricing class the storefront reads to
 * resolve customer-class pricing. Values are STABLE KEYS ("standard" | "plus"),
 * not percentages — the multiplier (×1.0 / ×1.1) lives in code (src/lib/
 * customer.ts) so a rate change is one line, not a migration across customers.
 */
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;
const VERSION = process.env.SHOPIFY_API_VERSION || "2025-07";
if (!DOMAIN || !TOKEN) throw new Error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN");
const ENDPOINT = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const r = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "X-Shopify-Access-Token": TOKEN, "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const j = await r.json();
  if (j.errors) throw new Error("GraphQL: " + JSON.stringify(j.errors));
  return j.data;
}

/** Definitions to ensure. Add more here over time. */
const DEFINITIONS = [
  {
    name: "Pricing segment",
    namespace: "hbw",
    key: "pricing_segment",
    ownerType: "CUSTOMER",
    type: "single_line_text_field",
    description:
      "B2B pricing class. standard = base price (100%); plus = +10% (110%). " +
      "The storefront reads this to resolve customer-class pricing.",
    validations: [{ name: "choices", value: JSON.stringify(["standard", "plus"]) }],
    pin: true,
    // access omitted → Shopify applies the default (merchant read/write in admin,
    // editable on the customer page). The app isn't permitted to set it explicitly.
  },
];

const EXISTS = `
  query Exists($ownerType: MetafieldOwnerType!, $namespace: String!, $key: String!) {
    metafieldDefinitions(first: 1, ownerType: $ownerType, namespace: $namespace, key: $key) {
      nodes { id name pinnedPosition validations { name value } }
    }
  }`;

const CREATE = `
  mutation Create($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id name namespace key type { name } }
      userErrors { field message code }
    }
  }`;

for (const def of DEFINITIONS) {
  const label = `${def.namespace}.${def.key} (${def.ownerType})`;
  const found = await gql(EXISTS, {
    ownerType: def.ownerType,
    namespace: def.namespace,
    key: def.key,
  });
  if (found.metafieldDefinitions.nodes.length) {
    console.log(`✓ exists, skipping: ${label}`);
    continue;
  }
  const res = await gql(CREATE, { definition: def });
  const errs = res.metafieldDefinitionCreate.userErrors;
  if (errs.length) {
    console.error(`✗ failed: ${label}`);
    for (const e of errs) console.error(`    [${e.code}] ${e.field?.join(".") ?? ""} ${e.message}`);
    process.exitCode = 1;
    continue;
  }
  const c = res.metafieldDefinitionCreate.createdDefinition;
  console.log(`＋ created: ${c.namespace}.${c.key} — "${c.name}" (${c.type.name})`);
}
