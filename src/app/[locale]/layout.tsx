import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Marcellus, Zen_Old_Mincho } from "next/font/google";
import { auth } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/lib/i18n-config";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MobileNav } from "@/components/MobileNav";
import { CartLink } from "@/components/CartLink";
import "../globals.css";

// Inscriptional low-contrast Roman serif — chosen to align with niceness.jp's
// custom "NICENESS Serif" (owner reference, 2026-07): wide open caps, near-
// monolinear strokes, fine sharp serifs. Marcellus ships a single 400 weight,
// which matches how the reference uses one weight; no bold serif exists in the
// UI (verified), so headings/nav/product-names all resolve through --font-display.
const display = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// Japanese companion face, matching niceness.jp's pairing (their Latin "NICENESS
// Serif" + Zen Old Mincho for 日本語). Marcellus has no CJK glyphs, so stacking
// Zen Old Mincho after it in --font-serif / --font-sans makes every Japanese
// character fall through to Mincho automatically — no unicode-range needed.
// preload:false because CJK is large; swap avoids blocking on the download.
const jp = Zen_Old_Mincho({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-jp",
  display: "swap",
  preload: false,
});

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta =
    locale === "ja"
      ? {
          title: "Hammond Button Works — 取引先向けボタン卸売",
          description:
            "アパレルメーカー様向けの、手仕事による天然ボタン。水牛ホーン・ウッド・メタル。無塗装の自然な仕上げで、小ロット・サイズ別注に対応します。",
        }
      : {
          title: "Hammond Button Works — Trade Button Supply",
          description:
            "Handcrafted natural buttons for apparel makers — buffalo horn, hardwood, and solid metal. Uncoated, made to order in any size. Wholesale trade pricing.",
        };
  return {
    title: { default: meta.title, template: "%s · Hammond Button Works" },
    description: meta.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = getDictionary(locale);
  const session = await auth();
  const account = session?.user;
  const home = `/${locale}`;

  return (
    <html lang={locale} className={`${display.variable} ${jp.variable}`}>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line bg-surface/85 backdrop-blur sticky top-0 z-10">
          <nav className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href={home} aria-label="Hammond Button Works — home">
              <Logo variant="compact" className="h-7 w-auto text-foreground" />
            </Link>
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Desktop inline nav — serif menu (Marcellus/Zen Old Mincho),
                  matching niceness.jp's serif navigation. */}
              <div className="hidden items-center gap-5 font-serif text-[15px] tracking-[0.02em] sm:flex">
                <Link href={`${home}/catalog`} className="hover:text-accent">
                  {dict.nav.catalog}
                </Link>
                <Link href={`${home}/about`} className="hover:text-accent">
                  {dict.nav.about}
                </Link>
                <Link href={`${home}/quote`} className="hover:text-accent">
                  {dict.nav.quote}
                </Link>
                {account && (
                  <CartLink href={`${home}/cart`} label={dict.nav.cartPrefix} />
                )}
                {account ? (
                  // No pricing-class badge — customers must not be able to tell
                  // their tier (standard/plus). Prices reflect the class, but the
                  // class name is never shown or sent to the client.
                  <span className="flex items-center gap-2 text-stone-500">
                    <span>{account.companyName ?? account.email}</span>
                    <form action="/api/auth/logout" method="post">
                      <button type="submit" className="text-xs underline hover:text-accent">
                        {dict.nav.signout}
                      </button>
                    </form>
                  </span>
                ) : (
                  <Link
                    href={`${home}/login`}
                    className="rounded-md bg-foreground px-3 py-1.5 text-background hover:bg-accent"
                  >
                    {dict.nav.login}
                  </Link>
                )}
              </div>

              {/* Always-visible language switcher + mobile hamburger */}
              <LanguageSwitcher current={locale} />
              {/* Pass only display fields to the client nav — never customerClass. */}
              <MobileNav
                home={home}
                dict={dict}
                account={account && { email: account.email, companyName: account.companyName }}
              />
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-line mt-16">
          <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-stone-500 flex flex-col sm:flex-row items-start justify-between gap-6">
            <div className="flex items-center gap-4">
              <Logo variant="stamp" className="h-14 w-14 text-foreground shrink-0" />
              <div>
                <p className="font-serif text-base text-foreground">{dict.footer.brand}</p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-stone-400">
                  {dict.footer.handcraft}
                </p>
                <p className="mt-1">{dict.footer.copy}</p>
                <a
                  href={`mailto:${dict.footer.contact}`}
                  className="mt-1 inline-block underline hover:text-accent"
                >
                  {dict.footer.contact}
                </a>
              </div>
            </div>
            <span className="max-w-xs sm:text-right">{dict.footer.disclaimer}</span>
          </div>
        </footer>

      </body>
    </html>
  );
}
