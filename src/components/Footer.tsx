import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import { Logo } from "@/components/Logo";
import { FooterLanguageSwitch } from "@/components/FooterLanguageSwitch";

/**
 * Site footer, per the owner's mockup (2026-10-07): black band with the
 * wordmark on the left, the site links and language switch in the middle,
 * and the white lockup with the copyright on the right. Arimo throughout,
 * except the serif wordmark and copyright line. The mockup's newsletter
 * sign-up was dropped at the owner's request (2026-10-07).
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
    { href: `${home}/quote`, label: f.links.custom },
    { href: `mailto:${f.contact}`, label: f.links.contact },
    { href: `${home}/privacy`, label: f.links.privacy },
  ];

  return (
    <footer className="mt-16 bg-black font-code text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.2fr)] md:gap-10 md:py-20">
        <div>
          <p className="font-serif text-xl">{f.wordmark}</p>
        </div>

        <div>
          <nav aria-label={f.navLabel}>
            <ul className="space-y-2.5 text-[15px] uppercase tracking-[0.08em]">
              {links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("mailto:") ? (
                    <a href={l.href} className="hover:text-white/60">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="hover:text-white/60">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
          <FooterLanguageSwitch current={locale} />
        </div>

        <div className="flex flex-col items-start gap-6 md:items-center md:justify-center">
          {/* The lockup is black artwork; invert renders it white on the band. */}
          <Logo variant="full" className="h-auto w-48 invert md:w-56" />
          <p className="font-serif text-xs uppercase tracking-[0.02em] md:text-center lg:whitespace-nowrap">
            {f.copy}
          </p>
        </div>
      </div>
    </footer>
  );
}
