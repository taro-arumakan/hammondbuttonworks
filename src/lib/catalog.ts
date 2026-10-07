import type { ShopifyProduct, ShopifyVariant } from "./shopify";
import type { Locale } from "./i18n-config";
import { FILTER_COLORS, colorLabels, filterColorOf } from "./colors";
import { materialGroupsOf, type MaterialSlug } from "./materials";

/**
 * Catalog filtering / sorting / pagination — pure helpers (Sterling-style
 * sidebar UX, OT-22). State lives entirely in the URL query. Since the
 * cacheability refactor (2026-08) the LISTING PAGE IS STATIC and these run
 * CLIENT-SIDE in `CatalogBrowser` over the price-free `CatalogTile` model —
 * which is why every helper below must stay isomorphic (no server-only
 * imports; the ShopifyProduct/Variant imports are type-only, erased at
 * compile time). Within a dimension values are OR'd; across dimensions AND.
 *
 * The listing's unit is the COLOURWAY (product × colour), not the product: photos
 * are shot per colour, so a colourway tile always shows a true image of the thing
 * being ordered, and a colour filter matches exactly. The data unit stays the
 * product (one design, one set of metafields) — see `toColorways`.
 *
 * Guests may not sort by price (ordering would leak relative price info), so
 * `parseCatalogQuery` coerces price sorts to the default for them.
 */

// Colourways run ~2× products, so a page holds ~20 designs' worth of tiles.
// 40 fills complete rows on the desktop 5-col grid and the mobile 2-col grid.
// (The sm breakpoint is 3-col, where 40 leaves one tile on the last row.)
export const PAGE_SIZE = 40;

export const SORT_KEYS = ["title", "newest", "price-asc", "price-desc"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export const DEFAULT_SORT: SortKey = "title";
const PRICE_SORTS: SortKey[] = ["price-asc", "price-desc"];

export type Availability = "in" | "mto";

export type CatalogQuery = {
  categories: string[]; // lowercased productType tokens
  sizes: string[]; // size-filter keys (see `sizeKeyOf`), e.g. "buffalo-20", "toggle-45", "metal"
  colors: string[]; // facet tokens (see `facetColor`), e.g. "dark brown" for H2 and HB01
  stock: Availability[];
  sort: SortKey;
  page: number; // 1-based
};

/**
 * The colour facet token for a Color option value: its filter colour, called
 * with NO materials — exactly what the importer's admission gate checks
 * (`storefront_filter_color`), so every colour it lets in resolves here, and
 * PRODUCT_FIELDS never needs to fetch `hbw.material`. An unmapped value (only
 * the seeded placeholders have any) stays its own token, so it shows in the
 * sidebar as a visible gap rather than dropping out of the colour filter.
 */
export function facetColor(colorValue: string): string {
  return filterColorOf(colorValue, []) ?? colorValue.trim();
}

/**
 * Display labels for every colour a product shows, keyed by exact option
 * value — the one call every colour-showing surface goes through, so the
 * no-two-colourways-alike rule (see `colorLabels`) holds on all of them.
 * `names` is the locale's `dict.labels.color`.
 */
export function productColorLabels(
  p: Pick<ShopifyProduct, "slug" | "colors" | "variants">,
  names: Readonly<Record<string, string>>,
): Record<string, string> {
  return colorLabels([...p.colors, ...p.variants.map((v) => v.color)], names, p.slug);
}

// --- Size filter -----------------------------------------------------------------

/**
 * The size filter is grouped by kind of button (owner request, 2026-10-07): a
 * flat list put one metal 19mm next to dozens of buffalo 20mm and suggested the
 * two were comparable. Each group lists the sizes the owner named; a size
 * that turns up in the data but not in the list is appended, so no colourway
 * ever becomes unfilterable. Metal sizes vary per design (7–24mm, mostly one
 * product each), so metal is one option with no sizes under it.
 *
 * TOGGLE IS INFERRED FROM SIZE: nothing in Shopify marks the shape yet (the
 * tooling's product master records `construction`, but it is not written to
 * the store). Every toggle is 35mm or larger and no other button is, so a
 * size of 35mm+ is filed under Toggle whatever its material. If a
 * construction metafield is ever added, read it in `sizeGroupOf` instead.
 */
export const SIZE_GROUPS = [
  { key: "buffalo", sizes: [10, 11.5, 13, 15, 18, 20, 23, 25, 30] },
  { key: "wood", sizes: [10, 11.5, 13, 15, 18, 20, 23, 25, 30] },
  { key: "toggle", sizes: [35, 45, 55] },
  { key: "metal", sizes: [] },
] as const satisfies readonly { key: string; sizes: readonly number[] }[];
export type SizeGroup = (typeof SIZE_GROUPS)[number]["key"];

const TOGGLE_MIN_MM = 35;

/** Which size-filter group one variant belongs to; undefined without a material. */
export function sizeGroupOf(sizeMm: number, materials: readonly string[]): SizeGroup | undefined {
  if (sizeMm >= TOGGLE_MIN_MM) return "toggle";
  // "dyed" is buffalo horn too; a buffalo + metal combination files under buffalo.
  const groups = materialGroupsOf("", materials);
  if (groups.includes("wood")) return "wood";
  if (groups.some((g) => g === "buffalo" || g === "dyed")) return "buffalo";
  if (groups.includes("metal")) return "metal";
  return undefined;
}

/** The filter key for one variant: "buffalo-11.5", "toggle-45", or just "metal". */
export function sizeKeyOf(sizeMm: number, materials: readonly string[]): string | undefined {
  const group = sizeGroupOf(sizeMm, materials);
  if (!group) return undefined;
  return group === "metal" ? "metal" : `${group}-${sizeMm}`;
}

function parseSizeKey(key: string): { group: SizeGroup; mm?: number } | undefined {
  if (key === "metal") return { group: "metal" };
  const m = /^(buffalo|wood|toggle)-(\d+(?:\.\d+)?)$/.exec(key);
  return m ? { group: m[1] as SizeGroup, mm: parseFloat(m[2]) } : undefined;
}

// --- Colourways ------------------------------------------------------------------

/** One grid tile: a product in one colour, with that colour's photo + variants. */
export type Colorway = {
  key: string; // `${slug}::${color}` — stable React key
  product: ShopifyProduct;
  color: string; // exact option value, e.g. "H2xDULL" — an identity, never relabelled
  filterColor: string; // facet token, e.g. "dark brown"
  colorLabel: string; // what the buyer reads, e.g. "Dark Brown / Dull"
  image?: string; // that colour's variant image, else the product's featured photo
  variants: ShopifyVariant[]; // the sizes available in this colour
};

/**
 * Explode products into one entry per colour, preserving the declared order.
 * `colorNames` is the locale's `dict.labels.color`, for each tile's label.
 */
export function toColorways(
  products: ShopifyProduct[],
  colorNames: Readonly<Record<string, string>>,
): Colorway[] {
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
      out.push({
        key: p.slug,
        product: p,
        color: "",
        filterColor: "",
        colorLabel: "",
        image: p.image,
        variants: [],
      });
      continue;
    }
    const labels = productColorLabels(p, colorNames);
    const order = p.colors.length ? p.colors : [...byColor.keys()];
    for (const color of order) {
      const variants = byColor.get(color);
      if (!variants?.length) continue;
      out.push({
        key: `${p.slug}::${color}`,
        product: p,
        color,
        filterColor: facetColor(color),
        colorLabel: labels[color] ?? color,
        image: variants.find((v) => v.image)?.image ?? p.image,
        variants,
      });
    }
  }
  return out;
}

// --- Tiles (the client-safe projection) ------------------------------------------

/**
 * What the static listing serializes into the client payload — one entry per
 * colourway, carrying ONLY what filtering/sorting/rendering needs.
 *
 * ⚠️ INVARIANT #1 LIVES HERE. A `Colorway` holds full `ShopifyVariant`s,
 * including `basePrice` — it must NEVER be passed to a client component.
 * `toTiles()` is the choke point that strips prices; the catalog page hands
 * the browser tiles, never colorways. Prices reach the signed-in client only
 * through the gated /api/price endpoint (see TilePrice/price-batcher).
 */
export type CatalogTile = {
  key: string; // `${slug}::${color}`
  slug: string;
  name: string;
  color: string; // exact option value, e.g. "H2xDULL" — an identity, never relabelled
  filterColor: string; // facet token, e.g. "dark brown"
  colorLabel: string; // what the buyer reads, e.g. "Dark Brown / Dull"
  image?: string;
  category: string; // productType (display case; compared lowercased; may be empty)
  createdAt: string; // ISO, for "newest"
  currency: string;
  sizesMm: number[]; // sizes available in this colour
  sizeKeys: string[]; // size-filter keys for those sizes (see `sizeKeyOf`)
  hasStock: boolean; // any variant in stock
  hasMto: boolean; // any variant made-to-order
};

/**
 * The colourways listed on one material's page (/materials/<slug>). Membership
 * is decided per colourway, not per product: whether buffalo is natural or
 * piece-dyed is read off the colour (see lib/materials.ts).
 */
export function colorwaysOfMaterial(colorways: Colorway[], slug: MaterialSlug): Colorway[] {
  return colorways.filter((cw) =>
    materialGroupsOf(cw.color, [...new Set(cw.variants.flatMap((v) => v.materials))]).includes(slug),
  );
}

/** Project colorways to the client-safe tile model (drops variants/prices). */
export function toTiles(colorways: Colorway[]): CatalogTile[] {
  return colorways.map((cw) => ({
    key: cw.key,
    slug: cw.product.slug,
    name: cw.product.name,
    color: cw.color,
    filterColor: cw.filterColor,
    colorLabel: cw.colorLabel,
    image: cw.image,
    category: cw.product.category,
    createdAt: cw.product.createdAt,
    currency: cw.product.currency,
    sizesMm: [...new Set(cw.variants.map((v) => v.sizeMm))].sort((a, b) => a - b),
    sizeKeys: [
      ...new Set(cw.variants.flatMap((v) => sizeKeyOf(v.sizeMm, v.materials) ?? [])),
    ],
    hasStock: cw.variants.some((v) => v.inStock),
    hasMto: cw.variants.some((v) => !v.inStock),
  }));
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
    // Unknown tokens (including the bare-mm keys of the old flat list) drop.
    sizes: csv(sp.size)
      .map((s) => s.toLowerCase())
      .filter((s) => parseSizeKey(s) !== undefined),
    colors: csv(sp.color),
    stock: csv(sp.stock).filter((s): s is Availability => s === "in" || s === "mto"),
    sort,
    page,
  };
}

// --- Filtering -----------------------------------------------------------------

type Dimension = "categories" | "sizes" | "colors" | "stock";

function matchesDimension(t: CatalogTile, q: CatalogQuery, dim: Dimension): boolean {
  switch (dim) {
    case "categories":
      return q.categories.length === 0 || q.categories.includes(t.category.toLowerCase());
    case "sizes":
      return q.sizes.length === 0 || t.sizeKeys.some((k) => q.sizes.includes(k));
    case "colors":
      // Exact: a colour filter matches the tile's own colour, not "the product
      // has some variant in this colour".
      return q.colors.length === 0 || q.colors.includes(t.filterColor);
    case "stock":
      return (
        q.stock.length === 0 ||
        q.stock.some((a) => (a === "in" ? t.hasStock : t.hasMto))
      );
  }
}

const DIMENSIONS: Dimension[] = ["categories", "sizes", "colors", "stock"];

export function applyFilters(tiles: CatalogTile[], q: CatalogQuery): CatalogTile[] {
  return tiles.filter((t) => DIMENSIONS.every((d) => matchesDimension(t, q, d)));
}

export function hasActiveFilters(q: CatalogQuery): boolean {
  return q.categories.length + q.sizes.length + q.colors.length + q.stock.length > 0;
}

// --- Facets ----------------------------------------------------------------------
// Standard faceted counts: for dimension D, count within products matching every
// dimension EXCEPT D — so picking a category updates size/color counts, while the
// category list itself keeps showing what else is available.

export type FacetCount = { value: string; count: number };

function crossFiltered(tiles: CatalogTile[], q: CatalogQuery, except: Dimension) {
  return tiles.filter((t) =>
    DIMENSIONS.every((d) => d === except || matchesDimension(t, q, d)),
  );
}

/** Counts are colourway (tile) counts — they match what the grid will show. */
export function facetCounts(tiles: CatalogTile[], q: CatalogQuery) {
  const forCategories = crossFiltered(tiles, q, "categories");
  const forSizes = crossFiltered(tiles, q, "sizes");
  const forColors = crossFiltered(tiles, q, "colors");
  const forStock = crossFiltered(tiles, q, "stock");

  // An empty productType is not a category — real products deliberately have
  // none yet — so it gets no (blank) option; with none at all the dimension
  // has no options and the sidebar hides it.
  const categories = new Map<string, number>();
  for (const t of tiles) if (t.category.trim()) categories.set(t.category.toLowerCase(), 0);
  for (const t of forCategories) {
    const k = t.category.toLowerCase();
    if (categories.has(k)) categories.set(k, (categories.get(k) ?? 0) + 1);
  }

  // Every listed size shows, even at 0 (greyed), so the buyer sees the full
  // range the owner offers; sizes only the data has are appended in order.
  const sizeCounts = new Map<string, number>();
  for (const t of forSizes) for (const k of t.sizeKeys) sizeCounts.set(k, (sizeCounts.get(k) ?? 0) + 1);
  const present = new Set(tiles.flatMap((t) => t.sizeKeys));
  const sizes = SIZE_GROUPS.map((g) => {
    const mm = new Set<number>(g.sizes);
    for (const k of present) {
      const p = parseSizeKey(k);
      if (p?.group === g.key && p.mm !== undefined) mm.add(p.mm);
    }
    const keys =
      g.key === "metal" ? ["metal"] : [...mm].sort((a, b) => a - b).map((n) => `${g.key}-${n}`);
    return {
      group: g.key as SizeGroup,
      options: keys.map((value) => ({
        value,
        mm: parseSizeKey(value)?.mm,
        count: sizeCounts.get(value) ?? 0,
      })),
    };
  });

  const colors = new Map<string, number>();
  for (const t of tiles) if (t.filterColor && !colors.has(t.filterColor)) colors.set(t.filterColor, 0);
  for (const t of forColors) {
    if (colors.has(t.filterColor)) colors.set(t.filterColor, (colors.get(t.filterColor) ?? 0) + 1);
  }
  // FILTER_COLORS order (light → dark, metal last); unmapped tokens after it.
  const colorRank = (c: string) => {
    const i = (FILTER_COLORS as readonly string[]).indexOf(c);
    return i === -1 ? FILTER_COLORS.length : i;
  };

  const stock: Record<Availability, number> = { in: 0, mto: 0 };
  for (const t of forStock) {
    if (t.hasStock) stock.in++;
    if (t.hasMto) stock.mto++;
  }

  return {
    categories: [...categories.entries()].map(([value, count]) => ({ value, count })),
    sizes,
    colors: [...colors.entries()]
      .sort((a, b) => colorRank(a[0]) - colorRank(b[0]) || a[0].localeCompare(b[0]))
      .map(([value, count]) => ({ value, count })),
    stock,
  };
}

// --- Sorting ---------------------------------------------------------------------

/**
 * Sort tiles. Tiles carry no prices (invariant #1), so price sorts take an
 * injected `priceOf` — the signed-in browser supplies from-prices it fetched
 * from the gated API (guests never see the price-sort options at all). While
 * prices are still loading, unknown entries sink to the end via Infinity.
 */
export function sortTiles(
  tiles: CatalogTile[],
  sort: SortKey,
  locale: Locale,
  priceOf?: (key: string) => number | undefined,
): CatalogTile[] {
  const sorted = [...tiles];
  // Every comparator falls back to (name, colour) so a design's colourways stay
  // adjacent in the grid — which is what makes swatches unnecessary.
  const byName = (a: CatalogTile, b: CatalogTile) =>
    a.name.localeCompare(b.name, locale) || a.color.localeCompare(b.color, locale);
  const price = (t: CatalogTile) => priceOf?.(t.key) ?? Infinity;

  switch (sort) {
    case "newest":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || byName(a, b));
      break;
    case "price-asc":
      sorted.sort((a, b) => price(a) - price(b) || byName(a, b));
      break;
    case "price-desc":
      sorted.sort((a, b) => price(b) - price(a) || byName(a, b));
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
