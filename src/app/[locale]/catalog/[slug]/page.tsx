/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { baseUrl } from "@/lib/url";
import { getProductBySlug } from "@/lib/products";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, fmt, isLocale } from "@/lib/i18n-config";
import { PriceBlock } from "@/components/PriceBlock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const base = await getProductBySlug(slug);
  if (!base) return {};
  const product = localizeProduct(base, locale);
  const description = locale === "ja" ? product.shortJa : undefined;
  return { title: product.name, description };
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-stone-100 py-2 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  const base = await getProductBySlug(slug);
  if (!base) notFound();
  const product = localizeProduct(base, locale);

  const session = await auth();
  const customerClass = session?.user.customerClass ?? null;
  const productUrl = `${await baseUrl()}/${locale}/catalog/${product.slug}`;

  const categoryLabel = dict.labels.category[product.category?.toLowerCase()] ?? product.category;
  const sizes = product.sizesMm.map((s) => `${s}mm`).join(", ");
  const colors = product.colors.join(locale === "ja" ? "・" : ", ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="text-sm text-stone-500">
        <Link href={`/${locale}/catalog`} className="hover:text-accent">
          {dict.nav.catalog}
        </Link>{" "}
        / <span className="text-stone-700">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery + specs */}
        <div>
          <div className="overflow-hidden rounded-2xl bg-stone-50">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="aspect-square w-full bg-stone-100" />
            )}
          </div>

          <h2 className="mt-8 text-lg font-semibold">{dict.product.specs}</h2>
          <dl className="mt-2">
            <Spec label={dict.product.category} value={categoryLabel} />
            <Spec label={dict.product.sizes} value={sizes} />
            <Spec label={dict.product.colors} value={colors} />
            <Spec
              label={dict.product.leadTime}
              value={fmt(dict.product.leadTimeValue, { days: product.leadTimeDays })}
            />
          </dl>
        </div>

        {/* Title, copy, pricing/order */}
        <div>
          <h1 className="font-serif text-4xl tracking-tight">{product.name}</h1>

          {locale === "ja" && product.shortJa ? (
            <p className="mt-4 leading-relaxed text-stone-600">{product.shortJa}</p>
          ) : (
            <div
              className="mt-4 leading-relaxed text-stone-600 [&_p]:mt-3"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          )}

          <div className="mt-8">
            <PriceBlock
              product={product}
              signedIn={!!customerClass}
              productUrl={productUrl}
              locale={locale}
              dict={dict}
            />
          </div>

          <p className="mt-4 text-xs text-stone-400">{dict.product.mockupNote}</p>
        </div>
      </div>
    </div>
  );
}
