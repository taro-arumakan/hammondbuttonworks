import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { baseUrl } from "@/lib/url";
import { getAllProducts, getProductBySlug } from "@/lib/products";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, LOCALES, fmt, isLocale } from "@/lib/i18n-config";
import { ButtonSwatch } from "@/components/ButtonSwatch";
import { PriceBlock } from "@/components/PriceBlock";

export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    getAllProducts().map((p) => ({ locale, slug: p.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: raw, slug } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const base = getProductBySlug(slug);
  if (!base) return {};
  const product = localizeProduct(base, locale);
  return {
    title: product.seo.title ?? product.name,
    description: product.seo.description ?? product.shortDescription,
  };
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-stone-100 py-2 text-sm">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
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

  const base = getProductBySlug(slug);
  if (!base) notFound();
  const product = localizeProduct(base, locale);

  const session = await auth();
  const tier = session?.user.tier ?? null;
  const productUrl = `${await baseUrl()}/${locale}/catalog/${product.slug}`;

  const sizes = [...new Set(product.variants.map((v) => v.sizeLigne))].sort(
    (a, b) => a - b,
  );

  const materialLabel = dict.labels.material[product.material] ?? product.material;
  const holeLabel = dict.labels.holeType[product.holeType] ?? product.holeType;
  const unitLabel = dict.labels.unit[product.unit] ?? product.unit;
  const applications = product.application
    .map((a) => dict.labels.application[a] ?? a)
    .join(locale === "ja" ? "・" : ", ");
  const origin =
    locale === "ja" && product.countryOfOrigin === "Japan"
      ? "日本"
      : product.countryOfOrigin;

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
          <div className="flex items-center justify-center rounded-2xl bg-stone-50 py-12">
            <ButtonSwatch
              colorHex={product.variants[0].colorHex}
              holeType={product.holeType}
              material={product.material}
              size={240}
              label={product.name}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            {product.variants.map((v) => (
              <div
                key={v.variantSku}
                className="flex flex-col items-center rounded-lg border border-stone-200 p-2"
                title={`${v.sizeLigne}L · ${v.finish}`}
              >
                <ButtonSwatch
                  colorHex={v.colorHex}
                  holeType={product.holeType}
                  material={product.material}
                  size={48}
                />
                <span className="mt-1 text-[11px] text-stone-500">{v.sizeLigne}L</span>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-lg font-semibold">{dict.product.specs}</h2>
          <dl className="mt-2">
            <Spec label={dict.product.material} value={materialLabel} />
            <Spec label={dict.product.attachment} value={holeLabel} />
            <Spec label={dict.product.sizes} value={sizes.map((s) => `${s}L`).join(", ")} />
            <Spec label={dict.product.applications} value={applications || "—"} />
            <Spec label={dict.product.moq} value={`${product.moq} ${unitLabel}`} />
            <Spec
              label={dict.product.leadTime}
              value={fmt(dict.product.leadTimeValue, { days: product.leadTimeDays })}
            />
            {origin && <Spec label={dict.product.origin} value={origin} />}
            {product.certifications.length > 0 && (
              <Spec
                label={dict.product.certifications}
                value={product.certifications.join(locale === "ja" ? "・" : ", ")}
              />
            )}
          </dl>
          {product.careNotes && (
            <p className="mt-4 text-sm text-stone-500">
              <span className="font-medium text-stone-700">{dict.product.careLabel}</span>{" "}
              {product.careNotes}
            </p>
          )}
        </div>

        {/* Title, copy, pricing/order */}
        <div>
          <h1 className="font-serif text-4xl tracking-tight">{product.name}</h1>
          <p className="mt-1 text-sm uppercase tracking-wide text-stone-400">{product.sku}</p>
          <p className="mt-4 text-stone-600">{product.shortDescription}</p>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            {product.longDescription}
          </p>

          <div className="mt-8">
            <PriceBlock
              product={product}
              tier={tier}
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
