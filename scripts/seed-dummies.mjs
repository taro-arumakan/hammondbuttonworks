/**
 * Seed 20 DUMMY products (tagged "dummy") into the HBW dev store to simulate
 * the catalog look & feel at volume — 5 categories × 5 colors × varied sizes,
 * photos cycled from the existing product shots. Idempotent by handle
 * (delete + recreate). Remove them all later with:
 *
 *   query { products(query: "tag:dummy") } → productDelete each
 *
 * Run:  set -a; source .env.local; set +a; node scripts/seed-dummies.mjs
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
const IMAGES = [
  "wood-rw-01.jpg", "wood-rw-03.jpg", "metal-rm-012.jpg",
  "metal-rm-013.jpg", "buffalo-rbc-01.jpg", "buffalo-rbw-01.jpg",
];
const COLORS = ["Black", "White", "Brown", "Metal", "Blue"];
const SIZES = ["11.5mm", "13.5mm", "15mm", "18mm", "20mm", "23mm", "25mm", "28mm", "30mm"];

const CATEGORY_SHORT_JA = {
  Classic: "定番シルエットのクラシックボタン。無塗装の自然な仕上げ。",
  Military: "ミリタリーディテールのボタン。堅牢な作りと落ち着いた表情。",
  Work: "ワークウェア向けの実用的なボタン。日常使いに耐える仕上げ。",
  Craft: "手仕事の質感を活かしたクラフトボタン。一点ごとに表情が異なります。",
  Design: "デザイン性を重視したオリジナルボタン。企画・別注のベースに。",
};

// [EN name, JA name, category]
const DUMMIES = [
  ["No.3 Dome", "No.3 ドーム", "Classic"],
  ["No.14 Rim", "No.14 リム", "Classic"],
  ["Fisheye", "フィッシュアイ", "Classic"],
  ["Wafer", "ウエハー", "Classic"],
  ["Anchor", "アンカー", "Military"],
  ["Eagle Shank", "イーグルシャンク", "Military"],
  ["Cadet", "カデット", "Military"],
  ["Star Punch", "スターパンチ", "Military"],
  ["Prairie 2-Hole", "プレーリー 2つ穴", "Work"],
  ["No.22 Flat", "No.22 フラット", "Work"],
  ["Duffle Toggle", "ダッフルトグル", "Work"],
  ["Oval 4-Hole", "オーバル 4つ穴", "Work"],
  ["Half Ball", "ハーフボール", "Craft"],
  ["Lattice", "ラティス", "Craft"],
  ["Bark", "バーク", "Craft"],
  ["Ridge", "リッジ", "Craft"],
  ["Signet", "シグネット", "Design"],
  ["Loop Shank", "ループシャンク", "Design"],
  ["Pebble", "ペブル", "Design"],
  ["Quill", "クイル", "Design"],
];

// Deterministic pseudo-random so re-runs produce the same catalog.
const rand = (seed) => () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

function buildProduct([title, nameJa, category], i) {
  const r = rand(i * 7919 + 17);
  const handle = "dummy-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const nColors = 1 + Math.floor(r() * 3); // 1–3 colors
  const colorStart = Math.floor(r() * COLORS.length);
  const colors = Array.from({ length: nColors }, (_, k) => COLORS[(colorStart + k) % COLORS.length]);
  const nSizes = 2 + Math.floor(r() * 3); // 2–4 sizes
  const sizeStart = Math.floor(r() * (SIZES.length - nSizes));
  const sizes = SIZES.slice(sizeStart, sizeStart + nSizes);
  const base = 180 + Math.floor(r() * 8) * 40; // ¥180–¥460
  const step = 40 + Math.floor(r() * 4) * 20; // per size-step increment
  const metalPremium = 60;
  const leadTimeDays = 30 + Math.floor(r() * 5) * 5; // 30–50
  const stockPattern = r(); // which portion of variants is in stock

  return {
    title, nameJa, handle,
    productType: category,
    descriptionHtml: `<p>${title} — dummy catalog entry for layout simulation. Handcrafted natural button, made to order in any size.</p>`,
    shortJa: CATEGORY_SHORT_JA[category],
    image: `${IMG}/${IMAGES[i % IMAGES.length]}`,
    leadTimeDays, colors, sizes,
    price: (c, s) => base + sizes.indexOf(s) * step + (c === "Metal" ? metalPremium : 0),
    inStock: (c, s) => (colors.indexOf(c) + sizes.indexOf(s)) % 3 < (stockPattern < 0.5 ? 1 : 2),
  };
}

async function seedOne(p) {
  const found = await gql(`query($q:String!){ products(first:1, query:$q){ nodes{ id } } }`, { q: `handle:${p.handle}` });
  const existingId = found.products.nodes[0]?.id ?? null;
  if (existingId) {
    await gql(
      `mutation($input: ProductDeleteInput!){ productDelete(input:$input){ deletedProductId userErrors{ message } } }`,
      { input: { id: existingId } },
    );
    console.log(`~ replaced ${p.handle}`);
  }
  const created = await gql(
    `mutation($input: ProductCreateInput!){
       productCreate(product:$input){ product{ id } userErrors{ field message } } }`,
    {
      input: {
        title: p.title, handle: p.handle, productType: p.productType,
        descriptionHtml: p.descriptionHtml, status: "ACTIVE",
        tags: ["dummy"],
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
  if (created.productCreate.userErrors.length) throw bad(created.productCreate.userErrors);
  const productId = created.productCreate.product.id;

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

  const media = await gql(
    `mutation($productId:ID!, $media:[CreateMediaInput!]!){
       productCreateMedia(productId:$productId, media:$media){ mediaUserErrors{ field message } } }`,
    { productId, media: [{ originalSource: p.image, mediaContentType: "IMAGE", alt: p.title }] },
  );
  if (media.productCreateMedia.mediaUserErrors.length) throw bad(media.productCreateMedia.mediaUserErrors);

  console.log(`+ ${p.handle}  [${p.productType}]  colors=${p.colors.join("/")}  sizes=${p.sizes.join("/")}`);
}

for (const [i, d] of DUMMIES.entries()) await seedOne(buildProduct(d, i));
console.log("\nDummy seed complete (20 products, tag: dummy).");
