import type { ShopifyProduct, ShopifyVariant } from "./shopify";
import type { Locale } from "./i18n-config";

/**
 * Catalog filtering / sorting / pagination — pure, URL-driven (Sterling-style
 * sidebar UX, OT-22). State lives entirely in searchParams so filters are
 * plain links: server-rendered, SEO-friendly, and no price data ever needs to
 * reach the client. Within a dimension values are OR'd; across dimensions AND.
 *
 * The listing's unit is the COLOURWAY (product × colour), not the product: photos
 * are shot per colour, so a colourway tile always shows a true image of the thing
 * being ordered, and a colour filter matches exactly. The data unit stays the
 * product (one design, one set of metafields) — see `toColorways`.
 *
 * Guests may not sort by price (ordering would leak relative price info), so
 * `parseCatalogQuery` coerces price sorts to the default for them.
 */

// Colourways run ~2× products, so a page holds ~12 designs' worth of tiles.
export const PAGE_SIZE = 24;

export const SORT_KEYS = ["title", "newest", "price-asc", "price-desc"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export const DEFAULT_SORT: SortKey = "title";
const PRICE_SORTS: SortKey[] = ["price-asc", "price-desc"];

export type Availability = "in" | "mto";

export type CatalogQuery = {
  categories: string[]; // lowercased productType tokens
  sizes: number[]; // mm
  colors: string[]; // base color tokens, e.g. "Brown" from "Brown (Rosewood)"
  stock: Availability[];
  sort: SortKey;
  page: number; // 1-based
};

/** "Brown (Rosewood)" → "Brown" — the display color, without the species. */
export function baseColor(colorValue: string): string {
  return colorValue.split("(")[0].trim();
}

// --- Colourways ------------------------------------------------------------------

/** One grid tile: a product in one colour, with that colour's photo + variants. */
export type Colorway = {
  key: string; // `${slug}::${color}` — stable React key
  product: ShopifyProduct;
  color: string; // exact option value, e.g. "Brown (Rosewood)"
  base: string; // facet token, e.g. "Brown"
  image?: string; // that colour's variant image, else the product's featured photo
  variants: ShopifyVariant[]; // the sizes available in this colour
};

/** Explode products into one entry per colour, preserving the declared order. */
export function toColorways(products: ShopifyProduct[]): Colorway[] {
  const out: Colorway[] = [];
  for (const p of products) {
    const byColor = new Map<string, ShopifyVariant[]>();
    for (const v of p.variants) {
      const list = byColor.get(v.color) ?? [];
      list.push(v);
      byColor.set(v.color, list);
    }
    if (byColor.size === 0) {
      // Defensive: a product with no variants still gets one tile.
      out.push({ key: p.slug, product: p, color: "", base: "", image: p.image, variants: [] });
      continue;
    }
    const order = p.colors.length ? p.colors : [...byColor.keys()];
    for (const color of order) {
      const variants = byColor.get(color);
      if (!variants?.length) continue;
      out.push({
        key: `${p.slug}::${color}`,
        product: p,
        color,
        base: baseColor(color),
        image: variants.find((v) => v.image)?.image ?? p.image,
        variants,
      });
    }
  }
  return out;
}

type SearchParams = Record<string, string | string[] | undefined>;

function csv(param: string | string[] | undefined): string[] {
  const raw = Array.isArray(param) ? param.join(",") : (param ?? "");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseCatalogQuery(sp: SearchParams, allowPriceSort: boolean): CatalogQuery {
  const sortRaw = Array.isArray(sp.sort) ? sp.sort[0] : sp.sort;
  let sort: SortKey = (SORT_KEYS as readonly string[]).includes(sortRaw ?? "")
    ? (sortRaw as SortKey)
    : DEFAULT_SORT;
  if (!allowPriceSort && PRICE_SORTS.includes(sort)) sort = DEFAULT_SORT;

  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const page = Math.max(1, Math.floor(Number(pageRaw)) || 1);

  return {
    categories: csv(sp.category).map((c) => c.toLowerCase()),
    sizes: csv(sp.size)
      .map((s) => parseFloat(s))
      .filter((n) => Number.isFinite(n) && n > 0),
    colors: csv(sp.color),
    stock: csv(sp.stock).filter((s): s is Availability => s === "in" || s === "mto"),
    sort,
    page,
  };
}

// --- Filtering -----------------------------------------------------------------

type Dimension = "categories" | "sizes" | "colors" | "stock";

function matchesDimension(cw: Colorway, q: CatalogQuery, dim: Dimension): boolean {
  switch (dim) {
    case "categories":
      return q.categories.length === 0 || q.categories.includes(cw.product.category.toLowerCase());
    case "sizes":
      return q.sizes.length === 0 || cw.variants.some((v) => q.sizes.includes(v.sizeMm));
    case "colors":
      // Exact now: a colour filter matches the tile's own colour, not "the product
      // has some variant in this colour".
      return q.colors.length === 0 || q.colors.includes(cw.base);
    case "stock":
      return (
        q.stock.length === 0 ||
        q.stock.some((a) =>
          a === "in" ? cw.variants.some((v) => v.inStock) : cw.variants.some((v) => !v.inStock),
        )
      );
  }
}

const DIMENSIONS: Dimension[] = ["categories", "sizes", "colors", "stock"];

export function applyFilters(colorways: Colorway[], q: CatalogQuery): Colorway[] {
  return colorways.filter((cw) => DIMENSIONS.every((d) => matchesDimension(cw, q, d)));
}

export function hasActiveFilters(q: CatalogQuery): boolean {
  return q.categories.length + q.sizes.length + q.colors.length + q.stock.length > 0;
}

// --- Facets ----------------------------------------------------------------------
// Standard faceted counts: for dimension D, count within products matching every
// dimension EXCEPT D — so picking a category updates size/color counts, while the
// category list itself keeps showing what else is available.

export type FacetCount = { value: string; count: number };

function crossFiltered(colorways: Colorway[], q: CatalogQuery, except: Dimension) {
  return colorways.filter((cw) =>
    DIMENSIONS.every((d) => d === except || matchesDimension(cw, q, d)),
  );
}

/** Counts are colourway (tile) counts — they match what the grid will show. */
export function facetCounts(colorways: Colorway[], q: CatalogQuery) {
  const forCategories = crossFiltered(colorways, q, "categories");
  const forSizes = crossFiltered(colorways, q, "sizes");
  const forColors = crossFiltered(colorways, q, "colors");
  const forStock = crossFiltered(colorways, q, "stock");

  const categories = new Map<string, number>();
  for (const cw of colorways) categories.set(cw.product.category.toLowerCase(), 0);
  for (const cw of forCategories) {
    const k = cw.product.category.toLowerCase();
    categories.set(k, (categories.get(k) ?? 0) + 1);
  }

  const sizes = new Map<number, number>();
  for (const cw of colorways) for (const v of cw.variants) if (!sizes.has(v.sizeMm)) sizes.set(v.sizeMm, 0);
  for (const cw of forSizes) {
    for (const s of new Set(cw.variants.map((v) => v.sizeMm))) sizes.set(s, (sizes.get(s) ?? 0) + 1);
  }

  const colors = new Map<string, number>();
  for (const cw of colorways) if (!colors.has(cw.base)) colors.set(cw.base, 0);
  for (const cw of forColors) colors.set(cw.base, (colors.get(cw.base) ?? 0) + 1);

  const stock: Record<Availability, number> = { in: 0, mto: 0 };
  for (const cw of forStock) {
    if (cw.variants.some((v) => v.inStock)) stock.in++;
    if (cw.variants.some((v) => !v.inStock)) stock.mto++;
  }

  return {
    categories: [...categories.entries()].map(([value, count]) => ({ value, count })),
    sizes: [...sizes.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([value, count]) => ({ value: String(value), count })),
    colors: [...colors.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count })),
    stock,
  };
}

// --- Sorting ---------------------------------------------------------------------

function minPrice(cw: Colorway): number {
  return cw.variants.length ? Math.min(...cw.variants.map((v) => v.basePrice)) : Infinity;
}

export function sortColorways(colorways: Colorway[], sort: SortKey, locale: Locale): Colorway[] {
  const sorted = [...colorways];
  // Every comparator falls back to (name, colour) so a design's colourways stay
  // adjacent in the grid — which is what makes swatches unnecessary.
  const byName = (a: Colorway, b: Colorway) =>
    a.product.name.localeCompare(b.product.name, locale) || a.color.localeCompare(b.color, locale);

  switch (sort) {
    case "newest":
      sorted.sort((a, b) => b.product.createdAt.localeCompare(a.product.createdAt) || byName(a, b));
      break;
    case "price-asc":
      sorted.sort((a, b) => minPrice(a) - minPrice(b) || byName(a, b));
      break;
    case "price-desc":
      sorted.sort((a, b) => minPrice(b) - minPrice(a) || byName(a, b));
      break;
    case "title":
    default:
      sorted.sort(byName);
  }
  return sorted;
}

// --- URL building ------------------------------------------------------------------

/**
 * Serialize a query back to a catalog href. Defaults (empty filters, default
 * sort, page 1) are omitted so the canonical catalog URL stays clean. Any
 * filter/sort change resets pagination.
 */
export function catalogHref(
  basePath: string,
  q: CatalogQuery,
  overrides: Partial<CatalogQuery> = {},
): string {
  const merged = { ...q, ...overrides };
  // Changing anything but the page itself resets to page 1.
  const page = "page" in overrides ? merged.page : 1;
  const sp = new URLSearchParams();
  if (merged.categories.length) sp.set("category", merged.categories.join(","));
  if (merged.sizes.length) sp.set("size", merged.sizes.join(","));
  if (merged.colors.length) sp.set("color", merged.colors.join(","));
  if (merged.stock.length) sp.set("stock", merged.stock.join(","));
  if (merged.sort !== DEFAULT_SORT) sp.set("sort", merged.sort);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

/** Toggle `value` in a list (immutable) — for filter link building. */
export function toggled<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}
