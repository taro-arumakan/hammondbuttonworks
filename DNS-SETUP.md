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
2. [ ] In Onamae DNS, add what Vercel asks for (current Vercel values):
       - `A`  host **blank/@**  → `76.76.21.21`
       - `CNAME` host **www** → `cname.vercel-dns.com`
3. [ ] Wait for Vercel to show the domain **Valid / SSL issued** (auto certificate).
4. [ ] Confirm `https://hammondbutton.works` loads the site.

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

1. [ ] Resend → **Domains → Add Domain** → `send.hammondbutton.works`.
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
- [ ] `EMAIL_FROM` = `Hammond Button Works <no-reply@hammondbutton.works>`
- [ ] `QUOTE_INBOX` = `info@alvana.jp` _(or `info@hammondbutton.works` once the
      alias is live)_

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
| A     | _(blank/@)_                | `76.76.21.21`                           | Vercel        |
| CNAME | `www`                      | `cname.vercel-dns.com`                  | Vercel        |
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
