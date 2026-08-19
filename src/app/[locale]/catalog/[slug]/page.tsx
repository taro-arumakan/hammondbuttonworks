/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGE_REVALIDATE, getAllProducts, getProductBySlug } from "@/lib/products";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, fmt, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";
import { PriceBlock } from "@/components/PriceBlock";

// Static + ISR: no session reads in the render path. Guests/crawlers hit the
// page cache; the ordering panel is a client island that fetches this buyer's
// own prices from the gated API. Known slugs prerender at build; new products
// generate on first request (dynamicParams) and then cache for an hour.
// Must be a literal (Next statically analyzes segment config) — keep in sync
// with PAGE_REVALIDATE in lib/products.ts, which the data fetches also use.
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    return (await getAllProducts(PAGE_REVALIDATE)).map((p) => ({ slug: p.slug }));
  } catch {
    // Shopify unreachable at build → prerender nothing; every product page
    // still renders on demand (and the failure stays visible in build logs).
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const base = await getProductBySlug(slug, PAGE_REVALIDATE);
  if (!base) return {};
  const product = localizeProduct(base, locale);
  const description = locale === "ja" ? product.shortJa : undefined;
  return {
    title: product.name,
    // Only set description when we have one: `description: undefined` still
    // participates in Next's metadata merge and ERASES the layout's inherited
    // description — EN product pages would ship with none at all.
    ...(description ? { description } : {}),
    // Canonical is the BARE product URL: the listing links every colourway as
    // `?color=…`, so without this each design competes with itself as N
    // near-duplicate pages. Built from the Shopify handle (base.slug), not the
    // raw URL segment — productByHandle is case-insensitive, so /catalog/PEBBLE
    // renders fine but must canonicalise to the lowercase handle, not itself.
    alternates: localeAlternates(locale, `/catalog/${base.slug}`),
  };
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
  // NB: the `?color=` preselect from catalog tiles is deliberately NOT read
  // here — reading searchParams would force this page dynamic. The PriceBlock
  // client island reads it from location.search after mount.

  const base = await getProductBySlug(slug, PAGE_REVALIDATE);
  if (!base) notFound();
  const product = localizeProduct(base, locale);

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
            {/* Client island — pass only price-free scalars. Handing it the
                `product` object would serialize variants[].basePrice into the
                page payload (invariant #1). */}
            <PriceBlock
              slug={product.slug}
              productName={product.name}
              leadTimeDays={product.leadTimeDays}
              colors={product.colors}
              sizesMm={product.sizesMm}
              variants={product.variants.map((v) => ({
                sku: v.sku,
                color: v.color,
                sizeMm: v.sizeMm,
                inStock: v.inStock,
              }))}
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
