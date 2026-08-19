"use client";

/**
 * Sort dropdown. State lives in `CatalogBrowser` (the listing is static and
 * client-driven), so this just reports the chosen value — including the guest
 * restriction: the browser simply never includes the price-sort options for
 * guests, and coerces a price sort away if the account hint disappears.
 */
export function SortSelect({
  label,
  current,
  options,
  onChange,
}: {
  label: string;
  current: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-stone-600">
      <span className="text-xs uppercase tracking-wide text-stone-500">{label}</span>
      <select
        value={current}
        onChange={(e) => onChange(e.target.value)}
        className="border border-line bg-surface px-2 py-1.5 text-sm text-foreground focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
