import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { ProductCard } from "@/components/ProductCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: dict.nav.catalog, description: dict.catalog.subtitleGuest };
}

export default async function CatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  const session = await auth();
  const tier = session?.user.tier ?? null;
  const products = getAllProducts().map((p) => localizeProduct(p, locale));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl tracking-tight">{dict.catalog.title}</h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        {tier ? dict.catalog.subtitleTrade : dict.catalog.subtitleGuest}
      </p>

      {!tier && (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {dict.catalog.guestBanner}{" "}
          <Link href={`/${locale}/login`} className="font-medium underline">
            {dict.catalog.guestBannerLogin}
          </Link>{" "}
          {dict.catalog.guestBannerSuffix}
        </div>
      )}

      <div className="mt-8 grid grid-cols-2 border-t border-l border-line lg:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} tier={tier} locale={locale} dict={dict} />
        ))}
      </div>
    </div>
  );
}
