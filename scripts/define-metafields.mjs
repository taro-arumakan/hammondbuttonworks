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
 * resolve customer-class pricing. Values are STABLE KEYS ("standard" | "plus5" |
 * "plus10") — the multiplier (×1.00 / ×1.05 / ×1.10) lives in code (src/lib/
 * customer.ts) so a rate change is one line, not a migration across customers.
 * The keys name the RATE, not a rank: "plus" alone left no room for a second
 * tier, which is exactly what happened.
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
      "B2B pricing class. standard = base (100%); plus5 = 105%; plus10 = 110%. " +
      "The storefront reads this to resolve customer-class pricing.",
    validations: [
      { name: "choices", value: JSON.stringify(["standard", "plus5", "plus10"]) },
    ],
    pin: true,
    // access omitted → Shopify applies the default (merchant read/write in admin,
    // editable on the customer page). The app isn't permitted to set it explicitly.
  },
  {
    name: "Material",
    namespace: "hbw",
    key: "material",
    ownerType: "PRODUCTVARIANT",
    // A LIST, not a single value: HBT-35-COMBI is metal at the centre with
    // buffalo around it, so a variant can legitimately be two materials. A
    // comma-separated string would have to drop the `choices` validation (since
    // "metal,buffalo" is not itself a choice), losing the admin dropdown and the
    // typo protection — and packing two attributes into one string is precisely
    // the mistake we just undid by taking the species out of "Brown (Rosewood)".
    // list.single_line_text_field keeps the validation AND renders as a
    // multi-select in admin.
    type: "list.single_line_text_field",
    description:
      "What the button is made of; pick several for mixed-material designs " +
      "(HBT-35-COMBI is metal + buffalo). Wood carries the species, which also " +
      "sets its colour: rosewood = dark brown, mango = beige, acacia = brown.",
    validations: [
      {
        name: "choices",
        value: JSON.stringify(["buffalo", "acacia", "rosewood", "mango", "metal"]),
      },
    ],
    pin: true,
  },
];

/**
 * Why material is a VARIANT metafield and not part of the colour option
 * ---------------------------------------------------------------------
 * The seed catalogue encoded the species inside the colour value
 * ("Brown (Rosewood)", SKU round-no9-BrownRosewood-18mm). That conflates two
 * independent attributes and makes colour filtering lie: a buyer filtering for
 * "brown" would miss "Brown (Rosewood)" unless every species variant is
 * enumerated in the filter list.
 *
 * It has to be per-VARIANT rather than per-product because material genuinely
 * varies within a single design: WBT-3586 is one product code offered in
 * rosewood (dark brown, 20mm), mango (beige, 20mm) and acacia (brown, 15mm).
 * A product-level field could not represent that without splitting the design
 * into three products.
 *
 * With the owner's rule — rosewood = dark brown, mango = beige, acacia = brown —
 * colour and material stay derivable from one another for wood, but they are
 * recorded separately so neither has to be parsed out of the other.
 */

const EXISTS = `
  query Exists($ownerType: MetafieldOwnerType!, $namespace: String!, $key: String!) {
    metafieldDefinitions(first: 1, ownerType: $ownerType, namespace: $namespace, key: $key) {
      nodes { id name type { name } pinnedPosition validations { name value } }
    }
  }`;

const UPDATE = `
  mutation Upd($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition { id key validations { name value } }
      userErrors { field message code }
    }
  }`;

const DELETE = `
  mutation Del($id: ID!) {
    metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: true) {
      deletedDefinitionId
      userErrors { field message code }
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
  const existing = found.metafieldDefinitions.nodes[0];
  if (existing && existing.type.name === def.type) {
    // Same type — but the choice list may have grown (a new pricing segment, a
    // new material). Validations ARE updatable in place, so reconcile them
    // rather than skipping; otherwise the store silently keeps the old dropdown.
    const norm = (v) =>
      JSON.stringify(
        (v ?? []).map(({ name, value }) => [name, value]).sort((a, b) => a[0].localeCompare(b[0])),
      );
    if (norm(existing.validations) === norm(def.validations)) {
      console.log(`✓ exists, skipping: ${label}`);
      continue;
    }
    const upd = await gql(UPDATE, {
      definition: {
        namespace: def.namespace,
        key: def.key,
        ownerType: def.ownerType,
        name: def.name,
        description: def.description,
        validations: def.validations,
      },
    });
    const uerrs = upd.metafieldDefinitionUpdate.userErrors;
    if (uerrs.length) {
      console.error(`✗ update failed: ${label}`, uerrs);
      process.exitCode = 1;
    } else {
      console.log(`↻ updated validations: ${label}`);
    }
    continue;
  }
  if (existing) {
    // Shopify cannot change a definition's type in place. Recreating DELETES the
    // stored values, so this never happens implicitly.
    if (!process.argv.includes("--recreate")) {
      console.error(
        `✗ ${label} exists as ${existing.type.name}, wanted ${def.type}.\n` +
          `  Re-run with --recreate to delete and rebuild it (DESTROYS stored values).`,
      );
      process.exitCode = 1;
      continue;
    }
    const del = await gql(DELETE, { id: existing.id });
    const derr = del.metafieldDefinitionDelete.userErrors;
    if (derr.length) {
      console.error(`✗ delete failed: ${label}`, derr);
      process.exitCode = 1;
      continue;
    }
    console.log(`− deleted ${label} (was ${existing.type.name})`);
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
