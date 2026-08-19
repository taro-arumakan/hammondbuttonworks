"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { type Locale, fmt } from "@/lib/i18n-config";
import {
  PAGE_SIZE,
  applyFilters,
  catalogHref,
  facetCounts,
  hasActiveFilters,
  parseCatalogQuery,
  sortTiles,
  toggled,
  type CatalogQuery,
  type CatalogTile,
  type SortKey,
} from "@/lib/catalog";
import { useAccountHint } from "@/lib/account-hint";
import { requestFromPrice } from "@/lib/price-batcher";
import { ProductCard } from "./ProductCard";
import { CatalogFilters, type FilterGroup } from "./CatalogFilters";
import { SortSelect } from "./SortSelect";
import { Pagination } from "./Pagination";

/**
 * Client-side catalog browsing over the static tile set.
 *
 * The listing page is STATIC (one cached document per locale — that's the
 * whole point of the cacheability refactor: a crawler walking the faceted URL
 * space hits the page cache instead of invoking a function per URL). So
 * filtering / sorting / pagination run here, in the browser, over the
 * price-free `CatalogTile` array the page embeds.
 *
 * URL contract is unchanged (?category=&size=&color=&stock=&sort=&page=):
 *  - the query is ADOPTED reactively from the router via a tiny
 *    useSearchParams bridge below (its own Suspense boundary, fallback null,
 *    so the prerendered document keeps its default page-1 grid — 40 real
 *    product links — for crawlers; only the invisible bridge client-renders).
 *    Reactive matters: a soft navigation to the same route (header "Catalog"
 *    link from a filtered view, back/forward, server-action redirects) keeps
 *    this component MOUNTED, so a mount-time location.search read would
 *    leave the grid stuck on stale filters while the URL says otherwise.
 *  - control changes push the serialized query back via history.pushState,
 *    which Next syncs into useSearchParams (native History API support) —
 *    the bridge sees its own pushes and no-ops via the equality guard.
 * Deep-linked filter URLs paint the default view first, then apply the
 * filter after hydration — those URLs are robots-disallowed anyway.
 *
 * Price sorts: options appear only with an account hint; the sort uses
 * from-prices fetched through the gated batch API (tiles carry none).
 */

const DEFAULT_QUERY: CatalogQuery = parseCatalogQuery({}, true);

function isPriceSort(sort: SortKey): boolean {
  return sort === "price-asc" || sort === "price-desc";
}

function parseSearch(search: string, allowPriceSort: boolean): CatalogQuery {
  const sp = new URLSearchParams(search);
  return parseCatalogQuery(
    {
      category: sp.get("category") ?? undefined,
      size: sp.get("size") ?? undefined,
      color: sp.get("color") ?? undefined,
      stock: sp.get("stock") ?? undefined,
      sort: sp.get("sort") ?? undefined,
      page: sp.get("page") ?? undefined,
    },
    allowPriceSort,
  );
}

/**
 * Invisible bridge that streams the router's current query string up to the
 * browser. Isolated so ONLY this subtree client-renders under its Suspense
 * boundary — the grid itself must stay in the prerendered HTML.
 */
function SearchParamsBridge({ onChange }: { onChange: (search: string) => void }) {
  const search = useSearchParams().toString();
  useEffect(() => {
    onChange(search);
  }, [search, onChange]);
  return null;
}

export function CatalogBrowser({
  tiles,
  locale,
  basePath,
  dict,
}: {
  tiles: CatalogTile[];
  locale: Locale;
  basePath: string; // `/${locale}/catalog`
  dict: Dictionary;
}) {
  const account = useAccountHint();
  const [query, setQuery] = useState<CatalogQuery>(DEFAULT_QUERY);
  // from-prices by tile key — populated only when a price sort is active.
  // Reset whenever the signed-in identity changes: prices are class-priced,
  // so one buyer's sort amounts must not carry into another's session.
  const [sortPrices, setSortPrices] = useState<Map<string, number> | null>(null);
  useEffect(() => {
    setSortPrices(null);
  }, [account?.email]);

  // Adopt the router's query whenever it changes (initial hydration, Link
  // navigations, back/forward, our own pushState — see SearchParamsBridge).
  const lastSearch = useRef<string | null>(null);
  const onSearchChange = useCallback((search: string) => {
    if (lastSearch.current === search) return;
    lastSearch.current = search;
    setQuery(parseSearch(search, true));
  }, []);

  // Guests may not sort by price — ordering alone would leak relative prices.
  // (A deep-linked ?sort=price-asc simply falls back for them; and if the
  // account hint disappears mid-session, the sort snaps back too.)
  const sort: SortKey = !account && isPriceSort(query.sort) ? "title" : query.sort;

  const update = useCallback(
    (next: CatalogQuery) => {
      setQuery(next);
      // NB the explicit page override: catalogHref would otherwise reset the
      // serialized page to 1 (its legacy contract), leaving ?page= unmirrored.
      const href = catalogHref(basePath, next, { page: next.page });
      lastSearch.current = href.split("?")[1] ?? "";
      window.history.pushState(null, "", href);
    },
    [basePath],
  );

  const filtered = useMemo(() => applyFilters(tiles, query), [tiles, query]);

  // Fetch from-prices for the filtered set when a price sort needs them.
  useEffect(() => {
    if (!account || !isPriceSort(sort)) return;
    let active = true;
    Promise.all(
      filtered.map((t) =>
        requestFromPrice(t.slug, t.color).then((p) => [t.key, p?.amount] as const),
      ),
    ).then((entries) => {
      if (!active) return;
      setSortPrices(new Map(entries.filter((e): e is [string, number] => e[1] != null)));
    });
    return () => {
      active = false;
    };
  }, [account, sort, filtered]);

  const priceOf = useMemo(
    () =>
      isPriceSort(sort) && sortPrices ? (key: string) => sortPrices.get(key) : undefined,
    [sort, sortPrices],
  );

  const sorted = useMemo(
    () => sortTiles(filtered, sort, locale, priceOf),
    [filtered, sort, locale, priceOf],
  );
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const items = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Sidebar filter groups (faceted counts over the full tile set) ---
  const facets = useMemo(() => facetCounts(tiles, query), [tiles, query]);
  const f = dict.catalog.filters;
  const groups: FilterGroup[] = [
    {
      key: "category",
      title: f.category,
      options: facets.categories.map(({ value, count }) => ({
        value,
        label: dict.labels.category[value] ?? value,
        count,
        active: query.categories.includes(value),
      })),
    },
    {
      key: "size",
      title: f.size,
      options: facets.sizes.map(({ value, count }) => ({
        value,
        label: `${value}mm`,
        count,
        active: query.sizes.includes(parseFloat(value)),
      })),
    },
    {
      key: "color",
      title: f.color,
      options: facets.colors.map(({ value, count }) => ({
        value,
        label: dict.labels.color[value.toLowerCase()] ?? value,
        count,
        active: query.colors.includes(value),
      })),
    },
    {
      key: "availability",
      title: f.availability,
      options: [
        { value: "in", label: f.inStock, count: facets.stock.in, active: query.stock.includes("in") },
        { value: "mto", label: f.madeToOrder, count: facets.stock.mto, active: query.stock.includes("mto") },
      ],
    },
  ];

  const onToggle = (groupKey: string, value: string) => {
    switch (groupKey) {
      case "category":
        update({ ...query, categories: toggled(query.categories, value), page: 1 });
        break;
      case "size":
        update({ ...query, sizes: toggled(query.sizes, parseFloat(value)), page: 1 });
        break;
      case "color":
        update({ ...query, colors: toggled(query.colors, value), page: 1 });
        break;
      case "availability":
        update({
          ...query,
          stock: toggled(query.stock, value as "in" | "mto"),
          page: 1,
        });
        break;
    }
  };

  const onClear = () =>
    update({ ...query, categories: [], sizes: [], colors: [], stock: [], page: 1 });

  // --- Sort options (price sorts only for signed-in buyers) ---
  const s = dict.catalog.sort;
  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "title", label: s.title },
    { value: "newest", label: s.newest },
    ...(account
      ? ([
          { value: "price-asc", label: s.priceAsc },
          { value: "price-desc", label: s.priceDesc },
        ] as { value: SortKey; label: string }[])
      : []),
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
      <Suspense fallback={null}>
        <SearchParamsBridge onChange={onSearchChange} />
      </Suspense>
      <CatalogFilters
        groups={groups}
        title={f.title}
        clearLabel={f.clear}
        hasActive={hasActiveFilters(query)}
        onToggle={onToggle}
        onClear={onClear}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-stone-500">
            {fmt(dict.catalog.results, { count: sorted.length })}
          </p>
          <SortSelect
            label={s.label}
            current={sort}
            options={sortOptions}
            onChange={(value) => update({ ...query, sort: value as SortKey, page: 1 })}
          />
        </div>

        {/* niceness.jp-style listing: borderless white grid, hairline gutters,
            5 columns on desktop for the large catalog */}
        {items.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-[2px] sm:grid-cols-3 lg:grid-cols-5">
            {items.map((t) => (
              <ProductCard
                key={t.key}
                slug={t.slug}
                name={t.name}
                category={t.category}
                color={t.color}
                image={t.image}
                sizesMm={t.sizesMm}
                locale={locale}
                dict={dict}
              />
            ))}
          </div>
        ) : (
          <div className="frame-double mt-4 bg-surface px-6 py-16 text-center">
            <p className="text-stone-600">{f.empty}</p>
            <button
              type="button"
              onClick={onClear}
              className="mt-3 inline-block text-sm text-accent underline hover:text-foreground"
            >
              {f.emptyReset}
            </button>
          </div>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          pageOf={fmt(dict.catalog.pagination.pageOf, { page, total: totalPages })}
          prevLabel={dict.catalog.pagination.prev}
          nextLabel={dict.catalog.pagination.next}
          onPage={(p) => {
            update({ ...query, page: p });
            window.scrollTo({ top: 0 });
          }}
        />
      </div>
    </div>
  );
}
