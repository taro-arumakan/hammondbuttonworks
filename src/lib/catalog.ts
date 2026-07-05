import type { ShopifyProduct } from "./shopify";
import type { Locale } from "./i18n-config";

/**
 * Catalog filtering / sorting / pagination — pure, URL-driven (Sterling-style
 * sidebar UX, OT-22). State lives entirely in searchParams so filters are
 * plain links: server-rendered, SEO-friendly, and no price data ever needs to
 * reach the client. Within a dimension values are OR'd; across dimensions AND.
 *
 * Guests may not sort by price (ordering would leak relative price info), so
 * `parseCatalogQuery` coerces price sorts to the default for them.
 */

export const PAGE_SIZE = 12;

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

function matchesDimension(p: ShopifyProduct, q: CatalogQuery, dim: Dimension): boolean {
  switch (dim) {
    case "categories":
      return q.categories.length === 0 || q.categories.includes(p.category.toLowerCase());
    case "sizes":
      return q.sizes.length === 0 || p.sizesMm.some((s) => q.sizes.includes(s));
    case "colors":
      return q.colors.length === 0 || p.colors.some((c) => q.colors.includes(baseColor(c)));
    case "stock":
      return (
        q.stock.length === 0 ||
        q.stock.some((a) =>
          a === "in" ? p.variants.some((v) => v.inStock) : p.variants.some((v) => !v.inStock),
        )
      );
  }
}

const DIMENSIONS: Dimension[] = ["categories", "sizes", "colors", "stock"];

export function applyFilters(products: ShopifyProduct[], q: CatalogQuery): ShopifyProduct[] {
  return products.filter((p) => DIMENSIONS.every((d) => matchesDimension(p, q, d)));
}

export function hasActiveFilters(q: CatalogQuery): boolean {
  return q.categories.length + q.sizes.length + q.colors.length + q.stock.length > 0;
}

// --- Facets ----------------------------------------------------------------------
// Standard faceted counts: for dimension D, count within products matching every
// dimension EXCEPT D — so picking a category updates size/color counts, while the
// category list itself keeps showing what else is available.

export type FacetCount = { value: string; count: number };

function crossFiltered(products: ShopifyProduct[], q: CatalogQuery, except: Dimension) {
  return products.filter((p) =>
    DIMENSIONS.every((d) => d === except || matchesDimension(p, q, d)),
  );
}

export function facetCounts(products: ShopifyProduct[], q: CatalogQuery) {
  const forCategories = crossFiltered(products, q, "categories");
  const forSizes = crossFiltered(products, q, "sizes");
  const forColors = crossFiltered(products, q, "colors");
  const forStock = crossFiltered(products, q, "stock");

  const categories = new Map<string, number>();
  for (const p of products) categories.set(p.category.toLowerCase(), 0);
  for (const p of forCategories) {
    const k = p.category.toLowerCase();
    categories.set(k, (categories.get(k) ?? 0) + 1);
  }

  const sizes = new Map<number, number>();
  for (const p of products) for (const s of p.sizesMm) if (!sizes.has(s)) sizes.set(s, 0);
  for (const p of forSizes) {
    for (const s of new Set(p.sizesMm)) sizes.set(s, (sizes.get(s) ?? 0) + 1);
  }

  const colors = new Map<string, number>();
  for (const p of products) for (const c of p.colors) if (!colors.has(baseColor(c))) colors.set(baseColor(c), 0);
  for (const p of forColors) {
    for (const c of new Set(p.colors.map(baseColor))) colors.set(c, (colors.get(c) ?? 0) + 1);
  }

  const stock: Record<Availability, number> = { in: 0, mto: 0 };
  for (const p of forStock) {
    if (p.variants.some((v) => v.inStock)) stock.in++;
    if (p.variants.some((v) => !v.inStock)) stock.mto++;
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

function minPrice(p: ShopifyProduct): number {
  return p.variants.length ? Math.min(...p.variants.map((v) => v.basePrice)) : Infinity;
}

export function sortProducts(
  products: ShopifyProduct[],
  sort: SortKey,
  locale: Locale,
): ShopifyProduct[] {
  const sorted = [...products];
  switch (sort) {
    case "newest":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
    case "price-asc":
      sorted.sort((a, b) => minPrice(a) - minPrice(b));
      break;
    case "price-desc":
      sorted.sort((a, b) => minPrice(b) - minPrice(a));
      break;
    case "title":
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name, locale));
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
