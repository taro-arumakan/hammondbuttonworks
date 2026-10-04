# Go-live checklist

State as measured on **2026-08-25**, updated **2026-09-02**. Site healthy: liveness 429 (= challenge served, see [MONITORING.md](MONITORING.md)),
latest production deployment Ready, firewall rule armed, all 10 env vars present, daily
traffic checks quiet.

---

## Blockers — do before real buyers arrive

### 1. ~~Confirm Googlebot is not being challenged~~ ✅ RESOLVED 2026-09-02

Bot Protection is set to **Challenge**, which serves `429` + a JS interstitial to anything
that does not look like a browser — verified on `/sitemap.xml` via `curl`. The open question
was whether Googlebot was caught by it, which could not be tested from outside: a spoofed
Googlebot UA is correctly challenged, which is exactly what made the real one untestable.

**Answered with the only instrument that could answer it.** Google Search Console →
URL Inspection → **Live Test** on `https://hammondbutton.works/en/catalog/crest` returns
**"URL is available to Google" / "Page can be indexed"**. The fetch originates from Google's
own infrastructure with verified Googlebot identity, so Vercel's verified-bot exemption is
working. **Bot Protection stays on Challenge**; the "revert to Log" fallback is not needed.

Scope of what this proves: Googlebot specifically. It does not cover other non-browser
clients — Bingbot, and `facebookexternalhit`, which robots.txt deliberately allows so shared
links render a preview card. Those remain unverified; check a link preview by hand if it
matters commercially.

Property is a **Domain** property verified under `sniarti.fi@gmail.com` (DNS TXT). Note the
apex now carries **two** `google-site-verification` records: the July one belonging to the
**alvana Workspace domain alias** (which mail depends on) and this new one. Never edit or
replace an existing TXT — only append; removing the Workspace token would un-verify the
alias and break mail to `@hammondbutton.works`.

Remaining here: submit `https://hammondbutton.works/sitemap.xml` under Sitemaps and confirm
it reads *Success*. Expect 74% of its 54 URLs to be dummy products until the catalog swap
(§5); their later 404s are normal and need no deploy, since the sitemap regenerates hourly
from Shopify's active products.

### 2. ~~Magic-link email, end to end~~ ✅ SUBSTANTIALLY RESOLVED 2026-09-02

The concern was that `RESEND_API_KEY` on this project was a **new key that had never sent a
message**. It has now: staff sign-in (§3) delivers its magic link through the same Resend
transport in `src/lib/email.ts`, and it arrived and worked.

Residual: the *buyer* template at `/en/login` has not been exercised specifically. Same
transport, different template — so what is untested is the copy and the `customer.locale`
language selection, not whether mail sends at all. Worth one pass with a seeded buyer before
inviting real accounts.

### 3. ~~Staff sign-in at `admin.hammondbutton.works`~~ ✅ RESOLVED 2026-09-02

Signed in successfully as `support@sniarti.fi`; the staff tool renders both actions
(代理で注文を作成 / ログインリンク発行). This also confirms `STAFF_EMAILS` and `ADMIN_HOST`
are correct in production, neither of which is readable back from the dashboard.

### 4. Checkout → Shopify draft order

`write_draft_orders` **is granted** (verified today against the live app installation — the
long-standing "pending one switch" note in CLAUDE.md was stale). But the path
cart → `/api/checkout` → draft order has never been exercised on this project. Run one
signed-in order through and confirm the draft appears in Shopify with the correct
`priceOverride` for a `plus` customer.

### 5. Replace the dummy catalog

**Photography arrived 2026-09-04 and is prepared** — see `20260904_product_images/`
(gitignored; originals are the owner's source assets and the repo is public).

- `by-variant/<CODE>/<COLOUR>/<SIZE>/{01-front,02-side,03-three-quarter,04-back}.jpg`
  — **104 product variants**, hard-linked so no disk is duplicated.
- `logo-samples/LOGO-SAMPLE-{BUFFALO,WOOD}/…` — **14 engraving reference samples**, for the
  separate buyers' reference page, not the catalogue.
- `catalog-photos/` — 12 frames (`000706`–`000717`) reserved for advertising use.
- `manifest.csv` maps every original filename → variant, so a correction is a re-run rather
  than a re-sort. `shooting-list.csv` lists all 125 combinations incl. the 7 unphotographed.

The mapping is **deterministic, not inferred**: 118 photographed items × 4 angles − 1
(`MBT-0812-DO-18mm` has no back shot) = 471, exactly the number of product frames.
Two spreadsheet conventions had to be handled to get there — merged 品番 cells spanning up
to 8 columns, and blank cells meaning "same as the column to the left". Reading the colour
row as the item count undercounted by 14 and silently corrupted every downstream boundary.

Data corrected against the owner's rules: `buffal0`→buffalo, `acasia`→acacia, `11,5mm`→
`11.5mm`, codes uppercased, `xdull`→`xDULL`, and wood colour derived from species
(**rosewood = dark brown, mango = beige, acacia = brown**) which fixed `bwige`→beige and
resolved a `WBT-3586` collision where one code+colour+size covered three different woods.

Still to do here:



Measured today: **23 active products — 20 tagged `dummy`, 3 real** (`round-no9`, `crest`,
`work-4hole`). 138 variants, every one carrying an image, but those are the recoloured
placeholders from `scripts/seed-colorway-images.py`.

When the real photography lands:
- delete the 20 `tag:dummy` products,
- delete the generated per-colour media (that script's output) so real shots are not mixed
  with recolours,
- re-check the catalog grid, which is tuned for a 5-column desktop layout at `PAGE_SIZE` 40.

### 5b. Price list — being keyed in

One workbook, three tabs (+ README), owner `taro.rmkn@gmail.com`:
https://docs.google.com/spreadsheets/d/1RveEGNAq9ohcmJ1iOG9mKgVs0CuXsGWYjizBPZK9cdw/edit

| Tab | Rows | Size columns |
|---|---|---|
| 1. Standard (buffalo and wood) | 69 | 10, 11.5, 15, 18, 20, 23, 25 |
| 2. Toggle 角型・トグル | 6 | 45, 55 |
| 3. Metal | 24 | long format — one row per size |

Split by size regime after the maker (Yukinori Ueda) confirmed the ranges over LINE.

**標準サイズは10、11.5、15、18、20、23、25mm** — verified against the shoot data: every
non-metal, non-toggle photographed size falls inside that set, nothing outside it. An earlier
draft wrongly carried 11mm and 13mm columns; 11.5 is correct and 13 is metal-only.

**角型はトグルボタンで45、55mmの2種類** — 45mm was never photographed, so that column starts
empty. Tabs 1 and 2 are grids (a price means the size is offered, blank means it is not).

**Metal is size-per-design** and each design can be re-cut to another size on request, so no
fixed column set exists. Tab 3 is long format, extendable by adding rows. A list of
manufacturable sizes per metal code has been requested and is not yet in hand.

✅ **`WBT-3578` on the toggle side was a wrong code — it is `WBT-3592`** (owner-confirmed
2026-09-11). It had been the one product code spanning two size regimes, which is what made
it suspicious. The correction completes a family that was previously broken: three toggle
designs, each made in both horn and wood —

| design | horn (`HTB-`) | wood (`WBT-`) |
|---|---|---|
| 3581 | H3 buffalo | brown acacia |
| 3592 | HB01 buffalo | beige mango |
| 3601 | HT01 buffalo | dark brown rosewood |

Applied to `by-variant/` (folder moved), `manifest.csv`, `shooting-list.csv` and the
regenerated contact sheets. ⚠️ The workbook's README tab still carries the superseded
"open question" wording about WBT-3578 — delete those two lines.

Columns A–D are the join key and reference; only the size/price columns get keyed. The 14
logo/engraving samples are excluded (not sold). The 7 variants whose samples never arrived
are included — they still need prices.

### 5c. Product registration — the importer

Lives in the **private** repo `/Users/taro/sc/hammondbuttonworks-tooling`, not here. ⚠️ It was
originally written inside `shopify_product_management`, which is **PUBLIC** — and its README and
~90 test fixtures quote the real wholesale ladders, so it was moved out before anything was
committed. Never put HBW pricing in SPM. SPM is consumed as an editable **uv path dependency**
(private → public, the safe direction), so both repos must be checked out under the same parent.
The machinery it reuses is there:
(`ShopifyGraphqlClient` with `ProductCreate`/`Medias`/`Metafields`/`Variants`, the Google
Sheets interface, credentials, tests), and both of its inputs — the price sheet and
`20260904_product_images/` — are gitignored out of this public repo.

```
/Users/taro/sc/hammondbuttonworks-tooling/
  hbw/
  import_products.py   planner + applier + CLI
  price_sheet.py       the two tab shapes; price / size / material normalisation
  images.py            manifest.csv reader, unique media names, hardlink staging
  overrides.py         the owner-editable copy file
  client.py            HbwClient(ShopifyGraphqlClient)
  overrides.csv        TEMPLATE — all 45 codes, every value cell blank
  README.md            prerequisites, gotchas, the plausibility constants
```

Run from the tooling repo root:

```bash
uv run python -m hbw.import_products
```

Tests live with that repo's own: `tests/test_hbw_price_sheet.py`, `tests/test_hbw_import.py`
(no credentials, no network). There is also an offline mode — `--dump-sheet-csv DIR` once with
credentials, `--sheet-csv-dir DIR` forever after — which produces an identical plan.

**Dry run is the default; `--commit` is required to write, and products are created `DRAFT`.**
That is the safety lever: `getShopifyProducts()` queries `status:active`, so a DRAFT product
is invisible to the storefront. Import everything, inspect it in the admin, and flipping to
ACTIVE becomes the deliberate go-live step. ⚠️ `getShopifyProductByHandle()` does **not**
filter on status, so a draft product's own URL still renders.

**What it writes** is exactly what `src/lib/shopify.ts` reads: options named `Color` and
`Size`; size values like `20mm` / `11.5mm` (`sizeToMm` strips all but digits and dots); the
supplier colour code verbatim in `Color`; `hbw.material` as a JSON list drawn from
buffalo/acacia/rosewood/mango/metal, with the sheet's `brass` mapped to `metal`;
`hbw.in_stock` = `false`, since everything is made to order; `hbw.{name_ja, short_ja,
lead_time_days}`; handle = the code lowercased; `productType` = the Category facet.

**Idempotent per product code.** Updates never go through `productSet` — it is declarative and
would delete any variant absent from the input, which is fatal while prices arrive in batches.
Creates use `productSet`; updates diff, then use `productVariantsBulkCreate` / `BulkUpdate`.
Media is diffed on the Shopify `alt`, which carries a content hash so a re-shot frame
re-uploads. Stale variants are reported and deleted only with `--prune-variants`.

Two API assumptions were **proven live** against the dev store rather than assumed:
`productByHandle` still resolves on 2026-01 and through the 2027-01 RC, and
`productVariantsBulkCreate` *does* create option **values** that don't yet exist on a product.
The second is what makes "run 1 prices 20mm, run 2 adds 11.5mm" work at all.

**Blocked on the owner, not on code.** `overrides.csv` holds all 45 codes with every value
cell blank, so the default dry run skips all 45 for "no Category". Category is a live filter,
so a missing one refuses the product rather than creating something unfilterable. Minimum per
code: `title` and `category`. Note `title_ja` is **not rendered anywhere today**
(`localizeProduct` is a deliberate no-op for names) and `short_ja` **replaces** the description
on JA pages rather than supplementing it.

#### How to run it safely — read this before `--commit`

Ten rounds of adversarial review went into the sheet-reading rules, and they now refuse every
mis-key family that was found: a product code that is not in `manifest.csv` or `overrides.csv`,
a homoglyph or ditto mark or annotation in a code cell, a size header out of ascending order or
outside its tab's set, a price outside 10–10,000 JPY, a wood species that disagrees with its
colour, a price row pasted 1–5 columns off, and a variant moved between two codes. The real
sheet parses clean through all of it: **45 codes, 60 priced colourways, 292 priced variants,
zero findings**. 838 tests pass.

Three operational rules matter more than any of those checks, because they cover what the
checks cannot.

1. **Never pass `--prune-variants` while prices are still arriving.** Every silent-deletion
   shape found across all ten rounds needs that flag to destroy anything. Without it the worst
   case is an extra variant or an extra DRAFT product, which the plan prints and which a later
   run reconciles. The first run does not need it and neither does any run before the catalogue
   is stable.
2. **A non-zero exit does not mean nothing was written.** Refusals are per product code, so a
   run can refuse one code, print the refusal, return 1, and still have applied the other 29 —
   including a deletion on a code the refusal did not name. ⚠️ So `--commit --prune-variants`
   in one shot is *not* protected by a refusal. Dry-run first, read the plan, then commit.
3. **Read the plan, not the summary.** The dry run is honest: every write it would make is
   printed per code on a `writes :` line, and the first-time-pricing notices name both codes
   when a colourway looks like it moved. At most a handful of lines. That is the last line of
   defence and it works, but only if someone reads it.

Known limits, deliberately not closed, all documented in the importer's own README:

- A price-cell digit transposition inside the plausibility window — a digit swapped, say 456
  keyed as 465 — is
  undetectable. Nothing in the importer knows what a button should cost.
- A wood species **and** its colour swapped consistently across two rows is undetectable; the
  check is a bijection, so a consistent swap leaves it nothing to disagree with.
- A price row pasted six or more columns off (on a seven-size row) leaves one corroborating
  price, and accepting one would convict a colourway keyed at a single size, which is ordinary
  work. The trade was taken deliberately.
- On the **first** run only, against an empty store, a one-column paste shift cannot be caught
  on the six priced grid codes that have no sibling colourway to compare against: `WBT-3580`,
  `WBT-3585`, `WBT-3588`, `HTB-3581`, `HTB-3592`, `HTB-3601`. Read those six rows' ladders
  before the first commit. From the second run on, the live store covers them.
- A mis-key combined with a second edit in the same batch — pricing the waiting codes, or
  tidying away the duplicate blank row the mis-key leaves behind — is **reported** by the
  first-time-pricing notice rather than refused. See rule 3.

The highest-value change still outstanding is a policy flip rather than another check: **make
any refusal abort the whole run instead of skipping one code.** That alone makes rule 2
unnecessary, and unlike a detection heuristic it cannot produce a false positive — the cost is
that the operator fixes the sheet and runs again, which is what they should be doing anyway.

#### Three storefront items gate publishing

All pre-existing; none are the importer's to fix.

1. **`TradeOrderPanel` cannot order a sparse Color × Size matrix — LATENT, not current.** It
   seeds `sizeMm` from the product-wide `sizesMm[0]` and renders that same union as chips, so on
   a product where one colour lacks a size another colour has, the panel can land on a variant
   that does not exist and sit on 「計算中」 forever with add-to-cart disabled. ⚠️ **Corrected
   2026-10-04:** this was earlier described as hitting most colourways. Checked against the 30
   products actually registered, **none has a sparse matrix** — every priced Standard colourway
   carries all 7 sizes, Toggle both, and the metal codes are single-colour or uniform. It will
   fire the first time a colour is priced at a size its siblings are not, so fix it before more
   prices land. Fix: derive the offered sizes from the selected colour, and disable the rest.
2. ~~**`src/lib/colors.ts` is dead code**~~ **Fixed 2026-10-04.** `baseColor()` is gone. The
   colour facet groups by `filterColorOf(color, [])` — with NO materials, deliberately: that is
   the exact call the importer's admission gate makes (`storefront_filter_color`), so every
   colour it admits resolves, and `PRODUCT_FIELDS` does not fetch `hbw.material`. What a buyer
   reads comes from `colorLabels()` — `H2xDULL` → "Dark Brown / Dull", `AB` → "Antique Brass",
   `H3xAG` → "Brown / Antique Gold" — on the product page, the order-panel chips, the catalog
   tiles and the cart. Two colourways of one product never share a label: a collision gets the
   code appended ("Dark Brown (H2)" beside "Dark Brown (HB01)"), and one that survives that
   throws. ⚠️ That throw **fails a deploy** — but during the hourly ISR refresh it fails
   **silently**: Next keeps serving the last good catalog page, so newly activated or archived
   products simply stop appearing and nobody is alerted, and a product page rendered on demand
   returns a 500. It can only arise from a colour value typed by hand in the Shopify admin,
   since the importer refuses any colour that does not resolve. The colour **value** is untouched everywhere it is an
   identity (`/api/price`, `?color=`, the cart). ⚠️ **Owner to confirm the metal finish names**,
   read off the photographs: only AB = antique brass was recorded; AN antique nickel, AS
   antique silver, DO dark oxidised and B brass are inferred; SP bright silver and AG antique
   gold are low confidence (the 15mm `H3xAG` COMBI sample looks like an AS piece). The JA colour
   labels are still English (parked).
3. **`hbw.{in_stock, name_ja, short_ja, lead_time_days}` have no metafield definition**, so no
   admin dropdown and no pinned field. Writes still work because each sends an explicit type,
   but `scripts/define-metafields.mjs` should be extended.

#### Order of operations at cutover — load-bearing

Import as DRAFT, flip at least one real product to ACTIVE, and **only then** delete the 23
seeded products. Reversed, no product page prerenders and `guard-guest-html.mjs` fails every
Vercel deploy.

First real run should be `--commit --only MEA-0212` (1 colour, 1 size, 4 photographs). No
mutation payload in this importer has ever hit Shopify.

Unrelated finding from the same work: this repo defaults `SHOPIFY_API_VERSION` to `2025-07`,
which is past sunset and is silently served by `2025-10` — which Shopify's own
`publicApiVersions` reports as unsupported. Nothing is broken; the pin should be deliberate.

### 6. Clear test data

4 customers (`buyer@example-standard.com`, `buyer@example-plus.com`, `taro@sniarti.fi`,
`taro.rmkn@gmail.com`), 3 orders, 5 draft orders. Decide which of these survive as demo
accounts and remove the rest.

---

## Should do

7. **Catalog internal links.** Only the first 40 colourway tiles carry `<a href>` in the
   static HTML; the rest of the catalog is sitemap-only. Harmless at 46 colourways, a real
   problem once the full range lands. Fix: render every tile and hide off-page ones with CSS.
8. **Preview environment is half-configured** — see "Should Preview be a real site?" below.
9. **Turnstile on the quote form** — still not implemented; `form-guard.ts` only mentions it
   in a comment. Current defence is honeypot + signed time-trap + per-IP rate limit, which
   has held so far.
10. **Price sort degrades silently** — a tile whose price lookup fails is dropped, so a
    signed-in buyer sees the *guest* "Trade pricing — sign in" label on it and the ordering is
    quietly partial. Related: `price-desc` sorts unknown prices to the **top**.
11. **Confirm the `www` → apex 308** in a browser (curl only ever sees the challenge).
12. **`DNS-SETUP.md` is stale** — it describes the old project's redirect setup; record values
    are still correct.
13. **Japanese colour labels are English.** Every value in `dict.labels.color` in
    `src/lib/dictionaries/ja.ts` is the English word (`brown: "Brown"`), not katakana —
    pre-existing across the whole map, not just the entries added on 2026-09-04. Japanese
    apparel listings normally use katakana (ブラウン / ベージュ / ブラック). When doing this,
    render the dyed range as 「ブラック（染色）」 rather than a literal 「染めブラック」, which
    reads as a calque.
14. **Trademark check.** An established Japanese brand **"Button Works" (ボタンワークス)**
    exists in the same workwear-button niche. This has been open since the pilot began, and
    go-live is the point where it stops being theoretical.

---

## Should Preview be a real site? (decision for later)

Today Preview holds only `ADMIN_HOST` and `STAFF_EMAILS`. With no Shopify credentials,
`shopifyConfigured()` is false, so every branch preview builds an **empty catalog** and
cannot issue sessions — it looks like a broken site rather than a missing config. In
practice that means previews cannot be used to review the thing the site mostly *is*.

⚠️ **It is all three Shopify vars or none.** Adding just the two non-secret ones actively
breaks preview builds:

```js
// scripts/guard-guest-html.mjs
if (process.env.SHOPIFY_STORE_DOMAIN) {   // now true
  if (productPages === 0) { fail }        // but no token → 0 products → build FAILS
```

`shopifyConfigured()` requires domain **and** token, so a partial config flips the guard's
safety check on while leaving the data fetch disabled.

Options, roughly in order of preference:

| | Approach | Blast radius | Cost |
|---|---|---|---|
| **D** | **Second Shopify custom app, read-only scopes**, token given to Preview | Previews can browse and price, but cannot create draft orders or edit products | One app to create; ~10 min |
| B | Separate Shopify **development store** for Preview | None — different store entirely | Two catalogs to keep in sync |
| A | Give Preview the **production** Admin token | A branch deploy holds `write_draft_orders` / `write_products` / `write_customers` against the live store | Zero |
| C | Status quo — no credentials | None | Zero, but previews stay useless |

**D is the recommendation.** It makes previews genuinely reviewable while keeping every
write path out of them — and `/api/checkout` failing on a preview is arguably correct
behaviour rather than a limitation.

Two details for whichever option is chosen:

- Preview also needs `AUTH_SECRET`, and it should be a **different value from production**,
  not a copy. Session cookies are host-scoped so they cannot cross over, but magic-link
  tokens are signed blobs that would verify on either host if the secret were shared. A
  separate preview secret removes that entirely.
- Preview deployments already sit behind Vercel's Deployment Protection (the deployment URL
  302s to Vercel SSO), so previews are not publicly reachable. That is what makes option A
  merely inadvisable rather than dangerous.

---

## Housekeeping

14. **Delete the old Vercel account** — see below.
15. After deletion, `hammondbuttonworks.vercel.app` frees up; the project can reclaim it
    instead of `hammondbuttonworks-six.vercel.app`.
16. Retire or clearly label the seed scripts (`seed-dummies.mjs`, `seed-colorway-images.py`,
    `seed-shopify.mjs`) so nobody re-runs them against a live catalog.

---

## Deleting the old account — ready, with one check

The old `sniarti-fi` account holds **nothing the new project depends on**:

- domains — already released and re-claimed,
- env secrets — were Sensitive there too, so unreadable and of no recovery value,
- deployment history — irrelevant,
- firewall config — already replicated and improved.

Worth correcting an earlier assumption of mine: **it is not a rollback.** It is paused, so it
cannot serve traffic even if we wanted to revert, and it will stay paused until its trailing
30-day window clears (~mid-September). Keeping it does not de-risk any outstanding item —
none of blockers 1–4 above are recoverable from it.

⚠️ **Check first:** confirm the old team has **no other projects**. Account deletion is
irreversible and takes everything with it. This was never enumerated — the only project ever
observed there was `hammondbuttonworks`, but "observed" is not "verified". Open
https://vercel.com/sniarti-fi and confirm the project list is empty before deleting.

Also consider whether `sys@sniarti.fi` is used as a login anywhere else in the business
before removing the account attached to it.
