"use client";

import { useMemo, useSyncExternalStore } from "react";
import { HINT_COOKIE, decodeHint, type AccountHint } from "./hint-cookie";

/**
 * Client-side "who am I?" — reads the display-hint cookie set at login
 * (see hint-cookie.ts). This is what lets the header / price tiles / order
 * panel personalise on STATICALLY-served pages without any server round-trip:
 * guests cost zero function invocations, and bots (which don't run JS) cost
 * nothing at all.
 *
 * Hydration-safe: the server snapshot is always null (static HTML renders the
 * guest state), and the real value appears after hydration. Signed-in users
 * see a brief guest flash on first paint — accepted trade-off of cacheability.
 */

function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(`${HINT_COOKIE}=`)) return part.slice(HINT_COOKIE.length + 1);
  }
  return null;
}

// Cookies have no change event; login/logout are full navigations, so a
// focus/visibility re-read covers the "signed in from another tab" case.
function subscribe(cb: () => void): () => void {
  window.addEventListener("focus", cb);
  document.addEventListener("visibilitychange", cb);
  return () => {
    window.removeEventListener("focus", cb);
    document.removeEventListener("visibilitychange", cb);
  };
}

/** Non-hook read for plain modules (price-batcher's cache-owner check). */
export function readAccountHint(): AccountHint | null {
  return decodeHint(readCookie());
}

export function useAccountHint(): AccountHint | null {
  // Snapshot is the raw cookie string (stable by value), parsed via useMemo —
  // useSyncExternalStore requires referentially-stable snapshots.
  const raw = useSyncExternalStore(subscribe, readCookie, () => null);
  return useMemo(() => decodeHint(raw), [raw]);
}

/**
 * Self-heal for a stale hint: the signed session cookie expired (or was
 * revoked) but the hint survived, so a gated API answered 401. Dropping the
 * hint flips the whole UI back to the guest state on next render.
 */
export function dropAccountHint(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${HINT_COOKIE}=; path=/; max-age=0`;
  // Nudge subscribers — the cookie write itself emits no event.
  window.dispatchEvent(new Event("focus"));
}

export type { AccountHint };
