"use client";

import { useRouter } from "next/navigation";

/**
 * Sort dropdown. The server passes a precomputed href per option (so all URL
 * logic — and the guest restriction on price sorts — stays server-side); this
 * client component only navigates.
 */
export function SortSelect({
  label,
  current,
  options,
}: {
  label: string;
  current: string;
  options: { value: string; label: string; href: string }[];
}) {
  const router = useRouter();
  return (
    <label className="flex items-center gap-2 text-sm text-stone-600">
      <span className="text-xs uppercase tracking-wide text-stone-500">{label}</span>
      <select
        value={current}
        onChange={(e) => {
          const opt = options.find((o) => o.value === e.target.value);
          if (opt) router.push(opt.href, { scroll: false });
        }}
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
