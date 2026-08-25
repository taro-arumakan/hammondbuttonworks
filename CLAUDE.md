# Hammond Button Works — Project Guide (for Claude Code)

A from-scratch **B2B pilot storefront** for **Hammond Button Works** — a maker of
**handcrafted natural buttons** in **buffalo horn, wood, and metal** (uncoated, natural
finish, made to order). Production is handcrafted in **Nepal/KTM** for a **Tokyo, Japan**
handicraft company; trade contact **info@alvana.jp**. The pilot showcases 6 products and
validates three B2B fundamentals before a full build.

> **History note:** the pilot was first built around a *fictional* "heritage metal
> workwear button" range (tack/jeans, jumper-coat, doughnut, engraved). When the owner
> supplied the real brand assets (`references/`), the catalog was **pivoted** to the real
> buffalo/wood/metal handcraft line with real photos, the real vector logo, and the
> sample-card layout — keeping the B2B login + tiered pricing + bilingual EN/JA.

## Lineage (read this first)
- Originally built generically as "Atelier Buttons", then **rebranded to Hammond Button
  Works** and re-themed to heritage workwear buttons.
- This folder was **copied out of** the `button-pilot/` directory of the
  `shopify_product_management` repo (branch `claude/button-business-website-4cyd47`) and is
  meant to become **its own standalone repo**. It has no git history of its own yet — run
  `git init` (or it may inherit the parent's; detach if so).
- It is **self-contained** — no dependency on the parent Python repo.

## Stack
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Zod. **No database.**
Auth is a self-rolled signed-token magic link (Web Crypto HMAC). Cart is **Snipcart**
(test mode), behind a swappable abstraction. Email via **Resend** (console fallback in dev).
Deploy target: **Vercel**.

## Run / build / verify
```bash
npm install
cp .env.local.example .env.local       # set AUTH_SECRET: openssl rand -base64 32
npm run dev                            # http://localhost:3000
npm run build                          # validates all product JSON via Zod (fails on bad data)
npm run typecheck
```
Demo trade accounts (see `src/lib/allowlist.ts`), magic link prints to the **server console**
when no Resend key is set:
- `buyer@example-standard.com` (standard tier)
- `buyer@example-volume.com` (volume tier)
- `buyer@example-partner.com` (partner tier)

## Critical invariants — DO NOT BREAK
1. **Guests must never receive price data.** Prices resolve **server-side** in
   `src/lib/pricing.ts` (marked `import "server-only"`; returns `null` for guests).
   `ProductCard`/`PriceBlock` only render prices when a `tier` is present; `/api/price`
   returns **401** for guests via `src/middleware.ts`. Guard check: a guest's
   `/en/catalog` **and** `/ja/catalog` HTML must each contain **0** price strings. (A price
   leak was found and fixed once already — keep it fixed.)
2. **Catalog & product pages are public for SEO** — only the *prices* are gated, not the
   pages. Don't move catalog behind auth.
3. **Product JSON is the source of truth and is Zod-validated at build.** Bad data
   (missing SKU, non-ascending price breaks, bad hex) **fails `next build`** on purpose.
4. The **logo wordmark is an approximation** of a custom typeface (`src/components/Logo.tsx`,
   geometric font stack + dot-in-`o` accent). Swap in the real vector/font when the owner
   provides it.

## Architecture & key files
| Concern | File |
|---|---|
| Zod schema (single source of truth; tiers, `tack` holeType) | `src/lib/schema.ts` |
| Product loader + build-time validation | `src/lib/products.ts` |
| Server-only tier/quantity price resolver | `src/lib/pricing.ts` |
| Signed magic-link + session tokens (Web Crypto) | `src/lib/session.ts` |
| `auth()` / session cookie helpers | `src/lib/auth.ts` |
| Approved trade accounts (+ `TRADE_ALLOWLIST` env) | `src/lib/allowlist.ts` |
| Edge gate (`/api/price`) + locale routing | `src/middleware.ts` |
| Swappable cart (Snipcart adapter) | `src/lib/cart.ts` |
| Resend wrapper (console fallback) | `src/lib/email.ts` |
| Rate limit / base URL helpers | `src/lib/ratelimit.ts`, `src/lib/url.ts` |
| **i18n**: Edge-safe locale config (en/ja, detection, `fmt`) | `src/lib/i18n-config.ts` |
| **i18n**: dictionary loader + `Dictionary` type | `src/lib/i18n.ts`, `src/lib/dictionaries/{en,ja}.ts` |
| **i18n**: per-product copy localizer (falls back to EN) | `src/lib/localize.ts` |
| Language switcher (swaps the `/{locale}` segment) | `src/components/LanguageSwitcher.tsx` |
| SVG logo (compact/full/stamp) | `src/components/Logo.tsx` |
| Photoreal-ish SVG button render (struck metal, patina, emboss, warp) | `src/components/ButtonSwatch.tsx` |
| Grid cell / price block / order panel / quote form | `src/components/{ProductCard,PriceBlock,TradeOrderPanel,QuoteForm}.tsx` |
| Pages (under `/[locale]`) | `src/app/[locale]/{page,catalog,catalog/[slug],quote,login}` |
| Root vs locale layout | `src/app/layout.tsx` (pass-through) · `src/app/[locale]/layout.tsx` (chrome) |
| APIs (NOT locale-prefixed) | `src/app/api/{price,quote,auth/verify,auth/logout}/route.ts` + `app/[locale]/login/actions.ts` |
| 6 products | `content/products/*.json` |
| Product photos | `public/images/products/*.jpg` (cropped from `references/`) |
| Real vector logo | `public/brand/hammond-lockup.svg` → `src/components/Logo.tsx` |
| Brand source assets (gitignored) | `references/` — AI/SVG logo + supplier catalog PDFs |

**Data model:** product = a button *style*; variants = size (mm/ligne) × finish. Tiers:
`tier_standard` / `tier_volume` / `tier_partner`, each with ascending quantity breaks.
`material` includes `buffalo` (horn), `wood`, `metal`; sizes display in **mm**; `unit` is
`piece` for the handcraft line. Optional `face` (`flat`/`stamped`/`open`/`domed`) drives
the SVG fallback render; optional **`image`** (path under `/public`) shows a real photo
instead of the SVG. Each product JSON may carry an optional `translations.ja` block (name,
descriptions, careNotes, per-finish names, seo); `localizeProduct()` applies it, falls
back to EN. **`references/` is gitignored** (repo is public; don't publish supplier PDFs).

**i18n (bilingual EN/JA):** all pages live under `/[locale]` (`en` | `ja`); the root
layout is a pass-through and `[locale]/layout.tsx` renders `<html lang>` + chrome.
Middleware redirects bare paths to a locale (Accept-Language detected) **and** keeps the
`/api/price` guest 401. APIs are NOT locale-prefixed. UI strings live in the dictionaries;
data-value labels (material/holeType/application/unit) are in `dict.labels`. To add a
locale: extend `LOCALES`, add a dictionary, add `translations.<loc>` to products. **Guard
check now spans both locales** — `/en/catalog` and `/ja/catalog` must each contain 0 prices
for guests.

## Branding / design system
Heritage-minimal: background **white `#ffffff`** (niceness.jp-aligned), ink `#1a1714`,
brass accent `#8a6d3b`, hairline `#e4e1da` (`src/app/globals.css`). **Type follows
niceness.jp's pairing: Latin = Marcellus, 日本語 = Zen Old Mincho** — both via `next/font`
(`--font-display` + `--font-jp`). Marcellus is a low-contrast inscriptional Roman (matches
their custom "NICENESS Serif"; was EB Garamond; one 400 weight, no bold serif in the UI).
Zen Old Mincho reaches Japanese two ways: (1) it's the **CJK fallback on `--font-serif`**
(Marcellus → Mincho per-glyph, since Marcellus & its generic fallbacks carry no CJK — no
`unicode-range` needed); (2) for **body/`--font-sans` a per-glyph fallback does NOT work**
— `ui-sans-serif`/`system-ui` themselves cover Japanese (system Gothic) and intercept it —
so a `[lang="ja"]` rule in globals.css **overrides `--font-sans` to lead with Zen Old
Mincho** on Japanese pages (cascades to `body` + every `font-sans` element). Net: EN pages
= Marcellus headings/nav + sans body; JA pages = Mincho throughout (incl. body/About).
Menu links use `font-serif` (serif nav, like niceness) in the desktop layout and `MobileNav`. A **double-line frame** motif (`.frame-double`) mirrors
the logo. Product listing is a **flat, gridline-separated grid** (FreshService-style):
container draws top/left edge, each cell draws right/bottom. Footer carries the circular
**Made-in-Japan stamp**.

## Decisions made this session
- **Domain:** chose **`hammondbutton.works`** (the `.works` TLD reads as the brand name).
  Recommended also grabbing `hammondbuttonworks.com` as a redirect.
- **Domain registered at Onamae.com** (same account family as `alvana.jp`). **DNS stays at
  Onamae** (NOT Route 53 as earlier assumed — keep NS at Onamae so the Google MX is
  authoritative there). Deploy on **Vercel** (apex `A` 76.76.21.21 + `www` CNAME); set
  `NEXT_PUBLIC_SITE_URL=https://hammondbutton.works`.
- **Email plan (see `DNS-SETUP.md` for the full record-by-record checklist):** *receiving*
  = add `hammondbutton.works` as a **domain alias** on the existing **alvana Google
  Workspace** (free, one inbox; needs Super Admin at admin.google.com). *Sending* (app
  magic-link/quote) = **Resend** verified on the `send.hammondbutton.works` subdomain
  (coexists with the Google MX; SPF/DKIM + a `_dmarc` TXT). Wire `RESEND_API_KEY`/
  `EMAIL_FROM`/`CONTACT_INBOX` on Vercel to flip mail from logs to real inboxes.
- **Cart:** Snipcart in test mode. NOTE: Snipcart validates cart price by crawling the
  product URL, which has no price for guests — production B2B pricing needs Snipcart's
  server-side price-validation webhook, or graduate to Stripe/Medusa.

## Status (2026-07-05) — Shopify headless
- **Backend is now Shopify** (dev store `hammondbuttonworks.myshopify.com`, Admin GraphQL
  2025-07; env `SHOPIFY_STORE_DOMAIN/_ADMIN_TOKEN/_API_VERSION`, set on Vercel). Products
  read server-side via `src/lib/shopify.ts`; `content/products/*.json` is legacy. Two
  customer classes replace tiers: `standard` ×1.0 / `plus` ×1.1 (`src/lib/customer.ts`);
  **the ×1.1 is computed in the storefront, never a Shopify discount** — at checkout it's
  stamped per line via draft-order `priceOverride` (`src/lib/orders.ts`). NB `priceOverride`
  is the only lever that can RAISE a unit price — `appliedDiscount` (the sole price control
  the Shopify admin UI exposes on draft orders) can only reduce. So a **manually created
  draft order in the admin will NOT apply the +10%**, and staff cannot add it to a variant
  line; the workaround is a custom line item at the ×1.1 price, or create it via the API.
- **Onboarding & login = Shopify-driven, passwordless, segment-gated.** A customer's class
  lives in the **`hbw.pricing_segment`** customer metafield (choices `standard`/`plus`;
  defined via `scripts/define-metafields.mjs`, pinned dropdown in admin). `resolveTradeAccount`
  in `src/lib/shopify.ts` looks the customer up by email at login and reads that metafield:
  **segment set → access at that class; unset/no customer → no access** ("not yet onboarded").
  So onboarding = add the customer in Shopify admin + pick their segment + set their
  **Language** (the native `customer.locale` field — drives email language). Still a
  magic-link (HMAC) sign-in — **no passwords**. The env `TRADE_ALLOWLIST` + seeded demos
  remain a **fallback** (local dev / preview / Shopify outage). Both demo customers
  (`buyer@example-standard.com`, `buyer@example-plus.com`) now exist in Shopify with segments.
- **Email is live via Resend** (verified on `send.hammondbutton.works`; `RESEND_API_KEY`/
  `EMAIL_FROM`/`CONTACT_INBOX` set on Vercel; end-to-end delivery confirmed). Templates are
  **bilingual EN/JA** (`src/lib/email.ts`): the magic-link language follows
  `customer.locale` → else the site locale; the contact-form ack follows the site locale the
  form was submitted from; staff notifications are Japanese; **default JA** when no signal.
- **Admin (staff) toolset** — same app + deploy (so the pricing/order code can never fork),
  but served **only on `ADMIN_HOST`** (e.g. `admin.hammondbutton.works`); on the public host
  `/admin` and `/api/admin` **404**. Auth is a **staff magic-link session** (`hbw_staff`
  cookie, separate token kind) gated on the `STAFF_EMAILS` allowlist (exact addresses and/or
  `@domain`), re-checked on every request so removing someone revokes them instantly.
  Tools: `/admin/orders/new` (create an order on a customer's behalf) and
  `/admin/signin-link` (mint a 24h login link to relay by LINE).
  **`src/lib/order-lines.ts` is the single order-line builder** used by BOTH storefront
  checkout and the staff tool — that's what stops the ×1.1 drifting between them. Staff
  orders are tagged `staff` and carry `作成者: <email>` in the note for audit.
  **Live on `admin.hammondbutton.works` since 2026-07-11.** Two traps, both hit once:
  (a) the staff magic link must be built with **`adminBaseUrl()`**, not `baseUrl()` — the
  latter returns `NEXT_PUBLIC_SITE_URL` (the storefront), where `/admin/*` 404s; the
  *customer* link minted at `/api/admin/signin-link` still uses `baseUrl()` on purpose.
  (b) `middleware.ts`'s default matcher **excludes any path containing a dot**, and a token
  is `base64url.base64url` — so `/admin/:path*` and `/api/admin/:path*` are listed in the
  matcher **explicitly**, or the sign-in landing route escapes the host gate entirely.
- **Live in production:** Shopify catalog + class pricing + **Sterling-style catalog UX**
  (`src/lib/catalog.ts`: URL-driven sidebar filters w/ faceted counts, sort, pagination;
  price sorts are login-only, enforced server-side).
- **The listing's unit is the COLOURWAY (product × colour), not the product.** Photos are
  shot per colour, so `toColorways()` explodes each design into one tile per colour, each
  showing that colour's **native Shopify variant image** (fallback: product featured shot).
  Colour filters therefore match exactly, and a tile's "from" price is for *that* colour.
  Data unit stays the product (one design, one set of metafields) — no per-colour products.
  Tiles link to `/catalog/<slug>?color=…`, which preselects the colour in `TradeOrderPanel`.
  Sorts tie-break on (name, colour) so a design's colourways stay adjacent → no swatches
  needed. `PAGE_SIZE` is 40 (fills the 5-col desktop + 2-col mobile grids). Dummy per-colour images were generated by
  `scripts/seed-colorway-images.py` (recolour + variant-image assign) — **delete that media
  when the real per-colour photography lands.**
- **SEO + bot-defence (2026-07-30).** A crawler incident burned the Vercel Hobby limits:
  **meta-externalagent** (Meta's AI crawler) walked the faceted catalog URL space at ~3 req/s
  for days (~133K hits/12h on `/[locale]/catalog`, 0% cached ⇒ 100% Fluid CPU, 75%+
  invocations & origin transfer with zero real users). Fixes, all live: (a) `src/app/robots.ts`
  — facet params (`category/size/color/stock/sort`) disallowed on LISTINGS only, rules
  **path-anchored per locale** (`*` spans `/` in robots matching — an unanchored `/*/cart`
  would deindex any product slug starting with "cart"; and product links all carry `?color=`,
  so a blanket query block would sever product crawling; `page` stays crawlable); (b)
  `src/app/sitemap.ts` — all active products × locales w/ hreflang + x-default, degrades if
  Shopify errors; `shopifyFetch` has a 10s AbortSignal so a stalled Shopify can't hard-fail
  `next build` (sitemap prerenders); (c) canonical + hreflang on all public pages — product
  canonical = bare lowercase handle, paginated listings self-canonicalise, `seo.ts:siteUrl()`
  survives malformed `NEXT_PUBLIC_SITE_URL` (else generateMetadata throws ⇒ site-wide silent
  metadata blackout); (d) **Vercel Firewall custom rule "Deny meta-externalagent crawler"**
  (UA contains → Deny, verified 403; browsers/Googlebot 200). Post-incident facts (2026-08-13):
  Hobby limits are a **trailing 30-day window**, not a fixed cycle — the Jul 28-30 spike kept
  CPU >100% until it aged out (~Aug 27-29), and Vercel re-sends the same threshold emails
  fortnightly while over (identical times of day = re-alert, not new burn). Denied requests
  cost nothing and don't count toward limits. Refinement: the deny rule 403'd /robots.txt too,
  so the bot could never learn to stop and kept knocking ~40K/day — fixed by a rule exception
  (AND Request Path ≠ /robots.txt) + a `meta-externalagent → Disallow: /` group in robots.ts.
  Bot Protection is set to **Log** (decision pending); AI Bots = Allow (deliberate). The
  structural fix — edge-cacheable guest pages — landed 2026-08-19 (next bullet).
- **Cacheability refactor (2026-08-19) — the structural fix, DONE.** Context: the Hobby team
  was **paused by Vercel on Aug 18** (site serves 402 `DEPLOYMENT_DISABLED`; Fluid CPU hit
  300%, Edge Requests 1M — a second, UA-unknown bot wave that the meta-externalagent deny
  rule didn't match). Plan: new **Pro-trial team** in the same account → **transfer the
  project** (domains+env move with it; redeploy; re-create firewall rules, which are
  per-project) → observe 14 days → add card + spend cap. The refactor makes bot traffic
  structurally cheap:
  - **No `auth()`/`cookies()`/`searchParams` anywhere in the public render path.** Every
    public page (home, catalog, product, cart, quote, login, about) is **static/ISR**
    (`revalidate = 3600` — literal, since Next requires static segment config; keep in sync
    with `PAGE_REVALIDATE` in `products.ts`). ⚠️ Next lowers a route's effective interval to
    its smallest fetch revalidate, so `shopifyFetch` takes a `revalidate` param: pages/
    sitemap pass 3600, the gated APIs keep the fresher 60s default.
  - **Signed-in UI is client-side, driven by the `hbw_ui` display-hint cookie**
    (`hint-cookie.ts`/`account-hint.ts`): non-httpOnly, email+company ONLY — never the
    class — set/cleared strictly alongside `hbw_session` in `auth.ts`. ⚠️ `encodeHint`
    returns **bare JSON**: Next's cookie serializer applies `encodeURIComponent` itself;
    pre-encoding double-encodes and every island silently renders guest (hit in review).
    Stale hint (session dead) self-heals: gated-API 401 → `dropAccountHint()` (batcher,
    TradeOrderPanel, CartView). Accepted: sessions issued BEFORE this deploy have no hint —
    those buyers see guest UI until their next magic-link login.
  - **Prices hydrate client-side for signed-in buyers only**: `TilePrice` + `price-batcher`
    (one pooled POST per page view; cache bound to the hint email so a class-priced cache
    can't leak across account switches) → `/api/price` batch shape (`{tiles:[{slug,color}]}`,
    per-slug error catch so one throttled Shopify lookup can't 500 the batch). Guests/bots:
    **zero** function invocations.
  - **The catalog listing is ONE static document per locale**: `CatalogBrowser` runs
    filters/sort/pagination client-side over the price-free `CatalogTile[]` (`toTiles()` in
    `catalog.ts` is the invariant-#1 choke point — a `Colorway` carries `basePrice` and must
    never cross into a client component). Vercel ignores the query string for prerendered
    routes, so the entire faceted URL space (the 2026-07 burn) collapses onto cache hits
    (verified byte-identical). URL state syncs via a `useSearchParams` bridge inside its own
    `<Suspense fallback={null}>` (mount-time `location.search` reads MISS soft navigations —
    a same-route Link keeps components mounted; this bit LoginStatus + the nav-reset case in
    review) + `history.pushState` (which Next syncs). Price sorts: signed-in only, via the
    batch API.
  - **`scripts/guard-guest-html.mjs` runs in `npm run build`** (so on every Vercel deploy):
    fails the build if any public page stops being prerendered, if any prerendered HTML/RSC
    (incl. every product page) contains a price/class string, or — when `SHOPIFY_STORE_DOMAIN`
    is set — if the catalog prerendered empty (lost env vars would otherwise ship a green
    deploy where every product URL 404s).
  - **Products fetch failure contract** (`products.ts`): env unset → empty catalog + warn
    (local no-creds builds pass); env set + Shopify error → **throw** (build fails loudly,
    previous deploy stays live; ISR regen failure keeps serving the last good page).
  - Catalog canonical is now always the bare `/catalog` (the page can't read `?page=`);
    pagination is buttons, not links — product discovery is **sitemap-driven**. Quote page:
    anti-spam token now minted by `GET /api/form-token`, fetched on mount with a submit-time
    retry. Cart: static shell + `CartGate` island (guest prompt; dict `cart.guestHeading/-Body`).
- **Cart → checkout → Shopify draft order is UNBLOCKED.** Cart is localStorage selections
  only (`src/lib/cart-client.ts`); prices via gated `/api/cart/quote`; `/api/checkout` creates
  the draft order (bank transfer, engraving flag, expected ship date). The
  **`write_draft_orders` scope IS granted** — verified 2026-08-25 against the live app
  installation, so the long-standing "checkout 502s until the scope lands" note is retired.
  ⚠️ Scope granted ≠ path verified: cart → `/api/checkout` → draft order has never been run
  end-to-end on the new Vercel project. See `GO-LIVE.md`.

## Status (2026-06-26)
- **Repo:** standalone git repo initialized and pushed to
  **https://github.com/taro-arumakan/hammondbuttonworks** (public). Connected to Vercel,
  so pushes to `main` auto-deploy.
- **`src/lib/` was MISSING and has been reconstructed.** The whole library layer
  (schema, products, pricing, session, auth, allowlist, email, ratelimit, url) never
  existed in this copy *or* the parent repo / any branch / history — the app had never
  built. It was rebuilt from the consumers' exact import contracts + the spec above. The
  contract each lib file must satisfy = the imports in `src/app/**` and `src/components/**`.
- **Live preview:** **https://hammondbuttonworks.vercel.app** (Vercel production alias,
  public). Guest gating verified live: 0 prices in guest HTML; `/api/price` 401s guests;
  magic-link login issues a session and returns correct tiered pricing.
- **`AUTH_SECRET`** is set on Vercel for all envs as a **Sensitive** var (not readable via
  `vercel env pull` — expected, not a bug). `NEXT_PUBLIC_SITE_URL` is unset, so email/quote
  links fall back to the request host (fine for the preview; set it when the domain lands).
- **Demo login:** no email provider is wired, so magic links print to the Vercel function
  logs (`vercel logs`), not an inbox. Clicking a link grants a 30-day trade session.

## Open items / next steps
- ⚠️ **Trademark check:** an established Japanese brand **"Button Works" (ボタンワークス)**
  exists in the *same* workwear-button niche. Verify "Hammond Button Works" is clear before
  committing the name to packaging/hardware. (Repo is now **public** under this name.)
- Replace placeholder product specs/prices with the owner's real data.
- Pixel-perfect logo once the original vector/font is supplied.
- Photoreal hero images (prompts ready in `content/image-prompts.md`); save to
  `public/images/products/<variantSku>.jpg` and wire via `next/image`.
- Wire **Resend** (+ verified domain) so trade magic links email instead of hitting logs.
- Set `NEXT_PUBLIC_SITE_URL` once the domain is finalized.
- Optional `DEPLOY.md` (Route 53 + Vercel records) — offered, not yet written.

## Env vars (see `.env.local.example`)
`AUTH_SECRET` (required) · `STAFF_EMAILS` (who may sign in to `/admin`; exact addresses
and/or `@domain` entries) · `ADMIN_HOST` (the host that serves `/admin`; elsewhere it 404s)
· `NEXT_PUBLIC_SITE_URL` · `RESEND_API_KEY` / `EMAIL_FROM` /
`CONTACT_INBOX` (legacy `QUOTE_INBOX` still read as fallback) · `TRADE_ALLOWLIST` (`email|tier|Company`) · `NEXT_PUBLIC_SNIPCART_KEY` /
`NEXT_PUBLIC_CART_PROVIDER` · `QUOTE_SHEET_WEBHOOK_URL`.

## Post-pilot roadmap
Phase 2 live checkout + tax/shipping/order emails · Phase 3 headless CMS (reuse the Zod
schema) + full catalog/filters · Phase 4 self-serve trade-account application + admin
approval + customers DB · Phase 5 graduate cart to Medusa (B2B price lists) + B2C surface.
