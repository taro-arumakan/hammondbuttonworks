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
  /** Sub-heading the option sits under; a new value starts a new sub-list. */
  section?: string;
};

export type FilterGroup = {
  key: string;
  title: string;
  options: FilterOption[];
};

/** A checkbox square: filled when on, a bar when some (not all) are on. */
function Box({ state }: { state: "on" | "some" | "off" }) {
  return (
    <span
      aria-hidden
      className={`relative inline-block h-3 w-3 shrink-0 border ${
        state === "on"
          ? "border-accent bg-accent"
          : state === "some"
            ? "border-accent bg-surface"
            : "border-stone-400 bg-surface group-hover:border-stone-600"
      }`}
    >
      {state === "some" && <span className="absolute inset-x-0.5 top-1/2 h-px -translate-y-1/2 bg-accent" />}
    </span>
  );
}

function FilterRows({
  groups,
  onToggle,
  onToggleSection,
}: {
  groups: FilterGroup[];
  onToggle: (groupKey: string, value: string) => void;
  onToggleSection: (groupKey: string, values: string[], select: boolean) => void;
}) {
  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.key}>
          <h3 className="font-serif text-sm uppercase tracking-[0.15em] text-foreground">
            {g.title}
          </h3>
          <ul className="mt-2 space-y-1 border-t border-line pt-2">
            {g.options.map((o, i) => (
              <li key={o.value}>
                {o.section && o.section !== g.options[i - 1]?.section && (() => {
                  // Section checkbox: selects (or clears) every option under it.
                  const members = g.options.filter((m) => m.section === o.section);
                  const on = members.filter((m) => m.active).length;
                  const state = on === 0 ? "off" : on === members.length ? "on" : "some";
                  return (
                    <button
                      type="button"
                      onClick={() =>
                        onToggleSection(g.key, members.map((m) => m.value), state !== "on")
                      }
                      aria-pressed={state === "some" ? "mixed" : state === "on"}
                      className={`group flex w-full items-center gap-2 pb-0.5 text-left text-xs uppercase tracking-[0.12em] text-stone-500 hover:text-foreground ${i > 0 ? "pt-3" : ""}`}
                    >
                      <Box state={state} />
                      <span className={state === "off" ? "" : "text-foreground"}>{o.section}</span>
                    </button>
                  );
                })()}
                <button
                  type="button"
                  onClick={() => onToggle(g.key, o.value)}
                  aria-pressed={o.active}
                  className={`group flex w-full items-center gap-2 py-0.5 text-left text-sm transition-colors ${
                    o.section ? "pl-5" : ""
                  } ${
                    o.count === 0 && !o.active
                      ? "text-stone-400"
                      : "text-stone-600 hover:text-foreground"
                  }`}
                >
                  <Box state={o.active ? "on" : "off"} />
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
  onToggleSection,
  onClear,
}: {
  groups: FilterGroup[];
  title: string;
  clearLabel: string;
  hasActive: boolean;
  onToggle: (groupKey: string, value: string) => void;
  onToggleSection: (groupKey: string, values: string[], select: boolean) => void;
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
          <FilterRows groups={groups} onToggle={onToggle} onToggleSection={onToggleSection} />
          {clear && <div className="mt-4">{clear}</div>}
        </div>
      </details>

      {/* Desktop: always-visible sidebar. Sticky under the site header with
          its own scroll, so a long filter list never pushes the grid out of
          view: the page scrolls the products, the pane scrolls the filters.
          self-start stops the flex row stretching it, which would defeat
          sticky. */}
      <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-52 shrink-0 self-start overflow-y-auto overscroll-contain pb-4 pr-2 lg:block">
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-sm uppercase tracking-[0.15em] text-stone-500">{title}</h2>
          {clear}
        </div>
        <div className="mt-4">
          <FilterRows groups={groups} onToggle={onToggle} onToggleSection={onToggleSection} />
        </div>
      </aside>
    </>
  );
}
