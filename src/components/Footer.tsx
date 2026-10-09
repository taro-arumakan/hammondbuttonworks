import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import { Logo } from "@/components/Logo";
import { FooterLanguageSwitch } from "@/components/FooterLanguageSwitch";

/**
 * Site footer, per the owner's "plan B" mock (2026-10-07): a very light gray
 * band with the site links in two columns and the language switch on the
 * left, and the black lockup with the copyright on the right. Arimo
 * throughout, except the serif copyright line.
 *
 * Server component with one small client island (the language switch, which
 * needs the current path), so the layout stays static.
 */
export function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const home = `/${locale}`;
  const f = dict.footer;
  const links: { href: string; label: string }[] = [
    { href: home, label: f.links.home },
    { href: `${home}/catalog`, label: f.links.product },
    { href: `${home}/materials`, label: f.links.material },
    { href: `${home}/print-catalog`, label: f.links.catalog },
    { href: `${home}/about`, label: f.links.about },
    { href: `${home}/guide`, label: f.links.guide },
    { href: `${home}/quote`, label: f.links.custom },
    { href: `mailto:${f.contact}`, label: f.links.contact },
    { href: `${home}/privacy`, label: f.links.privacy },
  ];

  // Two menu columns, split as in the owner's mock: site sections, then
  // ordering/help pages.
  const columns = [links.slice(0, 5), links.slice(5)];

  return (
    <footer className="mt-16 bg-[#f7f7f6] font-code text-foreground">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-2 md:items-center md:py-12">
        <div>
          <nav aria-label={f.navLabel} className="flex gap-12 sm:gap-20">
            {columns.map((col, i) => (
              <ul key={i} className="space-y-2 text-[12px] uppercase tracking-[0.04em] sm:text-[13px]">
                {col.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("mailto:") ? (
                      <a href={l.href} className="hover:text-accent">
                        {l.label}
                      </a>
                    ) : (
                      <Link href={l.href} className="hover:text-accent">
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            ))}
          </nav>
          <FooterLanguageSwitch current={locale} />
        </div>

        <div className="flex flex-col items-start gap-4 md:items-center">
          <Logo variant="full" className="h-auto w-28 sm:w-36 md:w-40" />
          <p className="font-serif text-[10px] uppercase tracking-[0.02em] sm:text-[11px] md:text-center lg:whitespace-nowrap">
            {f.copy}
          </p>
        </div>
      </div>
    </footer>
  );
}
