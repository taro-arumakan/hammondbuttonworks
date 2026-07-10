# DNS & email setup — hammondbutton.works

Runbook for wiring the registered domain (`hammondbutton.works`, registered at
**Onamae.com**) to: the **Vercel** site, **Google Workspace** for receiving mail
(as a domain alias on the existing alvana.jp Workspace), and **Resend** for the
app's outbound magic-link / quote email.

## Ground rules (read first)

- **Keep DNS at Onamae.** Do **not** switch the nameservers to Vercel — if you
  delegate NS to Vercel, Onamae's zone (where the Google MX lives) stops being
  authoritative and mail breaks. Leave NS = Onamae; add every record below in
  Onamae's **DNS レコード設定**.
- **Onamae host-field convention:** enter the **label only**, not the full name.
  Root/apex = leave blank (or `@`). A subdomain record for `send.hammondbutton.works`
  → host = `send`. DMARC → host = `_dmarc`. Never type the full `…hammondbutton.works`
  into the host field.
- **Remove Onamae's defaults first.** Onamae often pre-populates a parking `A`
  record and/or its own `MX`/転送 (forwarding) for the new domain. Delete those so
  they don't fight the records below.
- The apex can hold an `A` (web) **and** `MX` (mail) at the same time — different
  record types, no conflict.
- Each of the three services (Vercel / Google / Resend) **generates its own exact
  values** when you add the domain in that service's console. Add the domain there
  first, then paste what it shows into Onamae. Values marked _(from console)_ below
  are per-account — copy them, don't guess.

---

## A. Web — point the domain at Vercel

1. [ ] Vercel → Project → **Settings → Domains → Add** → `hammondbutton.works`
       (and add `www.hammondbutton.works`, set to redirect to the apex).
2. [ ] In Onamae DNS, add what Vercel asks for (use the value Vercel's Domains
       page shows — as of 2026-07 it's the new IP-range address; the older
       `76.76.21.21` / `cname.vercel-dns.com` still work but are being phased out):
       - `A`  host **blank/@**  → `216.198.79.1`  _(Vercel-recommended; 76.76.21.21 also works)_
       - `CNAME` host **www** → `cname.vercel-dns.com`  _(only needed if you add `www` as a domain in the Vercel project)_
3. [ ] Wait for Vercel to show the domain **Valid / SSL issued** (auto certificate).
4. [ ] Confirm `https://hammondbutton.works` loads the site.

### A2. Staff admin host (`admin.hammondbutton.works`)

The admin toolset is the **same app + deploy** (so the pricing/order code can't fork),
served only on its own hostname. Order matters:

1. [ ] Vercel env: set **`ADMIN_HOST=admin.hammondbutton.works`** and `STAFF_EMAILS`,
       then redeploy. Do this FIRST — until the CNAME exists this makes `/admin` 404
       everywhere (fail-closed), and it stops the admin surface being served on the
       public host.
2. [ ] Vercel → Settings → Domains → **Add `admin.hammondbutton.works`**. Vercel then
       shows the exact record it wants — use that value verbatim.
3. [x] Onamae DNS: `CNAME` host **admin** → the per-project target Vercel shows
       (ours: `e00d81113707ae98.vercel-dns-017.com`). The generic `cname.vercel-dns.com`
       also resolves, but paste Vercel's value verbatim. No `MX` on this subdomain — no
       mail lives there, and the Workspace alias on the apex is unaffected. A CNAME can't
       coexist with other records at the same name.
4. [x] Verify: `https://admin.hammondbutton.works/admin/login` serves; and on the public
       host `https://hammondbutton.works/admin` returns **404**.

**Done 2026-07-11** — cert issued (Let's Encrypt, expires 2026-10-08). Verified: all of
`/admin*` + `/api/admin*` 404 on the public host; the admin host redirects anonymous
requests to `/admin/login` and 401s `/api/admin/*`; the storefront doesn't render on the
admin host. Two bugs surfaced and were fixed during this verification:

- the staff magic link was built from `NEXT_PUBLIC_SITE_URL`, so it pointed at the public
  host and 404'd → `adminBaseUrl()` (`src/lib/url.ts`);
- the middleware `matcher` skips dotted paths, and a token is `base64url.base64url`, so
  `/admin/signin/<token>` bypassed the host gate → `/admin/:path*` matched explicitly.

---

## B. Receiving mail — Google Workspace domain alias

Do this as a **Super Admin** at `admin.google.com` (see note at bottom if
`support@alvana.jp` isn't a Super Admin).

1. [ ] Admin console → **Account → Domains → Manage domains → Add a domain**.
2. [ ] Enter `hammondbutton.works`, choose **User alias domain** (free; every
       existing alvana user automatically gains `name@hammondbutton.works` — no
       new seats). *(Choose "Secondary domain" instead only if you want separate
       HBW logins/users.)*
3. [ ] Google shows a **verification `TXT`** — add in Onamae:
       - `TXT` host **blank/@** → `google-site-verification=…` _(from console)_
4. [ ] Back in the console, click **Verify**.
5. [ ] Add the **MX** record Google shows — modern setups use a single record:
       - `MX` host **blank/@** → `smtp.google.com`  priority **1** _(use exactly
         what the console lists; some accounts still get the 5-record aspmx set)_
6. [ ] Add the Google **SPF** so alvana/HBW mail from Workspace passes:
       - `TXT` host **blank/@** → `v=spf1 include:_spf.google.com ~all`
       - ⚠️ Only **one** SPF (`v=spf1…`) TXT may exist at the apex. If alvana
         already manages this domain's SPF elsewhere, merge — don't add a second.
7. [ ] (Optional) In the alvana user's Gmail → **Settings → Accounts → Send mail
       as** → add `info@hammondbutton.works` so you can also *send* from the HBW
       identity, not just receive.

---

## C. Sending mail — Resend (app magic-link + quote email)

Send from a **subdomain** (`send.hammondbutton.works`) so app mail has its own
reputation and can't disturb the Workspace inbox.

1. [ ] Resend → **Domains → Add Domain** → `send.hammondbutton.works`, Region
       **Tokyo (ap-northeast-1)**. In Advanced options, **uncheck "Enable click
       tracking"** — the emails are one-time magic-login links and you don't want
       the token URL rewritten through a tracking redirect (also skips a tracking
       CNAME). Leave Custom Return-Path = `send`. NB: the verified domain is the
       subdomain, so the **From address must be `…@send.hammondbutton.works`**
       (that `send.` is visible to recipients). To send From the bare
       `…@hammondbutton.works` instead, add the apex domain in Resend — at the cost
       of sharing sending reputation with the Workspace inbox.
2. [ ] Resend shows 2–3 records — add each in Onamae under the `send` label
       _(all values from the Resend console; region-dependent)_:
       - `MX`  host **send** → `feedback-smtp.<region>.amazonses.com` priority **10**
       - `TXT` host **send** → `v=spf1 include:amazonses.com ~all`  (Resend SPF)
       - `TXT`/`CNAME` host **resend._domainkey.send** → DKIM value _(from console)_
3. [ ] Click **Verify** in Resend until all records go green.
4. [ ] Create an **API key** (Resend → API Keys) for the Vercel env var (Part E).

---

## D. DMARC (do this once B and C are in place)

Gmail/Yahoo increasingly junk mail without DMARC, and the whole login flow depends
on those emails landing.

1. [ ] Add in Onamae:
       - `TXT` host **_dmarc** →
         `v=DMARC1; p=none; rua=mailto:postmaster@alvana.jp; adkim=r; aspf=r`
2. [ ] Start at `p=none` (monitor only). After a couple of weeks of clean reports,
       tighten to `p=quarantine`.

---

## E. Vercel environment variables

Project → Settings → Environment Variables (Production) → add / update, then
**redeploy**:

- [ ] `NEXT_PUBLIC_SITE_URL` = `https://hammondbutton.works`
- [ ] `RESEND_API_KEY` = _(the key from Part C.4)_
- [ ] `EMAIL_FROM` = `Hammond Button Works <no-reply@send.hammondbutton.works>`
      _(must match the domain verified in Resend — the `send.` subdomain here; use
      `no-reply@hammondbutton.works` only if you verified the apex instead)_
- [ ] `CONTACT_INBOX` = `contact@hammondbutton.works` _(a Google Group fanning out
      to info@alvana + your own inbox; the general inbound-business address —
      quote/contact-form mail and, later, order notifications)_

Until `RESEND_API_KEY` is set, magic links print to the Vercel function logs
instead of emailing (see `src/lib/email.ts`).

---

## F. Verify end-to-end

- [ ] `https://hammondbutton.works` loads over HTTPS.
- [ ] Send a test to `hello@hammondbutton.works` from an outside address → it lands
      in the alvana inbox (alias working).
- [ ] On the site, `/login` with a real trade email → the magic link now **arrives
      by email** (not just the logs) and isn't in spam.
- [ ] Check the received magic-link email headers show `SPF: pass`, `DKIM: pass`,
      `DMARC: pass`.

---

## Record summary (tick as you add them in Onamae)

| Type  | Host (Onamae label)        | Value                                   | Source        |
|-------|----------------------------|-----------------------------------------|---------------|
| A     | _(blank/@)_                | `216.198.79.1` _(76.76.21.21 also works)_ | Vercel      |
| CNAME | `www`                      | `cname.vercel-dns.com`                  | Vercel        |
| CNAME | `admin`                    | `e00d81113707ae98.vercel-dns-017.com` _(staff toolset; set `ADMIN_HOST` first)_ | Vercel _(console)_ |
| TXT   | _(blank/@)_                | `google-site-verification=…`            | Google _(console)_ |
| MX    | _(blank/@)_                | `smtp.google.com` (prio 1)              | Google _(console)_ |
| TXT   | _(blank/@)_                | `v=spf1 include:_spf.google.com ~all`   | Google        |
| MX    | `send`                     | `feedback-smtp.<region>.amazonses.com` (prio 10) | Resend _(console)_ |
| TXT   | `send`                     | `v=spf1 include:amazonses.com ~all`     | Resend        |
| TXT/CNAME | `resend._domainkey.send` | DKIM value                            | Resend _(console)_ |
| TXT   | `_dmarc`                   | `v=DMARC1; p=none; rua=mailto:postmaster@alvana.jp; adkim=r; aspf=r` | — |

---

## If `support@alvana.jp` isn't a Super Admin

Part B needs **Super Admin**. Check: `admin.google.com` → if you can reach
**Account → Domains → Manage domains** with an **Add a domain** button, you're set.
If not, the alvana Workspace Super Admin must either add the domain, or grant
`support@` the Super Admin role (Admin console → Account → **Admin roles**). Parts
A, C, D, E don't need Workspace admin at all — only registrar (Onamae), Vercel, and
Resend access.

## Sequencing notes

- Order: **A → B → C → D → E → F.** A can be done immediately. B needs Super Admin.
  C needs a Resend account. D depends on B+C existing. E flips the app to real email.
- DNS changes propagate in minutes-to-hours (Onamae TTL). If a service's "Verify"
  fails right after adding a record, wait and retry — it's usually propagation.
