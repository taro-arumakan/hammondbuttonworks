import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";

/**
 * 別注について — placeholder until the owner supplies the real bespoke-order
 * content (TBD). Kept in the nav so the menu structure is final.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: dict.custom.title, robots: { index: false } };
}

export default async function CustomPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { custom } = getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <h1 className="font-serif text-3xl tracking-tight">{custom.title}</h1>
      <p className="mt-8 leading-relaxed text-stone-700">{custom.body}</p>
      <Link
        href={`/${locale}/quote`}
        className="mt-8 inline-block text-sm text-accent underline hover:text-foreground"
      >
        {custom.cta}
      </Link>
    </div>
  );
}
