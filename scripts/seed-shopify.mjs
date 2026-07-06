/**
 * Seed the HBW Shopify dev store with a small representative catalog to build
 * the headless integration against. Idempotent by handle (skips if it exists).
 *
 * Run:  set -a; source .env.local; set +a; node scripts/seed-shopify.mjs
 *
 * Model: design = Product; productType = category (Military/Classic/Work);
 * options Color (value carries the species) × Size (mm); variant.price = base
 * price per (color × size) in JPY; product metafields hbw.name_ja/short_ja/
 * lead_time_days; variant metafield hbw.in_stock drives the expected-ship date.
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
const bad = (errs) => errs && errs.length && Object.assign(new Error(JSON.stringify(errs)), { errs });

const IMG = "https://hammondbuttonworks.vercel.app/images/products";
const PRODUCTS = [
  {
    title: "No.9 Round", handle: "round-no9", productType: "Classic",
    descriptionHtml: "<p>Turned round button in natural hardwood, left uncoated so the grain shows. Made to order in any size.</p>",
    image: `${IMG}/wood-rw-01.jpg`,
    nameJa: "No.9 ラウンド",
    shortJa: "天然広葉樹の丸ボタン。無塗装で木目を活かした仕上げ。",
    leadTimeDays: 45,
    colors: ["Brown (Rosewood)", "Beige (Mango)"],
    sizes: ["18mm", "20mm", "25mm"],
    price: (_c, s) => ({ "18mm": 240, "20mm": 340, "25mm": 480 }[s]),
    inStock: (_c, s) => s !== "25mm",
  },
  {
    title: "Crest", handle: "crest", productType: "Military",
    descriptionHtml: "<p>Die-struck metal crest button with a relief face. Antique or blackened brass. Nickel-free plating on request.</p>",
    image: `${IMG}/metal-rm-012.jpg`,
    nameJa: "クレスト",
    shortJa: "立体的なレリーフ面の打刻メタルボタン。アンティーク／黒染め真鍮。",
    leadTimeDays: 50,
    colors: ["Antique Brass", "Blackened Brass"],
    sizes: ["18mm", "23mm"],
    price: (c, s) => ({ "18mm": 520, "23mm": 600 }[s]) + (c.startsWith("Blackened") ? 20 : 0),
    inStock: () => false,
  },
  {
    title: "Work 4-Hole", handle: "work-4hole", productType: "Work",
    descriptionHtml: "<p>Compact four-hole hardwood button with a raised rim. Natural, uncoated. Made to order.</p>",
    image: `${IMG}/wood-rw-03.jpg`,
    nameJa: "ワーク 4つ穴",
    shortJa: "立ち上がったリムのコンパクトな4つ穴ウッドボタン。無塗装。",
    leadTimeDays: 40,
    colors: ["Brown (Rosewood)", "Beige (Mango)"],
    sizes: ["13mm", "15mm", "18mm"],
    price: (c, s) => ({ "13mm": 240, "15mm": 270, "18mm": 300 }[s]) - (c.startsWith("Beige") ? 15 : 0),
    inStock: (c, s) => s === "15mm",
  },
];

async function existing(handle) {
  const d = await gql(`query($q:String!){ products(first:1, query:$q){ nodes{ id handle } } }`, { q: `handle:${handle}` });
  return d.products.nodes[0]?.id ?? null;
}

async function seedOne(p) {
  const existingId = await existing(p.handle);
  if (existingId) {
    await gql(
      `mutation($input: ProductDeleteInput!){ productDelete(input:$input){ deletedProductId userErrors{ message } } }`,
      { input: { id: existingId } },
    );
    console.log(`~ replaced ${p.handle}`);
  }
  // 1) product + options + product metafields
  const created = await gql(
    `mutation($input: ProductCreateInput!){
       productCreate(product:$input){ product{ id } userErrors{ field message } } }`,
    {
      input: {
        title: p.title, handle: p.handle, productType: p.productType,
        descriptionHtml: p.descriptionHtml, status: "ACTIVE",
        productOptions: [
          { name: "Color", values: p.colors.map((name) => ({ name })) },
          { name: "Size", values: p.sizes.map((name) => ({ name })) },
        ],
        metafields: [
          { namespace: "hbw", key: "name_ja", type: "single_line_text_field", value: p.nameJa },
          { namespace: "hbw", key: "short_ja", type: "multi_line_text_field", value: p.shortJa },
          { namespace: "hbw", key: "lead_time_days", type: "number_integer", value: String(p.leadTimeDays) },
        ],
      },
    },
  );
  const errs = created.productCreate.userErrors;
  if (errs.length) throw bad(errs);
  const productId = created.productCreate.product.id;

  // 2) all color × size variants (removes the default standalone variant)
  const variants = [];
  for (const c of p.colors)
    for (const s of p.sizes)
      variants.push({
        optionValues: [{ optionName: "Color", name: c }, { optionName: "Size", name: s }],
        price: String(p.price(c, s)),
        inventoryItem: { sku: `${p.handle}-${c.replace(/\W+/g, "")}-${s}` },
        metafields: [{ namespace: "hbw", key: "in_stock", type: "boolean", value: String(!!p.inStock(c, s)) }],
      });
  const bulk = await gql(
    `mutation($productId:ID!, $variants:[ProductVariantsBulkInput!]!){
       productVariantsBulkCreate(productId:$productId, variants:$variants, strategy: REMOVE_STANDALONE_VARIANT){
         productVariants{ id } userErrors{ field message } } }`,
    { productId, variants },
  );
  if (bulk.productVariantsBulkCreate.userErrors.length) throw bad(bulk.productVariantsBulkCreate.userErrors);

  // 3) product image (fetched from the live site by URL)
  const media = await gql(
    `mutation($productId:ID!, $media:[CreateMediaInput!]!){
       productCreateMedia(productId:$productId, media:$media){ mediaUserErrors{ field message } } }`,
    { productId, media: [{ originalSource: p.image, mediaContentType: "IMAGE", alt: p.title }] },
  );
  if (media.productCreateMedia.mediaUserErrors.length) throw bad(media.productCreateMedia.mediaUserErrors);

  console.log(`+ created ${p.handle}  (${variants.length} variants)`);
}

for (const p of PRODUCTS) await seedOne(p);
console.log("\nSeed complete.");
