import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Arimo, Libre_Baskerville, Zen_Kaku_Gothic_New } from "next/font/google";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/lib/i18n-config";
import { siteUrl } from "@/lib/seo";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { MobileNav } from "@/components/MobileNav";
import { HeaderAccount } from "@/components/HeaderAccount";
import { Footer } from "@/components/Footer";
import "../globals.css";

// Site typefaces per the owner's spec (2026-10), all Google Fonts:
//   Libre Baskerville — main English text and the header menu
//   Arimo             — button product numbers and the footer
//   Zen Kaku Gothic New — Japanese
// None of the Latin faces carry CJK glyphs, so stacking --font-jp after them in
// globals.css makes Japanese characters fall through to Zen Kaku Gothic New.

// Libre Baskerville ships 400 and 700 only: medium (500) renders at 400 and
// semibold (600) at 700, which is how the UI's buttons and prices resolve.
const display = Libre_Baskerville({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// preload:false because CJK is large; swap avoids blocking on the download.
const jp = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-jp",
  display: "swap",
  preload: false,
});

// Variable font, so every weight ships in one file. Exposed as the `font-code`
// utility (globals.css).
const code = Arimo({
  subsets: ["latin"],
  variable: "--font-arimo",
  display: "swap",
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
    // Lets pages declare relative OG/canonical URLs and resolves them absolutely.
    metadataBase: new URL(siteUrl()),
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
  const home = `/${locale}`;
  // No auth() here — the layout must stay static so every public page can be
  // served from the CDN cache (the fix for the 2026-07 crawler cost incident).
  // Account-dependent chrome is the HeaderAccount / MobileNav client islands,
  // driven by the display-hint cookie (see lib/hint-cookie.ts).

  return (
    <html lang={locale} className={`${display.variable} ${jp.variable} ${code.variable}`}>
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line bg-surface/85 backdrop-blur sticky top-0 z-10">
          <nav className="relative mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
            <Link href={home} aria-label="Hammond Button Works — home">
              <Logo variant="compact" className="h-[33px] w-auto text-foreground" />
            </Link>
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Desktop inline nav — Libre Baskerville menu (Japanese labels
                  fall through to Zen Kaku Gothic New). */}
              <div className="hidden items-center gap-5 font-serif text-[15px] tracking-[0.02em] sm:flex">
                <Link href={`${home}/catalog`} className="hover:text-accent">
                  {dict.nav.catalog}
                </Link>
                <Link href={`${home}/materials`} className="hover:text-accent">
                  {dict.nav.materials}
                </Link>
                <Link href={`${home}/print-catalog`} className="hover:text-accent">
                  {dict.nav.printCatalog}
                </Link>
                <Link href={`${home}/about`} className="hover:text-accent">
                  {dict.nav.about}
                </Link>
                <Link href={`${home}/quote`} className="hover:text-accent">
                  {dict.nav.quote}
                </Link>
                <HeaderAccount
                  home={home}
                  labels={{
                    cartPrefix: dict.nav.cartPrefix,
                    signout: dict.nav.signout,
                    login: dict.nav.login,
                  }}
                />
              </div>

              {/* Always-visible language switcher + mobile hamburger */}
              <LanguageSwitcher current={locale} />
              <MobileNav home={home} dict={dict} />
            </div>
          </nav>
        </header>

        <main className="flex-1">{children}</main>

        <Footer dict={dict} locale={locale} />

      </body>
    </html>
  );
}
