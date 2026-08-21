# Traffic monitoring — handover

Goal: detect a crawler wave **while there is still time to act**, rather than discovering it
when Vercel pauses the account and the site starts serving `402`. That is what happened on
2026-08-18 (see [MIGRATION.md](MIGRATION.md)).

---

## What can be measured headlessly, and what cannot

Measured empirically on 2026-08-21 against the live Hobby project.

| Signal | CLI only? | How |
|---|---|---|
| **Billable request rate** (req/min → projected/day) | ✅ | `vercel logs <domain> --follow --json` — middleware runs on every request that reaches the app, one JSON line each |
| Top request paths, status codes, cache hit ratio | ✅ | same source |
| Deployment health | ✅ | `vercel ls` |
| Firewall rule still armed / no unpublished drafts | ✅ | `vercel firewall rules list`, `vercel firewall diff` |
| Liveness | ✅ | `curl` — but see the 429 note below |
| **Quota %** (Edge Requests / Fluid CPU / Fast Origin Transfer vs limits) | ❌ | `GET /v1/usage` returns `plan_upgrade_required` — **Pro/Enterprise only**. No public alternative found |
| **Attribution** — which ASN / IP / User-Agent | ❌ | Not present in the log lines; no traffic-analytics API. Firewall dashboard only |
| Allowed vs Denied vs Challenged counts | ❌ | Firewall dashboard only |

Endpoints probed and ruled out: `/v1/usage` (Pro-gated), `/v1/security/firewall/traffic`
(404), `/v1/observability/metrics` (404), `/v1/analytics/usage` (404),
`/v1/security/firewall/events` (200 but always empty — it lists *persistent action* blocks,
which we do not use). `vercel firewall overview` fails on Hobby with "IP Bypass is
unavailable for this plan" — a CLI bug, not a real problem.

### Why CLI-only is still enough for the alarm

The counter that suspends an account is **billable** traffic. Vercel's docs: *"WAF deny,
challenge, or rate-limit mitigated traffic does not incur CDN Requests or Fast Data
Transfer,"* and *"requests that pass a challenge and continue to your application count
toward normal usage."*

Verified this directly: 12 `curl` requests to `/en/catalog` produced **zero** log lines,
because Bot Protection challenged them at the edge before middleware ran. So:

- traffic that is denied or challenged → invisible to the sampler **and free**
- traffic that gets through → billed → **visible to the sampler**

The sampler therefore measures precisely the traffic that can pause the account. A browser
is needed to answer *who* is responsible once the alarm fires — which is a human-in-the-loop
moment anyway.

⚠️ Corollary: **"0 requests" is not proof nobody is knocking.** It means nobody is knocking
*and getting through*. If you want to know whether crawlers are hammering the door, that is
the firewall dashboard.

---

## The sampler

`scripts/traffic-sample.mjs` — no dependencies beyond the Vercel CLI.

```bash
node scripts/traffic-sample.mjs --window 300          # 5-minute sample
node scripts/traffic-sample.mjs --window 60 --domain hammondbutton.works
```

Emits JSON and sets an exit code: `0` normal · `1` elevated · `2` alarm · `3` could not
sample (usually: CLI not logged in).

Thresholds are derived from the Hobby ceiling. 1,000,000 Edge Requests **and** 1,000,000
Function Invocations per rolling 30 days; middleware runs once per request so both tick
together — roughly **33,000 requests/day** sustainable. The script warns at 25% of that and
alarms at 60%, because the goal is lead time, not precision.

It also flags two crawler-shaped patterns that raw volume misses:

- **cache hit ratio below 80%** — something is rendering per request, which is the exact
  failure that burned the old account, even when the request count still looks harmless.
- **>70% of traffic on a single path** — crawler-shaped rather than human-shaped.

Caveat: it is a *sample*. A short window can miss bursty traffic. A quiet sample is weak
evidence; a loud one is strong.

---

## Running it on an always-on machine (the Mac Mini)

Nothing here needs a GUI or Chrome. Chrome only adds quota % and attribution.

### One-time setup

```bash
# 1. Node 18+ (Node 24 is what this was built against)
node --version

# 2. Vercel CLI
npm i -g vercel

# 3. Authenticate as taro.rmkn@gmail.com — this is interactive and only you can do it.
#    On a headless box it prints a URL + device code you can open on any other machine.
vercel login

# 4. The repo (for the script; it does not need to be a full checkout, but this is simplest)
git clone https://github.com/taro-arumakan/hammondbuttonworks.git
cd hammondbuttonworks

# 5. Link to the project so `vercel` commands resolve without --scope
vercel link --project hammondbuttonworks --scope sniarti-fi1 --yes

# 6. Smoke test
node scripts/traffic-sample.mjs --window 60
```

### Keeping it authenticated

`vercel login` writes a token to
`~/Library/Application Support/com.vercel.cli/auth.json` (macOS) with an `expiresAt` and a
`refreshToken`; the CLI refreshes it on use, so a box that runs daily stays logged in.

For genuinely unattended operation — or if you ever move this to a cloud VM — create a
**Vercel Access Token** (Account Settings → Tokens) and set `VERCEL_TOKEN` in the
environment instead. It does not expire on an idle schedule. Create it yourself and paste it
directly into the machine's environment; do not route it through a chat transcript.

### If you run it on a cloud VM instead

Everything above works unchanged on Linux (auth.json lives at
`~/.local/share/com.vercel.cli/auth.json`). Requirements are just: Node 18+, the Vercel CLI,
`VERCEL_TOKEN` or a completed `vercel login`, and outbound HTTPS. No browser, no GUI, no
repo checkout strictly required — the single file `scripts/traffic-sample.mjs` is enough.

---

## The scheduled-task prompt

Create a daily scheduled task on the Mac Mini and paste this as the prompt. It is written to
be self-contained — a scheduled run has no memory of the conversation that produced it.

````text
Daily traffic + health check for **Hammond Button Works** (https://hammondbutton.works).

BACKGROUND (you have no memory of previous runs):
- Repo: ~/hammondbuttonworks — read MIGRATION.md and MONITORING.md for full context.
- Hosting: Vercel **Hobby**, team `sniarti-fi1`, project `hammondbuttonworks`.
- The PREVIOUS Vercel account was **paused on 2026-08-18** after Meta's crawlers
  (`meta-webindexer` ~96k/day, `meta-externalagent` ~33k/day, all from Facebook's AS32934)
  drove Fluid Active CPU to 301% of the Hobby allowance. The site was migrated to a fresh
  account on 2026-08-21. The point of this check is to catch a repeat EARLY — waiting for
  the site to serve 402 is a post-mortem, not an alarm.
- Defences: WAF rule "Deny Meta crawler ASN" (AS32934 AND path != /robots.txt → Deny);
  AI Bots ruleset = Deny; Bot Protection = Challenge; robots.txt disallows all four
  documented Meta crawlers.

RUN THESE:

1. Traffic sample — the primary signal:
       cd ~/hammondbuttonworks && node scripts/traffic-sample.mjs --window 300
   It prints JSON and exits 0 normal / 1 elevated / 2 alarm / 3 could not sample.
   Read `status`, `projectedPerDay`, `percentOfBudget`, `cacheRate`, `topPaths`, `notes`.

   Interpretation that matters: this measures BILLABLE traffic only. Requests that the
   firewall denies or challenges never reach the middleware that produces these logs, and
   they are also unbilled. So `requests: 0` means "nothing is getting through", NOT
   "nobody is knocking". Do not report it as proof the crawlers are gone.

2. Deployment health: `vercel ls hammondbuttonworks` — latest Production should be `Ready`.

3. Firewall still armed: `vercel firewall rules list` must show "Deny Meta crawler ASN"
   as Enabled, and `vercel firewall diff` should report no unpublished drafts.
   (`vercel firewall overview` errors on Hobby — CLI bug, ignore it.)

4. Liveness: curl -sS -o /dev/null -w '%{http_code}' https://hammondbutton.works/en
   **429 = HEALTHY** — Bot Protection challenges non-browser clients, so curl always gets
   429 + `x-vercel-mitigated: challenge`. That proves the edge is serving.
   402 = ALARM, the account has been paused. 5xx/timeout = ALARM.
   200 = Bot Protection was switched off (not an error, but say so).

5. OPTIONAL, only if browser tools are available and logged into the NEW account
   (`tarormkn-7023` / team `sniarti-fi1`): read
   https://vercel.com/sniarti-fi1/hammondbuttonworks/firewall/traffic?range=1d for
   Allowed/Denied/Challenged, Top AS Names and Top User Agents, and
   https://vercel.com/sniarti-fi1/~/usage for Edge Requests, Fast Origin Transfer and
   Fluid Active CPU against their Hobby limits (1M / 10GB / 4h, trailing 30 days).
   If you land on a 404 saying you are logged in as a different user, say so plainly and
   skip this step — do not guess at numbers.

FLAG AS UNUSUAL:
- Sampler status `elevated` or `alarm`.
- Cache rate below 80% with a meaningful number of requests — means per-request rendering.
- One path taking the large majority of traffic — crawler-shaped.
- Any usage metric above 50% of its Hobby limit (if step 5 ran).
- A bot-looking User-Agent arriving from a NON-Facebook ASN — that is a new crawler the
  AS32934 rule would not catch, and the most likely way this repeats.

OUTPUT: be brief. If everything is normal, one line:
`✅ HBW normal — <projected/day> req/day (<n>% of budget), cache <n>%, deploy Ready, firewall armed.`
Expand only when something is off, and when you do, recommend a concrete action (an ASN to
deny, a User-Agent to add to robots.txt, a rule to add) rather than just reporting numbers.

DO NOT change firewall rules, DNS, env vars or deployments on your own. Report and
recommend; the owner decides.
````

---

## When the alarm fires

1. Open the firewall traffic dashboard — that is the only place that names the actor:
   https://vercel.com/sniarti-fi1/hammondbuttonworks/firewall/traffic?range=1d
2. Identify the **AS name** and **User-Agent** driving the volume.
3. If it is a new ASN, add a second custom rule (Hobby allows 3):
   ```bash
   vercel firewall rules add "Deny <name> ASN" \
     --condition '{"type":"geo_as_number","op":"eq","value":"<ASN>"}' \
     --condition '{"type":"path","op":"eq","value":"/robots.txt","neg":true}' \
     --action deny
   vercel firewall diff      # review before it goes live
   vercel firewall publish --yes
   ```
   Keep the `/robots.txt` exception: it is the one page that can tell a compliant crawler to
   stop, and denying it means the bot keeps knocking forever. We learned that in July.
4. Add the crawler's robots.txt token to `META_CRAWLERS` in `src/app/robots.ts` if it
   publishes one — the firewall is enforcement, robots.txt is the request that makes
   enforcement unnecessary.
5. If the volume is from a **residential/proxy** spread rather than one ASN, ASN blocking
   will not work. The lever then is the free Hobby rate-limit rule (1 allowed), keyed by IP
   or JA4 fingerprint.
