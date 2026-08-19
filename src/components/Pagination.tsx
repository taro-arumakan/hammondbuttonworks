"use client";

/**
 * Button-based pagination, driven by `CatalogBrowser` (the listing is static;
 * paging is client state mirrored to ?page=N). Hidden when there's one page.
 * Product discovery for crawlers doesn't depend on these controls — every
 * product × locale is in the sitemap.
 */
export function Pagination({
  page,
  totalPages,
  pageOf,
  prevLabel,
  nextLabel,
  onPage,
}: {
  page: number;
  totalPages: number;
  pageOf: string; // preformatted "Page X / Y"
  prevLabel: string;
  nextLabel: string;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const linkCls =
    "border border-line bg-surface px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-accent hover:text-foreground";
  const disabledCls = "border border-line px-3 py-1.5 text-sm text-stone-300";

  return (
    <nav aria-label={pageOf} className="mt-8 flex items-center justify-between gap-4">
      {page > 1 ? (
        <button type="button" onClick={() => onPage(page - 1)} className={linkCls}>
          ← {prevLabel}
        </button>
      ) : (
        <span className={disabledCls}>← {prevLabel}</span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p) =>
          p === page ? (
            <span
              key={p}
              aria-current="page"
              className="border border-accent bg-accent px-2.5 py-1 text-sm text-white"
            >
              {p}
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              className="border border-transparent px-2.5 py-1 text-sm text-stone-500 hover:border-line hover:text-foreground"
            >
              {p}
            </button>
          ),
        )}
      </div>

      {page < totalPages ? (
        <button type="button" onClick={() => onPage(page + 1)} className={linkCls}>
          {nextLabel} →
        </button>
      ) : (
        <span className={disabledCls}>{nextLabel} →</span>
      )}
    </nav>
  );
}
