# Go-live checklist

State as measured on **2026-08-25**, four days after the migration to the new Vercel
account. Site healthy: liveness 429 (= challenge served, see [MONITORING.md](MONITORING.md)),
latest production deployment Ready, firewall rule armed, all 10 env vars present, daily
traffic checks quiet.

---

## Blockers — do before real buyers arrive

### 1. Confirm Googlebot is not being challenged ⚠️ highest risk

Bot Protection is set to **Challenge**, which serves `429` + a JS interstitial to anything
that does not look like a browser. Verified today: `/sitemap.xml` returns the challenge page
to `curl`.

Google *should* be exempt — Vercel excludes verified bots by IP/rDNS — but **this cannot be
tested from outside**, because a spoofed Googlebot UA is correctly challenged, which is
exactly what makes the real one untestable. The failure mode is bad: Google reads `429` as
"back off", and with only 40 product links in the static catalog HTML, the sitemap is the
main discovery path.

Verify properly in **Google Search Console**: submit `https://hammondbutton.works/sitemap.xml`,
then check it is *Success* rather than *Couldn't fetch*, and use URL Inspection → Live Test on
one product page. If Google is being challenged, set Bot Protection back to **Log** — the
ASN deny rule and AI Bots = Deny are what actually stop the crawler that paused the old
account; Challenge is additive.

### 2. Magic-link email, end to end

`RESEND_API_KEY` on this project is a **new key that has never sent a message**. Request a
link at `/en/login` as a seeded buyer and confirm it arrives and signs you in. Nothing about
this is recoverable from the old account, so it must be tested on its own merits.

### 3. Staff sign-in at `admin.hammondbutton.works`

Same reason — the staff magic link path has never run on this project. `STAFF_EMAILS` is
`info@alvana.jp, support@sniarti.fi, taro.rmkn@gmail.com`.

### 4. Checkout → Shopify draft order

`write_draft_orders` **is granted** (verified today against the live app installation — the
long-standing "pending one switch" note in CLAUDE.md was stale). But the path
cart → `/api/checkout` → draft order has never been exercised on this project. Run one
signed-in order through and confirm the draft appears in Shopify with the correct
`priceOverride` for a `plus` customer.

### 5. Replace the dummy catalog

Measured today: **23 active products — 20 tagged `dummy`, 3 real** (`round-no9`, `crest`,
`work-4hole`). 138 variants, every one carrying an image, but those are the recoloured
placeholders from `scripts/seed-colorway-images.py`.

When the real photography lands:
- delete the 20 `tag:dummy` products,
- delete the generated per-colour media (that script's output) so real shots are not mixed
  with recolours,
- re-check the catalog grid, which is tuned for a 5-column desktop layout at `PAGE_SIZE` 40.

### 6. Clear test data

4 customers (`buyer@example-standard.com`, `buyer@example-plus.com`, `taro@sniarti.fi`,
`taro.rmkn@gmail.com`), 3 orders, 5 draft orders. Decide which of these survive as demo
accounts and remove the rest.

---

## Should do

7. **Catalog internal links.** Only the first 40 colourway tiles carry `<a href>` in the
   static HTML; the rest of the catalog is sitemap-only. Harmless at 46 colourways, a real
   problem once the full range lands. Fix: render every tile and hide off-page ones with CSS.
8. **Preview env vars are incomplete** — only `ADMIN_HOST` and `STAFF_EMAILS` exist. A branch
   preview therefore builds an *empty catalog* (env unset → empty + warn, build still
   passes), which looks like a broken site rather than a missing config.
9. **Turnstile on the quote form** — still not implemented; `form-guard.ts` only mentions it
   in a comment. Current defence is honeypot + signed time-trap + per-IP rate limit, which
   has held so far.
10. **Price sort degrades silently** — a tile whose price lookup fails is dropped, so a
    signed-in buyer sees the *guest* "Trade pricing — sign in" label on it and the ordering is
    quietly partial. Related: `price-desc` sorts unknown prices to the **top**.
11. **Confirm the `www` → apex 308** in a browser (curl only ever sees the challenge).
12. **`DNS-SETUP.md` is stale** — it describes the old project's redirect setup; record values
    are still correct.
13. **Trademark check.** An established Japanese brand **"Button Works" (ボタンワークス)**
    exists in the same workwear-button niche. This has been open since the pilot began, and
    go-live is the point where it stops being theoretical.

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
