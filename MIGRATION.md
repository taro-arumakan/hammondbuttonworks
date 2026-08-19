# Migration runbook — fresh Vercel account (2026-08-19)

Why: the `sniarti-fi` Hobby team was **paused by Vercel on 2026-08-18** (every host
serves `402 DEPLOYMENT_DISABLED`) after Meta's crawlers walked the catalog for three
weeks. Final usage over the trailing 30 days: **Fluid Active CPU 12h 3m / 4h (301%)**,
Edge Requests 1.1M / 1M, Fast Origin Transfer 19.9 GB / 10 GB.

A paused Hobby team only resumes when the rolling 30-day window drops back under the
limit (≈ mid-to-late September here) and often needs a support ticket. Decision: **stand
the site up on a new account and delete the old one**, so there is only ever one account
— no plan-limit circumvention, and a clean slate with the fixes already in place.

---

## 0. What actually caused it (so the new account doesn't repeat it)

Two independent problems, both now fixed:

1. **We blocked the wrong crawler.** The 2026-07 firewall rule matched the UA
   `meta-externalagent`. On 2026-08-18 the traffic was:

   | User agent | Requests / 24h |
   |---|---|
   | `meta-webindexer/1.1` | **95.7k** |
   | `meta-externalagent/1.1` | 32.8k |

   `meta-webindexer` is a **separate documented Meta crawler** (Meta AI search). It
   matched neither the firewall rule nor robots.txt, and bare `/{locale}/catalog` was
   `Allow`ed by the `*` group — so it crawled us legitimately, 139k times a day, from one
   JA4 fingerprint on Facebook's AS.

2. **Every public page was dynamic.** `auth()` → `cookies()` in the render path meant
   0% cache hit: one function invocation + origin transfer per request.

**The load-bearing fix is the firewall, not the cache.** Vercel's docs: *"WAF deny,
challenge, or rate-limit mitigated traffic does not incur CDN Requests or Fast Data
Transfer."* Denied traffic is free. Cached traffic is not: 139k req/day ≈ 4.2M edge
requests/month against a 1M Hobby cap, so a 100% cache-hit rate would still have paused
the account. Do the firewall rules **before** pointing the domain.

---

## 1. Before deleting anything — what only exists in the old account

### Environment variables (18 entries; no shared/team vars)

Production (11):

| Variable | Recoverable? |
|---|---|
| `STAFF_EMAILS` *(also Preview)* | ✅ readable; also in local `.env.local` |
| `ADMIN_HOST` *(also Preview)* | ✅ readable — `admin.hammondbutton.works` |
| `SHOPIFY_API_VERSION` | ✅ readable; local `.env.local` |
| `SHOPIFY_STORE_DOMAIN` | ✅ readable; local `.env.local` |
| `EMAIL_FROM` | ✅ readable |
| `NEXT_PUBLIC_SITE_URL` | ✅ readable — `https://hammondbutton.works` |
| `CONTACT_INBOX` | ✅ readable |
| `SHOPIFY_ADMIN_TOKEN` | 🔒 Sensitive — but the value is in local `.env.local` |
| `AUTH_SECRET` | 🔒 Sensitive. Use the local `.env.local` value, or generate a new one (`openssl rand -base64 32`) — a new secret invalidates live sessions and unclicked magic links |
| `RESEND_API_KEY` | 🔒 Sensitive and **not recoverable** — create a fresh key in the Resend dashboard |
| `STAFF_LINK_SECRET` | 🔒 Sensitive — **dead variable**, referenced nowhere in the codebase. Do not recreate |

Preview (4, all Sensitive) and Development (4, readable) carry only the Shopify trio +
`AUTH_SECRET`. `TRADE_ALLOWLIST` is not set anywhere — production resolves accounts from
Shopify, so the env fallback is unused.

### Domains

| Domain | Role |
|---|---|
| `hammondbutton.works` | Production |
| `admin.hammondbutton.works` | Production (admin surface, host-gated) |
| `www.hammondbutton.works` | 308 → `hammondbutton.works` |
| `hammondbuttonworks.vercel.app` | 308 → `hammondbutton.works` (project default; the new project's default hostname will differ) |

DNS stays at **Onamae** (the Google Workspace MX is authoritative there — do not move
nameservers). Apex `A` → `76.76.21.21`; the `www`/`admin` CNAME targets are **per-project**
and will change — read the new values off the new project's Domains page.

### Firewall

One custom rule, "Deny meta-externalagent crawler": `User Agent contains
meta-externalagent` AND `Request Path does not equal /robots.txt` → Deny. Replaced below.

---

## 2. Order of operations

Use a **different email** for the new account so the old one stays readable as a reference
until the new site is verified. (Reusing the same address means deleting first — then
everything in §1 must be captured before you start.)

1. **[you]** Create the new Vercel account. Hobby.
2. **[you]** Import `github.com/taro-arumakan/hammondbuttonworks` as a new project.
   Framework preset: Next.js. Do **not** add domains yet.
3. Set all 9 live env vars from §1 (skip `STAFF_LINK_SECRET`). Mark `AUTH_SECRET` and
   `RESEND_API_KEY` Sensitive.
4. Deploy `main`. The build runs `next build && node scripts/guard-guest-html.mjs` —
   the guard fails the deploy if any public page stops being prerendered or if a price
   string appears in prerendered output.
5. **Verify on the `*.vercel.app` URL, before any domain is attached** (§3).
6. **Create the firewall rules (§4) while the domain still points at the old account.**
   This is the step that must not be skipped — the crawler follows the domain.
7. Remove the four domains from the old project, add them to the new one, update the
   `www` / `admin` CNAME targets at Onamae, re-add the two 308 redirects.
8. Re-verify §3 on the real domain, plus email (magic link) and a Shopify draft order.
9. **Only then** delete the old account.

---

## 3. Verification checklist

```bash
# 1. Guest price gate — MUST print 0 0
for l in en ja; do curl -s "$BASE/$l/catalog" | grep -c '[¥￥]'; done

# 2. Customer class must never appear in guest HTML
curl -s "$BASE/en/catalog" | grep -c 'customerClass\|pricing_segment'   # 0

# 3. Gated API 401s guests
curl -s -o /dev/null -w '%{http_code}\n' -X POST "$BASE/api/price" \
  -H 'content-type: application/json' -d '{"tiles":[{"slug":"x","color":"y"}]}'   # 401

# 4. Pages are served from cache, not rendered per request
curl -sI "$BASE/en/catalog" | grep -i 'x-vercel-cache'    # HIT (or STALE) on 2nd hit

# 5. Faceted URLs collapse onto the same cached document
diff <(curl -s "$BASE/en/catalog") <(curl -s "$BASE/en/catalog?color=Blue&sort=title")

# 6. Admin surface is host-gated
curl -s -o /dev/null -w '%{http_code}\n' "$BASE/admin"                    # 404
curl -s -o /dev/null -w '%{http_code}\n' "https://admin.hammondbutton.works/admin"  # 307 → login

# 7. robots.txt names the whole Meta fleet
curl -s "$BASE/robots.txt" | grep -A1 meta-
```

---

## 4. Firewall configuration for the new project

Hobby allows 3 custom rules, 1 rate-limit rule, 10 IP blocks — all free.

1. **Custom rule — "Deny Meta crawler ASN"**
   `AS Number` **equals** `32934` (Facebook/Meta)
   AND `Request Path` **does not equal** `/robots.txt`
   → **Deny**

   Match on the ASN, not the UA: two different Meta UAs have now slipped past UA
   matching. The `/robots.txt` exception is deliberate — it is the one page that can
   tell a compliant crawler to stop, and denying it means the bot keeps knocking
   forever (we learned that the hard way on 2026-08-13).

2. **Bot Management → AI Bots: `Allow` → `Deny`**

   Vercel maintains this list and adds new AI crawlers automatically — this is the
   setting that would have caught `meta-webindexer` on day one without us having heard
   of it. Trade-off: also blocks ChatGPT/Perplexity-style crawlers. Google Search
   indexing is unaffected (Googlebot is a verified bot, not an AI bot).

3. **Bot Protection: leave on `Log`** until there is traffic worth judging; `Challenge`
   breaks any non-browser client we might add later.

Optional safety net for the *next* unknown crawler: the free rate-limit rule, e.g.
`Request Path starts with /` → 120 req/min per IP → Deny for 10 minutes (persistent
actions are also unbilled). Check the current rate-limit pricing before enabling.

---

## 5. What ships with this deploy

- **Static/ISR public pages** (`cacheability-static-guest-pages`) — no `auth()`,
  `cookies()` or `searchParams` in any public render path; signed-in UI is client
  islands driven by the `hbw_ui` display-hint cookie; prices hydrate from the gated
  batch API. Verified: 118 prerendered HTML/RSC files, **0** price/class strings.
- **robots.txt evicts all four documented Meta crawlers** (`meta-externalagent`,
  `meta-webindexer`, `meta-externalads`, `meta-externalfetcher`). `facebookexternalhit`
  stays allowed so shared links still render a preview card.
- **ISR interval fix**: `shopCurrency()` didn't forward the `revalidate` param, so every
  "hourly" page was silently regenerating at 60s — and only on renders that missed the
  in-process currency memo, so the interval differed per route and per lambda. The build
  now reports `Revalidate 1h` on `/[locale]`, `/[locale]/catalog`, `/[locale]/catalog/[slug]`
  and `/sitemap.xml`.

## 6. Known follow-ups (reviewed, not blocking)

A 10-agent adversarial review of the caching branch confirmed 27 findings, **none
critical or high** — the price/class invariants hold. The ones worth scheduling:

1. **Catalog internal links.** Pagination became client-side buttons, so only the first
   40 colourway tiles carry `<a href>` in the static HTML; the rest of the catalog is
   discoverable only via the sitemap. Fix: render every tile and hide the off-page ones
   with CSS.
2. **Price sort degrades silently.** The tile batch does one `productByHandle` per slug;
   any that fails is dropped, so a signed-in buyer sees the *guest* "Trade pricing — sign
   in" label on those tiles and the "price: low to high" order is silently partial.
   Fix: resolve the batch from the single cached `getAllProducts()` read, and surface
   unresolved tiles instead of omitting them.
3. **`price-desc` sorts unknown prices to the top** (they map to `Infinity`).
4. **Pre-deploy sessions look logged out** — existing `hbw_session` cookies have no
   `hbw_ui` hint. Self-heals on the next magic-link login; affects only the test accounts.
5. **Middleware still runs on every page request** (~1 invocation per edge request). Not
   worth changing: with the ASN deny in place, bot requests never reach it, and narrowing
   the matcher would weaken the `ADMIN_HOST` gate — a trap already hit twice.
6. **Unknown product slugs are still dynamic** (`dynamicParams` defaults to true), so
   `/en/catalog/<anything>` costs a render. Nothing links such URLs; revisit only if a
   crawler starts walking paths instead of query strings.
