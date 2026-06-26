"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALES, LOCALE_SWITCH, type Locale } from "@/lib/i18n-config";

/**
 * Swaps the leading `/{locale}` segment of the current path so switching
 * languages keeps you on the same page.
 */
export function LanguageSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();

  function pathFor(loc: Locale): string {
    const parts = pathname.split("/");
    if (parts.length > 1) parts[1] = loc;
    const next = parts.join("/");
    return next || `/${loc}`;
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {LOCALES.map((loc, i) => (
        <span key={loc} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-line">·</span>}
          <Link
            href={pathFor(loc)}
            aria-current={loc === current ? "true" : undefined}
            className={
              loc === current
                ? "font-medium text-foreground"
                : "text-stone-400 hover:text-accent"
            }
          >
            {LOCALE_SWITCH[loc]}
          </Link>
        </span>
      ))}
    </div>
  );
}
