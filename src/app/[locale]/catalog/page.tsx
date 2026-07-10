import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import { fromUnitPrice } from "@/lib/pricing";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, fmt, isLocale } from "@/lib/i18n-config";
import {
  PAGE_SIZE,
  applyFilters,
  catalogHref,
  facetCounts,
  hasActiveFilters,
  parseCatalogQuery,
  sortProducts,
  toggled,
  type SortKey,
} from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { CatalogFilters, type FilterGroup } from "@/components/CatalogFilters";
import { SortSelect } from "@/components/SortSelect";
import { Pagination } from "@/components/Pagination";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: dict.nav.catalog, description: dict.catalog.subtitleGuest };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale: raw }, sp] = await Promise.all([params, searchParams]);
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const basePath = `/${locale}/catalog`;

  const session = await auth();
  const customerClass = session?.user.customerClass ?? null;
  // Guests may not sort by price — ordering alone would leak relative prices.
  const query = parseCatalogQuery(sp, !!customerClass);

  const all = (await getAllProducts()).map((p) => localizeProduct(p, locale));

  const filtered = applyFilters(all, query);
  const sorted = sortProducts(filtered, query.sort, locale);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const page = Math.min(query.page, totalPages);
  const items = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // --- Sidebar filter groups (precomputed toggle hrefs + faceted counts) ---
  const facets = facetCounts(all, query);
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
        href: catalogHref(basePath, query, { categories: toggled(query.categories, value) }),
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
        href: catalogHref(basePath, query, { sizes: toggled(query.sizes, parseFloat(value)) }),
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
        href: catalogHref(basePath, query, { colors: toggled(query.colors, value) }),
      })),
    },
    {
      key: "availability",
      title: f.availability,
      options: (
        [
          { value: "in" as const, label: f.inStock, count: facets.stock.in },
          { value: "mto" as const, label: f.madeToOrder, count: facets.stock.mto },
        ]
      ).map(({ value, label, count }) => ({
        value,
        label,
        count,
        active: query.stock.includes(value),
        href: catalogHref(basePath, query, { stock: toggled(query.stock, value) }),
      })),
    },
  ];

  // --- Sort options (price sorts only for logged-in buyers) ---
  const s = dict.catalog.sort;
  const sortOptions: { value: SortKey; label: string }[] = [
    { value: "title", label: s.title },
    { value: "newest", label: s.newest },
    ...(customerClass
      ? ([
          { value: "price-asc", label: s.priceAsc },
          { value: "price-desc", label: s.priceDesc },
        ] as { value: SortKey; label: string }[])
      : []),
  ];

  const pages = Array.from({ length: totalPages }, (_, i) => ({
    page: i + 1,
    href: catalogHref(basePath, query, { page: i + 1 }),
  }));

  // Plain listing — no heading/description/guest banner (owner direction,
  // 2026-07); the per-card "Trade pricing — sign in" tag carries the hint.
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <CatalogFilters
          groups={groups}
          title={f.title}
          clearLabel={f.clear}
          clearHref={catalogHref(basePath, query, {
            categories: [],
            sizes: [],
            colors: [],
            stock: [],
          })}
          hasActive={hasActiveFilters(query)}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-stone-500">
              {fmt(dict.catalog.results, { count: sorted.length })}
            </p>
            <SortSelect
              label={s.label}
              current={query.sort}
              options={sortOptions.map((o) => ({
                ...o,
                href: catalogHref(basePath, query, { sort: o.value }),
              }))}
            />
          </div>

          {/* niceness.jp-style listing: borderless white grid, hairline gutters,
              5 columns on desktop for the large catalog */}
          {items.length > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-[2px] sm:grid-cols-3 lg:grid-cols-5">
              {items.map((p) => (
                <ProductCard
                  key={p.slug}
                  product={p}
                  price={fromUnitPrice(p, customerClass)}
                  locale={locale}
                  dict={dict}
                />
              ))}
            </div>
          ) : (
            <div className="frame-double mt-4 bg-surface px-6 py-16 text-center">
              <p className="text-stone-600">{f.empty}</p>
              <Link
                href={basePath}
                className="mt-3 inline-block text-sm text-accent underline hover:text-foreground"
              >
                {f.emptyReset}
              </Link>
            </div>
          )}

          <Pagination
            page={page}
            pages={pages}
            pageOf={fmt(dict.catalog.pagination.pageOf, { page, total: totalPages })}
            prevLabel={dict.catalog.pagination.prev}
            nextLabel={dict.catalog.pagination.next}
          />
        </div>
      </div>
    </div>
  );
}
