import Link from "next/link";

/**
 * Link-based pagination (server component). Page hrefs are precomputed by the
 * page. Hidden entirely when there's a single page.
 */
export function Pagination({
  page,
  pages,
  pageOf,
  prevLabel,
  nextLabel,
}: {
  page: number;
  pages: { page: number; href: string }[];
  pageOf: string; // preformatted "Page X / Y"
  prevLabel: string;
  nextLabel: string;
}) {
  if (pages.length <= 1) return null;
  const prev = pages.find((p) => p.page === page - 1);
  const next = pages.find((p) => p.page === page + 1);

  const linkCls =
    "border border-line bg-surface px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-accent hover:text-foreground";
  const disabledCls = "border border-line px-3 py-1.5 text-sm text-stone-300";

  return (
    <nav aria-label={pageOf} className="mt-8 flex items-center justify-between gap-4">
      {prev ? (
        <Link href={prev.href} rel="prev" className={linkCls}>
          ← {prevLabel}
        </Link>
      ) : (
        <span className={disabledCls}>← {prevLabel}</span>
      )}

      <div className="flex items-center gap-1">
        {pages.map((p) =>
          p.page === page ? (
            <span
              key={p.page}
              aria-current="page"
              className="border border-accent bg-accent px-2.5 py-1 text-sm text-white"
            >
              {p.page}
            </span>
          ) : (
            <Link
              key={p.page}
              href={p.href}
              className="border border-transparent px-2.5 py-1 text-sm text-stone-500 hover:border-line hover:text-foreground"
            >
              {p.page}
            </Link>
          ),
        )}
      </div>

      {next ? (
        <Link href={next.href} rel="next" className={linkCls}>
          {nextLabel} →
        </Link>
      ) : (
        <span className={disabledCls}>{nextLabel} →</span>
      )}
    </nav>
  );
}
