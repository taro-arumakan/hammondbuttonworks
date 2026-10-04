import type { Metadata } from "next";
import { QuoteForm } from "@/components/QuoteForm";
import { Banner } from "@/components/Banner";
import { CopyBlocks } from "@/components/CopyBlocks";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";

// Static: the anti-spam token is fetched client-side from /api/form-token on
// mount (see QuoteForm), and the ?sku=&qty= prefills are read from
// location.search there too — nothing here needs the request.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return {
    title: dict.quote.title,
    description: dict.quote.customBlocks[0].join(locale === "ja" ? "" : " "),
    alternates: localeAlternates(locale, "/quote"),
  };
}

export default async function QuotePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  // The menu's 別注/カタログ問い合わせ page: what we make to order first (the
  // owner's 別注デザイン / オリジナル刻印 copy), then the inquiry form.
  return (
    <div>
      <Banner
        images={[{ name: "banner-metal-grid", alt: dict.quote.bannerAlt }]}
        className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
        priority
      />

      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="font-serif text-4xl tracking-tight">{dict.quote.title}</h1>

        <section className="mt-10">
          <h2 className="font-serif text-2xl tracking-tight">{dict.quote.customTitle}</h2>
          <CopyBlocks blocks={dict.quote.customBlocks} locale={locale} className="mt-5 space-y-4 leading-relaxed text-stone-700" />
        </section>

        <section className="mt-14 border-t border-line pt-10">
          <h2 className="font-serif text-2xl tracking-tight">{dict.quote.inquiryTitle}</h2>
          <p className="mt-3 text-stone-600">{dict.quote.subtitleCatalog}</p>

          <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
            <QuoteForm dict={dict} locale={locale} />
          </div>

          <p className="mt-6 text-sm text-stone-500">{dict.quote.preferEmail}</p>
        </section>
      </div>
    </div>
  );
}
