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

Google Sheet (owner `taro.rmkn@gmail.com`), one row per sellable variant:
https://docs.google.com/spreadsheets/d/1VbFNJTUVA87Sa4inFCvVEbKn6wlxu5OWYoVVoYxf7PI/edit

**111 rows, pre-filled from the corrected shoot list** — `Product code | Color | Size |
Price (JPY, per piece)`, with only the price column empty. Pre-filling is deliberate: the
first three columns are the join key the import matches on, so a retyped `11,5mm` or
`H2xdull` would silently fail to match. Verified that code+colour+size is **unique across
all 111 rows**, so no two lines are ambiguous.

The 14 logo/engraving samples are excluded (reference items, not sold). The 7 variants whose
samples never arrived ARE included — they still need prices.

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
