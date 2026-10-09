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

const FEATURE_IMAGES = [
  "/images/site/feature-pouch-1200.jpg",
  "/images/site/feature-sample-card-1200.jpg",
] as const;

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

  // Home shows a taster of the range (3 rows of 4 on desktop, the owner's
  // spec 2026-10-09) — the full catalog lives behind "View all". Without the
  // cap this would render all ~200 designs.
  // One tile per design here (its first colourway), not per colourway, so the
  // teaser shows breadth rather than colour repeats.
  const products = (await getAllProducts(PAGE_REVALIDATE))
    .slice(0, 12)
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
          // Added 2026-10-08 (Taro): the four sample-card sheets on a light ground.
          { name: "banner-sample-cards", alt: dict.home.bannerAlt, phoneGround: "#f8f7f5" },
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

      {/* Materials row — one close-up per material, each linking to that
          material's own page (see lib/materials.ts for the images). Owner's
          layout (2026-10): straight after the intro, in the same text column. */}
      <section className="mx-auto max-w-6xl px-4 pb-16 pt-14">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-3xl tracking-tight">{dict.home.materialsTitle}</h2>
          <Link href={`/${locale}/materials`} className="text-sm text-accent hover:underline">
            {dict.home.materialsMore}
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-2 gap-y-5 lg:gap-y-6">
          {MATERIAL_SLUGS.map((slug) => {
            const m = dict.materials.items.find((i) => i.id === slug)!;
            return (
              <Link key={slug} href={`/${locale}/materials/${slug}`} className="group block">
                <div className="overflow-hidden bg-[#141312]">
                  <img
                    src={`/images/site/${MATERIAL_IMAGES[slug].card}-1200.jpg`}
                    alt={m.cardAlt}
                    width={1200}
                    height={800}
                    loading="lazy"
                    className="w-full transition duration-300 group-hover:scale-[1.02]"
                  />
                </div>
                {/* The whole card is the link, so "View more" is a styled span
                    rather than a nested <a>. It wraps under the name on the
                    narrow mobile cards. */}
                <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 className="font-serif text-sm uppercase leading-snug tracking-[0.2em] group-hover:text-accent sm:text-base">
                    {m.name}
                  </h3>
                  <span className="font-serif text-[11px] uppercase tracking-[0.1em] text-stone-600 underline underline-offset-4 group-hover:text-accent sm:text-xs">
                    {dict.home.materialsViewMore}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Value props — owner's layout (2026-10): two photos on the left, the
          three props stacked on the right, spread so the text block's top and
          bottom line up with the photos' edges. Japanese copy breaks at each 。 so
          every sentence sits on its own line. Photos are the owner's catalog
          shots 0826_000706 (pouch) and 0826_000707 (sample card). */}
      <section className="pb-14 xl:mx-auto xl:grid xl:max-w-[1600px] xl:grid-cols-[2fr_1fr] xl:px-6 xl:py-16">
        <div className="grid grid-cols-2">
          {FEATURE_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={dict.home.propsImageAlts[i]}
              width={1200}
              height={1200}
              loading="lazy"
              className="aspect-square w-full object-cover"
            />
          ))}
        </div>
        <div className="mx-auto max-w-6xl space-y-8 px-4 pt-10 xl:mx-0 xl:flex xl:flex-col xl:justify-between xl:space-y-0 xl:pl-16 xl:pr-0 xl:pt-0">
          {dict.home.props.map((b) => (
            <div key={b.t} className="xl:last:-mb-2">
              <h3 className="font-serif text-2xl sm:text-3xl xl:text-4xl xl:leading-none">{b.t}</h3>
              <p className="mt-3 text-sm leading-loose text-stone-600 sm:text-base xl:mt-4">
                {b.d.split(/(?<=。)/).map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
          ))}
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
