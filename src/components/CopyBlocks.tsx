import type { Locale } from "@/lib/i18n-config";

/**
 * Owner copy laid out as in the "HBW copies" sheet: each block is a paragraph,
 * each line one sentence. Japanese keeps the sheet's line-per-sentence layout
 * (the usual rhythm for Japanese brand copy); English runs the sentences on as
 * ordinary prose, where a break after every sentence would read as a list.
 */
export function CopyBlocks({
  blocks,
  locale,
  className = "space-y-5 leading-relaxed text-stone-700",
}: {
  blocks: readonly (readonly string[])[];
  locale: Locale;
  className?: string;
}) {
  return (
    <div className={className}>
      {blocks.map((lines, i) =>
        locale === "ja" ? (
          <p key={i}>
            {lines.map((line, j) => (
              <span key={j} className="block">
                {line}
              </span>
            ))}
          </p>
        ) : (
          <p key={i}>{lines.join(" ")}</p>
        ),
      )}
    </div>
  );
}
