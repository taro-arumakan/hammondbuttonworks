"use client";

import { dropAccountHint, readAccountHint } from "./account-hint";

/**
 * Client-side from-price fetcher for catalog tiles, with batching.
 *
 * Every `TilePrice` on a page (≤ 40 on a listing page, 8 on home) asks for its
 * colourway's from-price; this module coalesces all requests raised in the
 * same tick into ONE POST to the gated /api/price — so a signed-in page view
 * costs a single function invocation, and a guest page view costs zero (the
 * hook never calls this without an account hint).
 *
 * Results are cached for the browsing session: paging back and forth through
 * the catalog re-mounts tiles but re-fetches nothing.
 *
 * On 401 (session expired but the display hint survived) the hint is dropped,
 * flipping the UI back to the guest state — see account-hint.ts.
 */

export type FromPrice = { amount: number; currency: string };

type Waiter = (price: FromPrice | null) => void;

const BATCH_MAX = 60; // keep in sync with the /api/price batch schema cap
const FLUSH_MS = 25;

const cache = new Map<string, FromPrice | null>();
const pending = new Map<string, { slug: string; color: string; waiters: Waiter[] }>();
let timer: ReturnType<typeof setTimeout> | null = null;
// Whose prices the cache holds. Prices are class-dependent, so a cache filled
// for buyer A must not survive into buyer B's session in a long-lived tab
// (sign-out/sign-in from another tab of a shared machine).
let cacheOwner: string | null = null;

function keyOf(slug: string, color: string): string {
  return `${slug}::${color}`;
}

export function requestFromPrice(slug: string, color: string): Promise<FromPrice | null> {
  const owner = readAccountHint()?.email ?? null;
  if (owner !== cacheOwner) {
    cache.clear();
    cacheOwner = owner;
  }
  const key = keyOf(slug, color);
  if (cache.has(key)) return Promise.resolve(cache.get(key) ?? null);

  return new Promise<FromPrice | null>((resolve) => {
    const entry = pending.get(key);
    if (entry) {
      entry.waiters.push(resolve);
      return;
    }
    pending.set(key, { slug, color, waiters: [resolve] });
    if (!timer) timer = setTimeout(flush, FLUSH_MS);
  });
}

async function flush(): Promise<void> {
  timer = null;
  const entries = [...pending.values()];
  pending.clear();

  for (let i = 0; i < entries.length; i += BATCH_MAX) {
    const chunk = entries.slice(i, i + BATCH_MAX);
    let priceByKey = new Map<string, FromPrice>();
    try {
      const res = await fetch("/api/price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tiles: chunk.map(({ slug, color }) => ({ slug, color })) }),
      });
      if (res.status === 401) {
        dropAccountHint(); // stale hint — session is gone; back to guest UI
      } else if (res.ok) {
        const data = (await res.json()) as {
          prices?: { slug: string; color: string; amount: number; currency: string }[];
        };
        priceByKey = new Map(
          (data.prices ?? []).map((p) => [
            keyOf(p.slug, p.color),
            { amount: p.amount, currency: p.currency },
          ]),
        );
      }
    } catch {
      /* network hiccup → resolve null; tiles keep their neutral tag */
    }
    for (const { slug, color, waiters } of chunk) {
      const key = keyOf(slug, color);
      const price = priceByKey.get(key) ?? null;
      // Only cache positive results — a transient failure shouldn't pin a
      // tile to the guest tag for the whole session.
      if (price) cache.set(key, price);
      for (const w of waiters) w(price);
    }
  }
}
