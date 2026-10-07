"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n-config";

// Footer order and labels from the owner's mockup: 日本語 / English.
const ORDER: { loc: Locale; label: string }[] = [
  { loc: "ja", label: "日本語" },
  { loc: "en", label: "English" },
];

/** Swaps the leading `/{locale}` segment, like the header's LanguageSwitcher. */
export function FooterLanguageSwitch({ current }: { current: Locale }) {
  const pathname = usePathname();
  function pathFor(loc: Locale): string {
    const parts = pathname.split("/");
    if (parts.length > 1) parts[1] = loc;
    return parts.join("/") || `/${loc}`;
  }
  return (
    <p className="mt-8 flex items-center gap-2 text-[13px] tracking-[0.04em]">
      {ORDER.map(({ loc, label }, i) => (
        <span key={loc} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden="true">/</span>}
          <Link
            href={pathFor(loc)}
            lang={loc}
            aria-current={loc === current ? "true" : undefined}
            className={loc === current ? "text-foreground" : "text-stone-500 hover:text-accent"}
          >
            {label}
          </Link>
        </span>
      ))}
    </p>
  );
}
