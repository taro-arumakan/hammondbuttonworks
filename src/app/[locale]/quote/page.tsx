import type { Metadata } from "next";
import { QuoteForm } from "@/components/QuoteForm";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { issueFormToken } from "@/lib/form-guard";

// A fresh anti-spam token must be minted per load, so never statically cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: dict.quote.title, description: dict.quote.subtitle };
}

export default async function QuotePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sku?: string; qty?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const { sku, qty } = await searchParams;
  const formToken = await issueFormToken();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-4xl tracking-tight">{dict.quote.title}</h1>
      <p className="mt-2 text-stone-600">{dict.quote.subtitle}</p>
      <p className="mt-3 text-stone-600">{dict.quote.subtitleCatalog}</p>

      <div className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <QuoteForm dict={dict} locale={locale} defaultSku={sku} defaultQty={qty} formToken={formToken} />
      </div>

      <p className="mt-6 text-sm text-stone-500">{dict.quote.preferEmail}</p>
    </div>
  );
}
