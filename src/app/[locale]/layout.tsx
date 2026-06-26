import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { notFound } from "next/navigation";
import { EB_Garamond } from "next/font/google";
import { auth } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/lib/i18n-config";
import { Logo } from "@/components/Logo";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import "../globals.css";

const SNIPCART_VERSION = "3.7.3";

// Serif close to the logo's "BUTTON WORKS" — used for headings/brand labels.
const display = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
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
            "アパレルメーカー様向けの日本製ヘリテージ・ワークウェアボタン。タック・ジャンパーコート・オーバーオール・刻印ワークボタン。卸売の段階別価格と別注対応。",
        }
      : {
          title: "Hammond Button Works — Trade Button Supply",
          description:
            "Heritage workwear buttons for apparel makers — tack, jumper-coat, overall, and engraved work buttons. Made in Japan. Wholesale trade pricing and custom production.",
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
  const snipcartKey = process.env.NEXT_PUBLIC_SNIPCART_KEY;
  const home = `/${locale}`;

  return (
    <html lang={locale} className={display.variable}>
      {snipcartKey && (
        <head>
          <link rel="preconnect" href="https://app.snipcart.com" />
          <link
            rel="stylesheet"
            href={`https://cdn.snipcart.com/themes/v${SNIPCART_VERSION}/default/snipcart.css`}
          />
        </head>
      )}
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line bg-surface/85 backdrop-blur sticky top-0 z-10">
          <nav className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
            <Link href={home} aria-label="Hammond Button Works — home">
              <Logo variant="compact" className="h-7 w-auto text-foreground" />
            </Link>
            <div className="flex items-center gap-5 text-sm">
              <Link href={`${home}/catalog`} className="hover:text-accent">
                {dict.nav.catalog}
              </Link>
              <Link href={`${home}/quote`} className="hover:text-accent">
                {dict.nav.quote}
              </Link>
              {snipcartKey && account && (
                <button className="snipcart-checkout hover:text-accent">
                  {dict.nav.cartPrefix} (<span className="snipcart-items-count">0</span>)
                </button>
              )}
              {account ? (
                <span className="flex items-center gap-2 text-stone-500">
                  <span className="hidden sm:inline">
                    {account.companyName ?? account.email}
                  </span>
                  <span className="rounded bg-stone-200/60 px-2 py-0.5 text-xs uppercase tracking-wide">
                    {account.tier?.replace("tier_", "") ?? "trade"}
                  </span>
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
              <LanguageSwitcher current={locale} />
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
                <p className="mt-1">{dict.footer.copy}</p>
              </div>
            </div>
            <span className="max-w-xs sm:text-right">{dict.footer.disclaimer}</span>
          </div>
        </footer>

        {snipcartKey && (
          <>
            <div hidden id="snipcart" data-api-key={snipcartKey} data-config-modal-style="side" />
            <Script
              src={`https://cdn.snipcart.com/themes/v${SNIPCART_VERSION}/default/snipcart.js`}
              strategy="afterInteractive"
            />
          </>
        )}
      </body>
    </html>
  );
}
