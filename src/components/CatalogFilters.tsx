import Link from "next/link";

/**
 * Sterling-inspired sidebar filters, HBW heritage-minimal styling. Pure links —
 * the page precomputes each option's toggle href + count, so this stays a
 * server component with zero client JS (and zero price data). On mobile the
 * same groups render inside a collapsible <details>.
 */

export type FilterOption = {
  value: string;
  label: string;
  count: number;
  active: boolean;
  href: string;
};

export type FilterGroup = {
  key: string;
  title: string;
  options: FilterOption[];
};

function FilterRows({ groups }: { groups: FilterGroup[] }) {
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.key}>
          <h3 className="font-serif text-sm uppercase tracking-[0.15em] text-foreground">
            {g.title}
          </h3>
          <ul className="mt-2 space-y-1 border-t border-line pt-2">
            {g.options.map((o) => (
              <li key={o.value}>
                <Link
                  href={o.href}
                  rel="nofollow"
                  aria-pressed={o.active}
                  className={`group flex items-center gap-2 py-0.5 text-sm transition-colors ${
                    o.count === 0 && !o.active
                      ? "text-stone-400"
                      : "text-stone-600 hover:text-foreground"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`inline-block h-3 w-3 shrink-0 border ${
                      o.active
                        ? "border-accent bg-accent"
                        : "border-stone-400 bg-surface group-hover:border-stone-600"
                    }`}
                  />
                  <span className={o.active ? "font-medium text-foreground" : ""}>{o.label}</span>
                  <span className="ml-auto text-xs tabular-nums text-stone-400">{o.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function CatalogFilters({
  groups,
  title,
  clearLabel,
  clearHref,
  hasActive,
}: {
  groups: FilterGroup[];
  title: string;
  clearLabel: string;
  clearHref: string;
  hasActive: boolean;
}) {
  const clear = hasActive && (
    <Link href={clearHref} className="text-xs text-stone-500 underline hover:text-foreground">
      {clearLabel}
    </Link>
  );

  return (
    <>
      {/* Mobile: collapsible */}
      <details className="border border-line bg-surface lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-serif text-sm uppercase tracking-[0.15em] [&::-webkit-details-marker]:hidden">
          {title}
          <span aria-hidden className="text-stone-500">
            +
          </span>
        </summary>
        <div className="border-t border-line px-4 py-4">
          <FilterRows groups={groups} />
          {clear && <div className="mt-4">{clear}</div>}
        </div>
      </details>

      {/* Desktop: always-visible sidebar */}
      <aside className="hidden w-52 shrink-0 lg:block">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-sm uppercase tracking-[0.15em] text-stone-500">{title}</h2>
          {clear}
        </div>
        <div className="mt-4">
          <FilterRows groups={groups} />
        </div>
      </aside>
    </>
  );
}
