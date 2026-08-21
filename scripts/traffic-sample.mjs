#!/usr/bin/env node
/**
 * Headless traffic sampler for hammondbutton.works.
 *
 * WHY THIS EXISTS: the previous Vercel account was paused (2026-08-18) when Meta's
 * crawlers walked the catalog at ~139k requests/day. Waiting for the site to start
 * serving 402 is a post-mortem, not an alarm — this samples live request volume so a
 * crawler wave is visible while there is still time to act.
 *
 * HOW: every request to the site executes the edge middleware, and `vercel logs`
 * emits one JSON line per middleware invocation. Counting those lines over a known
 * wall-clock window gives a request rate, which extrapolates to a daily projection we
 * can hold against the Hobby budget.
 *
 * WHAT IT CANNOT SEE — be honest about this when reading the output:
 *   - Requests DENIED by the firewall never reach middleware, so they are invisible
 *     here. That is fine: denied traffic is unbilled, so it cannot pause the account.
 *     It does mean "0 requests" is not proof that nobody is knocking.
 *   - The log line carries no IP, ASN or User-Agent, so this says a wave is happening
 *     and which paths it is hitting, never *who*. Attribution needs the firewall
 *     dashboard (browser).
 *   - It is a SAMPLE. A short window can miss bursty traffic; a long one costs nothing
 *     but wall-clock. Treat a quiet sample as weak evidence, a loud one as strong.
 *
 * Usage:  node scripts/traffic-sample.mjs [--window 300] [--domain hammondbutton.works]
 * Exit:   0 = normal · 1 = elevated (investigate) · 2 = alarm · 3 = could not sample
 */
import { spawn } from "node:child_process";

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const WINDOW_S = Number(arg("window", 300));
const DOMAIN = arg("domain", "hammondbutton.works");

/**
 * Hobby includes 1,000,000 Edge Requests and 1,000,000 Function Invocations per
 * 30-day rolling window. Middleware runs on every request, so both counters tick
 * once per request: ~33,000 requests/day is the sustainable ceiling for EITHER.
 * We alarm well below it — the point is lead time, not precision.
 */
const DAILY_BUDGET = 33_000;
const ELEVATED = 0.25 * DAILY_BUDGET; // ~8k/day projected
const ALARM = 0.60 * DAILY_BUDGET; // ~20k/day projected

function sample() {
  return new Promise((resolve) => {
    const rows = [];
    const proc = spawn(
      "vercel",
      ["logs", DOMAIN, "--follow", "--json", "--environment", "production"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let buf = "";
    let stderr = "";
    proc.stdout.on("data", (chunk) => {
      buf += chunk.toString();
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("{")) continue;
        try {
          rows.push(JSON.parse(t));
        } catch {
          /* partial or non-JSON status line */
        }
      }
    });
    proc.stderr.on("data", (c) => (stderr += c.toString()));
    const timer = setTimeout(() => proc.kill("SIGTERM"), WINDOW_S * 1000);
    proc.on("close", (code) => {
      clearTimeout(timer);
      resolve({ rows, stderr, code });
    });
    proc.on("error", (err) => {
      clearTimeout(timer);
      resolve({ rows, stderr: String(err), code: -1 });
    });
  });
}

const startedAt = Date.now();
const { rows, stderr } = await sample();
const elapsed = Math.max(1, (Date.now() - startedAt) / 1000);

// `vercel logs` replays a short buffer of recent entries before it starts following.
// Those predate our window and would inflate the rate, so rate is computed only from
// entries stamped after we started listening.
const inWindow = rows.filter((r) => typeof r.timestamp === "number" && r.timestamp >= startedAt);
const perMin = (inWindow.length / elapsed) * 60;
const perDay = Math.round((inWindow.length / elapsed) * 86_400);

const authProblem = /not authenticated|log in|credentials|token/i.test(stderr);
if (authProblem) {
  console.log(
    JSON.stringify(
      { ok: false, reason: "vercel CLI is not authenticated — run `vercel login`", stderr: stderr.slice(0, 400) },
      null,
      2,
    ),
  );
  process.exit(3);
}

const tally = (fn) => {
  const m = new Map();
  for (const r of inWindow) {
    const k = fn(r) ?? "(none)";
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const statuses = Object.fromEntries(tally((r) => r.responseStatusCode));
const caches = Object.fromEntries(tally((r) => r.cache));
const topPaths = tally((r) => r.requestPath).slice(0, 8);

// A healthy guest/bot request is served from the page cache. A high share of misses
// means something is rendering per request — the exact failure that burned the old
// account — even if the raw request count still looks harmless.
const cached = inWindow.filter((r) => ["HIT", "PRERENDER", "STALE"].includes(r.cache)).length;
const cacheRate = inWindow.length ? cached / inWindow.length : 1;

let status = "normal";
let exit = 0;
const notes = [];
if (perDay >= ALARM) {
  status = "alarm";
  exit = 2;
  notes.push(`projected ${perDay.toLocaleString()} req/day is ${Math.round((perDay / DAILY_BUDGET) * 100)}% of the ~${DAILY_BUDGET.toLocaleString()}/day Hobby ceiling`);
} else if (perDay >= ELEVATED) {
  status = "elevated";
  exit = 1;
  notes.push(`projected ${perDay.toLocaleString()} req/day with no real customers yet`);
}
if (inWindow.length >= 20 && cacheRate < 0.8) {
  status = status === "normal" ? "elevated" : status;
  exit = Math.max(exit, 1);
  notes.push(`only ${Math.round(cacheRate * 100)}% of requests served from cache — something is rendering per request`);
}
const oneHot = topPaths[0];
if (oneHot && inWindow.length >= 20 && oneHot[1] / inWindow.length > 0.7) {
  notes.push(`${Math.round((oneHot[1] / inWindow.length) * 100)}% of traffic on a single path (${oneHot[0]}) — crawler-shaped, not human-shaped`);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      status,
      sampledAt: new Date(startedAt).toISOString(),
      windowSeconds: Math.round(elapsed),
      requests: inWindow.length,
      perMinute: Number(perMin.toFixed(1)),
      projectedPerDay: perDay,
      dailyBudget: DAILY_BUDGET,
      percentOfBudget: Math.round((perDay / DAILY_BUDGET) * 100),
      cacheRate: Number(cacheRate.toFixed(2)),
      statuses,
      caches,
      topPaths,
      notes,
      blindSpots: "firewall-denied requests are invisible here (and unbilled); no IP/ASN/User-Agent in these logs",
    },
    null,
    2,
  ),
);
process.exit(exit);
