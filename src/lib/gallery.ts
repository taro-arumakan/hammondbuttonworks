import type { ShopifyProduct } from "./shopify";

/** One product-page gallery frame. Price-free, so safe to hand to a client island. */
export type GalleryImage = { url: string; color: string; angle: string };

/** Shoot order: the importer's `_ANGLE_ORDER` (front, side, ¾, back). */
const ANGLE_ORDER = ["front", "side", "three-quarter", "back"];

/** The importer's `slugify`: case kept, runs of anything else → one "-". */
function slugify(value: string): string {
  return value.replace(/[^A-Za-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "x";
}

/**
 * The frames to show on a product page, grouped by colour in option order,
 * each colour's frames in shoot order (front, side, ¾, back).
 *
 * The importer names every media `hbw-<code>-<colour>-<size>-<angle>-<digest>.jpg`
 * and uploads EVERY size of every colour. Sizes of one colour are the same
 * button at a different scale, so showing them all would mean near-duplicate
 * runs of thumbnails; each colour shows the one size its variant image (the
 * catalog tile photo) was taken from.
 *
 * Products whose media don't follow that naming (hand uploads) fall back to
 * every media in Shopify order, untagged by colour.
 */
export function productGallery(product: ShopifyProduct): GalleryImage[] {
  const code = slugify(product.name).toLowerCase();
  const frames: { url: string; color: string; size: string; angle: string }[] = [];

  for (const m of product.media) {
    const alt = m.alt.toLowerCase();
    for (const color of product.colors) {
      const prefix = `hbw-${code}-${slugify(color).toLowerCase()}-`;
      if (!alt.startsWith(prefix)) continue;
      // Size never contains "-" and angles never contain digits, so a shorter
      // colour that prefixes a longer one ("dark" / "dark-brown") cannot match.
      const rest = /^([a-z0-9.]+)-([a-z-]+)-[0-9a-f]+\.[a-z]+$/.exec(alt.slice(prefix.length));
      if (rest) frames.push({ url: m.url, color, size: rest[1], angle: rest[2] });
    }
  }

  if (frames.length === 0) {
    return product.media.map((m) => ({ url: m.url, color: "", angle: "" }));
  }

  const out: GalleryImage[] = [];
  for (const color of product.colors) {
    const mine = frames.filter((f) => f.color === color);
    if (mine.length === 0) continue;
    const tileUrl = product.variants.find((v) => v.color === color && v.image)?.image;
    const size = mine.find((f) => f.url === tileUrl)?.size ?? mine[0].size;
    const rank = (a: string) => {
      const i = ANGLE_ORDER.indexOf(a);
      return i === -1 ? ANGLE_ORDER.length : i;
    };
    mine
      .filter((f) => f.size === size)
      .sort((a, b) => rank(a.angle) - rank(b.angle))
      .forEach(({ url, angle }) => out.push({ url, color, angle }));
  }
  return out;
}

/** Shopify CDN resize (`width` param), so thumbnails don't pull full-size shots. */
export function shopifySized(url: string, width: number): string {
  if (!url.includes("cdn.shopify.com")) return url;
  const u = new URL(url);
  u.searchParams.set("width", String(width));
  return u.toString();
}
