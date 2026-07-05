"use client";

import { useSyncExternalStore } from "react";

/**
 * Client-side cart store (localStorage). Holds ONLY selection data — slug,
 * sku, qty, engraving flag, and display labels. Prices are never stored or
 * computed client-side: the cart page asks the gated /api/cart/quote for
 * them, and /api/checkout re-derives everything server-side at order time.
 *
 * Replaces the never-wired Snipcart adapter (checkout is a Shopify draft
 * order + bank transfer — no online payment).
 */

export type CartItem = {
  slug: string;
  sku: string;
  name: string; // display only — server re-resolves authoritative data
  color: string;
  sizeMm: number;
  qty: number;
  engraving: boolean;
};

const KEY = "hbw_cart";
const EVENT = "hbw-cart-change";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.sku && i.qty > 0) : [];
  } catch {
    return [];
  }
}

let cache: CartItem[] = [];
let cacheRaw: string | null = null;

function snapshot(): CartItem[] {
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = read();
  }
  return cache;
}

function write(items: CartItem[]) {
  window.localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb); // other tabs
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

const EMPTY: CartItem[] = [];

/** Live cart contents (re-renders on any cart change, incl. other tabs). */
export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}

/** Same sku + engraving flag merges into one line. */
export function addToCart(item: CartItem) {
  const items = [...read()];
  const existing = items.find((i) => i.sku === item.sku && i.engraving === item.engraving);
  if (existing) existing.qty += item.qty;
  else items.push(item);
  write(items);
}

export function updateQty(sku: string, engraving: boolean, qty: number) {
  const items = read()
    .map((i) => (i.sku === sku && i.engraving === engraving ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);
  write(items);
}

export function removeFromCart(sku: string, engraving: boolean) {
  write(read().filter((i) => !(i.sku === sku && i.engraving === engraving)));
}

export function clearCart() {
  write([]);
}
