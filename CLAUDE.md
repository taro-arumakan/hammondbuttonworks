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
  stamped per line via draft-order `priceOverride` (`src/lib/orders.ts`).
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
- **Live in production:** Shopify catalog + class pricing + **Sterling-style catalog UX**
  (`src/lib/catalog.ts`: URL-driven sidebar filters w/ faceted counts, sort, pagination;
  price sorts are login-only, enforced server-side).
- **Built, pending one switch:** cart → checkout → **Shopify draft order** (bank transfer,
  engraving flag, expected ship date). Cart is localStorage selections only
  (`src/lib/cart-client.ts`); prices via gated `/api/cart/quote`; `/api/checkout` creates
  the draft order. ⚠️ Requires **`write_draft_orders`** scope on the Shopify custom app
  (Shopify admin → Develop apps → Configuration) — until granted, checkout 502s gracefully
  and the cart is preserved.

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
`AUTH_SECRET` (required) · `ADMIN_SECRET` (guards `/api/admin/signin-link`, the staff
link-minter for LINE/manual relay) · `NEXT_PUBLIC_SITE_URL` · `RESEND_API_KEY` / `EMAIL_FROM` /
`CONTACT_INBOX` (legacy `QUOTE_INBOX` still read as fallback) · `TRADE_ALLOWLIST` (`email|tier|Company`) · `NEXT_PUBLIC_SNIPCART_KEY` /
`NEXT_PUBLIC_CART_PROVIDER` · `QUOTE_SHEET_WEBHOOK_URL`.

## Post-pilot roadmap
Phase 2 live checkout + tax/shipping/order emails · Phase 3 headless CMS (reuse the Zod
schema) + full catalog/filters · Phase 4 self-serve trade-account application + admin
approval + customers DB · Phase 5 graduate cart to Medusa (B2B price lists) + B2C surface.
