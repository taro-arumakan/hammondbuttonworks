"use client";

/**
 * Sterling-inspired sidebar filters, HBW heritage-minimal styling. Since the
 * listing went static, filter state lives in `CatalogBrowser` (client) and the
 * URL is just a mirror — so options are buttons firing `onToggle`, not links.
 * (The old link-based facet URLs still resolve: the browser reads them on
 * load. They remain robots-disallowed.) Zero price data in here.
 * On mobile the same groups render inside a collapsible <details>.
 */

export type FilterOption = {
  value: string;
  label: string;
  count: number;
  active: boolean;
};

export type FilterGroup = {
  key: string;
  title: string;
  options: FilterOption[];
};

function FilterRows({
  groups,
  onToggle,
}: {
  groups: FilterGroup[];
  onToggle: (groupKey: string, value: string) => void;
}) {
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
                <button
                  type="button"
                  onClick={() => onToggle(g.key, o.value)}
                  aria-pressed={o.active}
                  className={`group flex w-full items-center gap-2 py-0.5 text-left text-sm transition-colors ${
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
                </button>
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
  hasActive,
  onToggle,
  onClear,
}: {
  groups: FilterGroup[];
  title: string;
  clearLabel: string;
  hasActive: boolean;
  onToggle: (groupKey: string, value: string) => void;
  onClear: () => void;
}) {
  const clear = hasActive && (
    <button
      type="button"
      onClick={onClear}
      className="text-xs text-stone-500 underline hover:text-foreground"
    >
      {clearLabel}
    </button>
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
          <FilterRows groups={groups} onToggle={onToggle} />
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
          <FilterRows groups={groups} onToggle={onToggle} />
        </div>
      </aside>
    </>
  );
}
