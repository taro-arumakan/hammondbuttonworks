/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { PAGE_REVALIDATE, getAllProducts } from "@/lib/products";
import { toColorways } from "@/lib/catalog";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { ProductCard } from "@/components/ProductCard";
import { GuestOnly } from "@/components/GuestOnly";
import { Banner } from "@/components/Banner";
import { MATERIAL_IMAGES, MATERIAL_SLUGS } from "@/lib/materials";
import { localeAlternates } from "@/lib/seo";

// Static + ISR: no session reads in the render path (prices hydrate client-side
// through the gated API), so guests and crawlers are served from the page
// cache. Catalog data refreshes hourly; prices are always live via the API.
// Must be a literal (Next statically analyzes segment config) — keep in sync
// with PAGE_REVALIDATE in lib/products.ts, which the data fetches also use.
export const revalidate = 3600;

/** Title/description come from the locale layout; this adds canonical + hreflang. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return { alternates: localeAlternates(locale, "") };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  // Home shows a taster of the range (2 rows of 4) — the full catalog lives
  // behind "View all". Without the cap this would render all ~200 designs.
  // One tile per design here (its first colourway), not per colourway, so the
  // teaser shows breadth rather than colour repeats.
  const products = (await getAllProducts(PAGE_REVALIDATE))
    .slice(0, 8)
    .map((p) => localizeProduct(p, locale));
  const tiles = products
    .map((p) => toColorways([p], dict.labels.color)[0])
    .filter((cw): cw is NonNullable<typeof cw> => !!cw);

  return (
    <div>
      {/* Banner: the owner's three picks for the main banner (2026-10-06,
          Drive "top page banner source images"), in the folder's file order. */}
      <Banner
        images={[
          { name: "banner-metal-rows", alt: dict.home.bannerAlt },
          { name: "banner-horn-rows", alt: dict.home.bannerAlt },
          { name: "banner-horn-diagonal", alt: dict.home.bannerAlt },
        ]}
        priority
      />

      {/* Intro */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-serif text-sm uppercase tracking-[0.2em] text-accent">
            {dict.home.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
            {dict.home.title}
          </h1>
          <p className="mt-4 max-w-3xl whitespace-pre-line text-base leading-relaxed text-stone-600">
            {dict.home.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/${locale}/catalog`}
              className="rounded-md bg-foreground px-5 py-3 font-medium text-background hover:bg-accent"
            >
              {dict.home.browse}
            </Link>
            <Link
              href={`/${locale}/quote`}
              className="rounded-md border border-foreground/30 px-5 py-3 font-medium hover:border-accent hover:text-accent"
            >
              {dict.home.requestQuote}
            </Link>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-8 sm:grid-cols-3">
          {dict.home.props.map((b) => (
            <div key={b.t}>
              <h3 className="font-serif text-xl">{b.t}</h3>
              <p className="mt-1 text-sm text-stone-600">{b.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Materials row — one close-up per material, each linking to that
          material's own page (see lib/materials.ts for the images). */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-3xl tracking-tight">{dict.home.materialsTitle}</h2>
          <Link href={`/${locale}/materials`} className="text-sm text-accent hover:underline">
            {dict.home.materialsMore}
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 lg:gap-x-8 lg:gap-y-12">
          {MATERIAL_SLUGS.map((slug) => {
            const m = dict.materials.items.find((i) => i.id === slug)!;
            return (
              <Link key={slug} href={`/${locale}/materials/${slug}`} className="group block">
                <div className="overflow-hidden bg-[#141312]">
                  <img
                    src={`/images/site/${MATERIAL_IMAGES[slug].card}-1200.jpg`}
                    alt={m.imageAlt}
                    width={1200}
                    height={800}
                    loading="lazy"
                    className="w-full transition duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                <h3 className="mt-3 font-serif text-sm uppercase leading-snug tracking-[0.2em] group-hover:text-accent sm:text-base">
                  {m.name}
                </h3>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-3xl tracking-tight">{dict.home.rangeTitle}</h2>
          <Link href={`/${locale}/catalog`} className="text-sm text-accent hover:underline">
            {dict.home.viewAll}
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-[2px] lg:grid-cols-4">
          {tiles.map((cw) => (
            <ProductCard
              key={cw.key}
              slug={cw.product.slug}
              name={cw.product.name}
              category={cw.product.category}
              color={cw.color}
              colorLabel={cw.colorLabel}
              image={cw.image}
              sizesMm={cw.variants.map((v) => v.sizeMm)}
              locale={locale}
              dict={dict}
            />
          ))}
        </div>
        <GuestOnly>
          <p className="mt-6 text-sm text-stone-500">
            {dict.home.guestNote}{" "}
            <Link href={`/${locale}/login`} className="underline">
              {dict.home.guestLogin}
            </Link>{" "}
            {dict.home.guestOr}{" "}
            <Link href={`/${locale}/quote`} className="underline">
              {dict.home.guestAccess}
            </Link>
            .
          </p>
        </GuestOnly>
      </section>
    </div>
  );
}
