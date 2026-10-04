import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PAGE_REVALIDATE, getAllProducts } from "@/lib/products";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";
import { colorwaysOfMaterial, toColorways, toTiles } from "@/lib/catalog";
import { MATERIAL_IMAGES, MATERIAL_SLUGS, isMaterialSlug } from "@/lib/materials";
import { Banner } from "@/components/Banner";
import { CopyBlocks } from "@/components/CopyBlocks";
import { CatalogBrowser } from "@/components/CatalogBrowser";

/**
 * One material's page: the owner's copy, then the catalog pre-filtered to that
 * material. Static + ISR exactly like the catalog listing (see the notes in
 * catalog/page.tsx): the price-free tile set is embedded and CatalogBrowser
 * filters it client-side, so facet query strings stay edge-cache hits.
 * Which colourways belong here is decided in lib/materials.ts.
 */
// Must be a literal — keep in sync with PAGE_REVALIDATE in lib/products.ts.
export const revalidate = 3600;
// The four materials are the whole set; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return MATERIAL_SLUGS.map((material) => ({ material }));
}

async function resolve(params: Promise<{ locale: string; material: string }>) {
  const { locale: raw, material } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const item = isMaterialSlug(material)
    ? dict.materials.items.find((i) => i.id === material)
    : undefined;
  return { locale, dict, item };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; material: string }>;
}): Promise<Metadata> {
  const { locale, dict, item } = await resolve(params);
  if (!item) return {};
  const lead = item.blocks[0]?.join(locale === "ja" ? "" : " ");
  return {
    title: item.name,
    description: lead || dict.materials.description,
    alternates: localeAlternates(locale, `/materials/${item.id}`),
  };
}

export default async function MaterialPage({
  params,
}: {
  params: Promise<{ locale: string; material: string }>;
}) {
  const { locale, dict, item } = await resolve(params);
  if (!item || !isMaterialSlug(item.id)) notFound();
  const slug = item.id;

  const products = (await getAllProducts(PAGE_REVALIDATE)).map((p) => localizeProduct(p, locale));
  // toTiles is the invariant-#1 choke point: no price crosses into the client.
  const tiles = toTiles(colorwaysOfMaterial(toColorways(products, dict.labels.color), slug));

  return (
    <div>
      <Banner
        images={[{ name: MATERIAL_IMAGES[slug].banner, alt: item.imageAlt }]}
        className="aspect-[3/1]"
        priority
      />

      <div className="mx-auto max-w-6xl px-4 pt-10">
        <Link href={`/${locale}/materials`} className="text-sm text-stone-500 hover:text-accent">
          {dict.materials.backLink}
        </Link>
        <div className="mt-8 max-w-2xl">
          <p className="font-serif text-sm uppercase tracking-[0.2em] text-accent">{item.name}</p>
          <h1 className="mt-3 font-serif text-3xl tracking-tight sm:text-4xl">{item.title}</h1>
          {item.blocks.length > 0 && (
            <CopyBlocks
              blocks={item.blocks}
              locale={locale}
              className="mt-6 space-y-5 leading-relaxed text-stone-700"
            />
          )}
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="font-serif text-2xl tracking-tight">{dict.materials.rangeTitle}</h2>
        {tiles.length > 0 ? (
          <div className="mt-6">
            <CatalogBrowser
              tiles={tiles}
              locale={locale}
              basePath={`/${locale}/materials/${slug}`}
              dict={dict}
            />
          </div>
        ) : (
          // e.g. piece-dyed buffalo before its prices land: the series exists,
          // the online catalog just has nothing to list yet.
          <div className="mt-6 border border-line px-6 py-10 text-stone-600">
            <p>{dict.materials.empty}</p>
            <Link
              href={`/${locale}/quote`}
              className="mt-4 inline-block text-sm text-accent hover:underline"
            >
              {dict.materials.emptyCta}
            </Link>
          </div>
        )}
      </section>

      <div className="mx-auto max-w-6xl border-t border-line px-4 py-12">
        <Link href={`/${locale}/quote`} className="font-serif text-lg hover:text-accent">
          {dict.materials.customLink}
        </Link>
      </div>
    </div>
  );
}
