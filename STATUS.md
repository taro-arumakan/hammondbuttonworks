# STATUS — read this first

_Last updated 2026-10-04._

This file is the entry point for a session that has no memory of previous ones. It says where
the project is, what is blocked on whom, and which traps have already cost someone a session.
It points at the detailed docs rather than repeating them, so when they disagree, **the
detailed doc wins and this file is stale** — fix it.

Read order for a fresh session: this file, then [GO-LIVE.md](GO-LIVE.md) §5b and §5c, then
the `README.md` in the tooling repo named below.

---

## Where the project is

The storefront is **live** at https://hammondbutton.works and contains **no real products** —
the 23 products in Shopify are seeded placeholders. The current job is registering the real
catalogue: **45 product codes, 60 priced colourways, 292 priced variants.**

An importer for that exists and has been reviewed hard. What is holding up a first real import
is **owner-supplied prose, not code.**

## The two repos

| Repo | Path | What it is |
|---|---|---|
| Storefront | `/Users/taro/sc/hammondbuttonworks` | This repo. Public, Next.js 15. Pushes to `main` auto-deploy to Vercel. |
| HBW tooling | `/Users/taro/sc/hammondbuttonworks-tooling` | **PRIVATE, Python.** Holds the product importer and the product master. Not discoverable from here. |
| Shopify client library | `/Users/taro/sc/shopify_product_management` | ⚠️ **PUBLIC.** A shared, multi-brand Shopify/Google client. The tooling repo consumes it as an editable uv path dependency. |

⚠️ **Never put HBW pricing in `shopify_product_management` — it is a public repo.** The
importer's README and ~90 of its test fixtures quote the real wholesale ladders, which is why
it lives in the private tooling repo instead. It was never committed to SPM, so nothing has
leaked. The dependency runs **private → public**, which is the safe direction; the reverse
would break for anyone without access. Both repos must be checked out under the same parent
directory for the path dependency to resolve — it is declared relative, as
`../shopify_product_management`.

⚠️ **Two prerequisites a fresh machine will hit.** First, SPM needs a `[build-system]` block in
its `pyproject.toml` for the path dependency to build at all; if that is not yet committed
upstream, `uv sync` fails. Second, set **`HBW_STOREFRONT`** if this repo is not at
`/Users/taro/sc/hammondbuttonworks` — the tooling's drift guards and default photo tree resolve
through it, and they fail loudly rather than skipping. The full test suite also needs the photo
tree `20260904_product_images`, which is gitignored here and so exists only on a machine that
has the shoot; without it exactly one test fails.

The importer is the `hbw/` package in the tooling repo: `import_products.py`,
`price_sheet.py`, `images.py`, `overrides.py`, `client.py`, `overrides.csv`.
**Read that repo's `README.md` before touching it.** Its tests are in its own `tests/` and run
in about 2 seconds: **673 passing**. It touches SPM through three surfaces —
`helpers.shopify_graphql_client.client`, `helpers.google_api_interface.interface` and
`utils.credentials` — plus one transitive reach, since SPM's `utils.py` imports
`brands.client.brandclientbase` at module top level. It carries its **own `.env`**
(see `.env.example`), because `utils.credentials` calls `load_dotenv()` with no path and so
searches upward from the working directory.

```bash
cd /Users/taro/sc/hammondbuttonworks-tooling && uv run python -m hbw.import_products
```

Dry run is the default. `--commit` is required to write anything, and products are created
`DRAFT`.

## The three data masters

There is no single product master. There are three, each the master of a different thing.

| Source | Master of | Key |
|---|---|---|
| Google Sheet `HBWPriceList` ([id](https://docs.google.com/spreadsheets/d/1RveEGNAq9ohcmJ1iOG9mKgVs0CuXsGWYjizBPZK9cdw/edit)) | **variants** | code × colour × material × size → price |
| `20260904_product_images/manifest.csv` (gitignored) | **images** | code × colour × size × angle → frame |
| `hbw/overrides.csv` in the tooling repo | **products** | code → design-level attributes |

The product master has a staff-facing twin: **[HBWProductMaster](https://docs.google.com/spreadsheets/d/1pFsOHSC0tf7ccNqPEs-PE1AjRlLvtM9rd38HayUSPQo/edit)**, a Google Sheet with
the same eight columns, each column's guidance in the row under its own header, and all 45 code
rows. Rows beginning with `#` are ignored by the importer, so the sheet exports straight back
to `overrides.csv` with no reformatting. ⚠️ It is a **separate copy**: nothing syncs
automatically yet, so after staff fill it in, export it and replace `hbw/overrides.csv`.

`overrides.csv` columns, as of 2026-10-04:
`code, description_html, description_ja, lead_time_days, construction, category, tags,
materials_extra`. There is deliberately **no `title`** column: the product code **is** the
title, as a rule, so there is no cell that can drift from the store.
Only `description_html` blocks publishing. `title` is an escape hatch — leaving it blank is the
intended state, because **the title is the 品番**.

## Done, and verified

- The importer, through ten rounds of adversarial review. The real sheet parses clean: 45
  codes, 60 priced colourways, 292 priced variants, zero findings. A flagless dry run plans 29
  products and 264 variants.
- Two Shopify API facts **proven live** against the dev store, so do not re-litigate them:
  `productByHandle` still resolves on Admin API 2026-01 and through the 2027-01 RC; and
  `productVariantsBulkCreate` **does** create option *values* that do not yet exist on a
  product, which is what makes "run 1 prices 20mm, run 2 adds 11.5mm" a single mutation.
- Owner decisions of 2026-10-04, all implemented: **title = 品番**; **category deferred** (no
  `productType` is written and the missing-Category gate is gone, along with
  `--allow-missing-category`); **SKU = `{CODE}-{colour}-{size}`** with no `mm` suffix.
  `hbw.name_ja` is no longer written, and `title_ja` and `category` are retired columns.

## Blocked on the owner — the list to show them

1. **`description_html` for all 45 codes.** The only hard blocker. It is the only prose on an
   English product page, and `--publish-ready` refuses an empty one.
2. **Prices for 15 codes**, still blank in the sheet: `BT-3579`, `BT-3605`, `HBT-35-COMBI`,
   `HBT-3578`, `HBW-3593`, `MBT-8110`, `MBT-8111`, `MBT-9110`, `WBT-3578`, `WBT-3581`,
   `WBT-3587`, `WBT-3589`, `WBT-3590`, `WBT-3592`, `WBT-3601`.
3. **Photographs for 7 colourways** whose samples never arrived: `HBT-3577/BO` and six of
   `HBT-35-COMBI`'s seven. Recorded in `20260904_product_images/NO-IMAGES.txt`, which is the
   importer's source of truth for the exemption. `--publish-ready` refuses a code with any
   unphotographed colourway.
4. **`short_ja`**, per code they care about on `/ja`. ⚠️ It **replaces** the English body rather
   than supplementing it, so a one-line `short_ja` beside a full English description gives a
   Japanese page with one sentence.
5. **`lead_time_days`** wherever the real figure is not 30. This is the one master cell that
   reaches an invoice: it becomes the per-line 出荷予定 and the expected ship date on the 請求書.
6. **Construction and style classification.** Not a publish blocker. Construction (2-hole,
   4-hole, shank, toggle) can be pre-filled by reading the contact sheets in
   `20260904_product_images/verify/` so the owner confirms a filled list rather than a blank
   column.

## Next, in order

1. **Add `construction` and `category` columns to the master.** Owner decision, 2026-10-04:
   each filter dimension gets **its own metafield with `choices`**, not a tag — same reasoning
   as `hbw.material`, which exists precisely so the admin gets a dropdown and typos cannot
   happen. Construction and category are **per-product**; material is per-variant and already
   is. Category should be a list (a design can read as both military and classic); construction
   a single value. `tags` stays for free-form labels that are not filters.
2. **Make the Japanese body symmetric with the English one.** `hbw.short_ja` is rendered as
   plain text in a single `<p>` while the English side goes through `dangerouslySetInnerHTML`,
   so typed line breaks collapse and HTML shows as literal tags. Redefine it as
   `hbw.description_ja` and render it the same way. Free to do now: only `hbw.pricing_segment`
   and `hbw.material` have metafield *definitions*, and Shopify cannot change a definition's
   type in place once it exists.
3. **Publish `overrides.csv` as a Google Sheet** for staff to fill in, the way `HBWPriceList`
   was done.
4. **First real import: `--commit --only MEA-0212`** (1 colour, 1 size, 4 photographs). No
   mutation payload in this importer has ever reached Shopify.
5. **Storefront items that gate publishing.** All pre-existing, detailed in
   [GO-LIVE.md](GO-LIVE.md) §5c. Briefly: `src/lib/colors.ts`
   has zero importers so buyers see raw supplier codes like `H2xDULL` and `BOxDULL` on the
   product page and in the order panel — confirmed on the real `HBW-3584` page, 2026-10-04; and `hbw.in_stock`, `lead_time_days` and the JA body have no
   metafield definitions. Also one line: [ProductCard.tsx:66](src/components/ProductCard.tsx:66)
   renders `{categoryLabel} ·` unconditionally, so an empty category shows a stray middot on
   all 60 tiles.

## Two operational facts worth knowing

- **The SKU is the staff UI.** `src/components/DraftOrderForm.tsx:92` is a bare text input —
  staff type the SKU by hand when creating an order on a buyer's behalf, and there is no product
  lookup, search or autocomplete anywhere in `src/app/admin/**`. On a miss the tool reports
  `品番が見つかりません`. So SKU legibility is an operational requirement, not cosmetics, which is
  why the format was settled before the first import. ⚠️ That form's placeholder is still the
  retired `round-no9-BrownRosewood-18mm` and should become a real one, e.g.
  `WBT-3586-darkbrown-20`.
- **The construction vocabulary already exists.** `dict.labels.holeType` in both dictionaries,
  and `HoleType` in `src/lib/schema.ts`, already carry exactly
  `2-hole / 4-hole / shank / toggle / tack`. Nothing reads them, but the labels are written, so
  `hbw.construction` should mirror that set rather than invent one.

## Traps that have already cost a session

- **Never `--prune-variants` while prices are still arriving.** Every silent-deletion shape
  found in ten review rounds needs that flag to destroy anything.
- **A non-zero exit does not mean nothing was written.** Refusals are per product code, so a
  run can refuse one code, print the refusal, return 1, and still have applied the others.
  Dry-run, read the per-code `writes :` lines, then commit.
- **`DRAFT` hides a product from the catalog listing but not from its own URL.**
  `getShopifyProducts()` filters `status:active`; `getShopifyProductByHandle()` does not.
- **Cutover ordering is load-bearing.** Import as DRAFT, flip at least one real product to
  ACTIVE, and *only then* delete the 23 seeded products. Reversed, no product page prerenders
  and `scripts/guard-guest-html.mjs` fails every Vercel build.
- **The SKU format cannot change after the first `--commit`** — the importer refuses to rename
  a live SKU, so it would warn and leave the store permanently on the old format.
- **Shopify cannot change a metafield definition's type in place.** `scripts/define-metafields.mjs`
  refuses a type change without `--recreate`, which deletes stored values.
- **Guest price gate and tier confidentiality are build-enforced invariants.** See CLAUDE.md.
  `scripts/guard-guest-html.mjs` runs inside `npm run build` and fails the build on a leak.

## Unverified — do not claim these work

- **No `--commit` has ever run.** No mutation payload in the importer has reached Shopify.
- **Cart → `/api/checkout` → draft order has never been run end to end on the current Vercel
  project.** The `write_draft_orders` scope is granted; the path is unproven.
- The 請求書 Order Printer template is referenced in the staff runbook but has never been
  verified to exist.

## Known stale things, worth fixing when nearby

- **CLAUDE.md calls `content/products/*.json` the source of truth.** It is dead code:
  `ProductSchema` in `src/lib/schema.ts` has zero importers and those six JSON files have zero
  readers. The backend has been Shopify since 2026-07.
- **The staff runbook** (`Hammond Button Works — スタッフ運用ガイド`) tells staff to pick
  "standard or plus"; the metafield now offers `standard` / `plus5` / `plus10`. §6 also predates
  the material metafield and the current photography model. Tracked as Jira OT-24.
- **`SHOPIFY_API_VERSION` defaults to `2025-07`**, which is past sunset and is being silently
  served by `2025-10`, which Shopify's own `publicApiVersions` reports as unsupported. Nothing
  is broken; the pin should be deliberate.
- **Japanese colour labels** in `src/lib/dictionaries/ja.ts` are still English strings, so a
  Japanese buyer sees "Dark Brown". Tracked in GO-LIVE.md.
