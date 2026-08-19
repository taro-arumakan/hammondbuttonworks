import type { Metadata } from "next";
import { QuoteForm } from "@/components/QuoteForm";
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
    description: dict.quote.subtitle,
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-4xl tracking-tight">{dict.quote.title}</h1>
      <p className="mt-2 text-stone-600">{dict.quote.subtitle}</p>
      <p className="mt-3 text-stone-600">{dict.quote.subtitleCatalog}</p>

      <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <QuoteForm dict={dict} locale={locale} />
      </div>

      <p className="mt-6 text-sm text-stone-500">{dict.quote.preferEmail}</p>
    </div>
  );
}
