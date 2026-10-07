import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, fmt, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return {
    title: dict.printCatalog.heading,
    description: dict.printCatalog.metaDescription,
    alternates: localeAlternates(locale, "/print-catalog"),
  };
}

// The printed sample catalog: cover, ten sample cards, back cover. Photos are
// square crops of the owner's 2×6 sheet, pre-sized under /public/images/site
// (`catalog-book-NN-{600,1200}.jpg`), laid out in the same two columns at every width.
const PAGE_COUNT = 12;

export default async function PrintCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const home = `/${locale}`;
  const { printCatalog: t } = getDictionary(locale);

  const inquiry = `${home}/quote#inquiry`;
  const alt = (n: number) =>
    n === 1
      ? t.coverAlt
      : n === PAGE_COUNT
        ? t.backAlt
        : fmt(t.pageAlt, { n: n - 1, total: PAGE_COUNT - 2 });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h1 className="font-serif text-3xl uppercase tracking-[0.08em] sm:text-4xl">{t.heading}</h1>
      <p className="mt-4 text-stone-600">
        {t.requestBefore}
        <Link href={inquiry} className="underline underline-offset-4 hover:text-accent">
          {t.requestLink}
        </Link>
        {t.requestAfter}
      </p>

      <ul className="mt-10 grid grid-cols-2">
        {Array.from({ length: PAGE_COUNT }, (_, i) => {
          const n = String(i + 1).padStart(2, "0");
          return (
            <li key={n}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/images/site/catalog-book-${n}-1200.jpg`}
                srcSet={`/images/site/catalog-book-${n}-600.jpg 600w, /images/site/catalog-book-${n}-1200.jpg 1200w`}
                sizes="(min-width: 1152px) 560px, 50vw"
                width={1200}
                height={1200}
                alt={alt(i + 1)}
                loading={i < 2 ? "eager" : "lazy"}
                decoding="async"
                className="block h-auto w-full"
              />
            </li>
          );
        })}
      </ul>

      <div className="mt-12 flex justify-center">
        <Link
          href={inquiry}
          className="rounded-md bg-foreground px-6 py-3 text-background hover:bg-accent"
        >
          {t.cta}
        </Link>
      </div>
    </div>
  );
}
