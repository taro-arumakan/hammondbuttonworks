import Link from "next/link";
import { auth } from "@/lib/auth";
import { getAllProducts } from "@/lib/products";
import { fromUnitPriceOf } from "@/lib/pricing";
import { toColorways } from "@/lib/catalog";
import { localizeProduct } from "@/lib/localize";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { ProductCard } from "@/components/ProductCard";
import { Logo } from "@/components/Logo";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  const session = await auth();
  const customerClass = session?.user.customerClass ?? null;
  // Home shows a taster of the range (2 rows of 4) — the full catalog lives
  // behind "View all". Without the cap this would render all ~200 designs.
  // One tile per design here (its first colourway), not per colourway, so the
  // teaser shows breadth rather than colour repeats.
  const products = (await getAllProducts())
    .slice(0, 8)
    .map((p) => localizeProduct(p, locale));
  const tiles = products
    .map((p) => toColorways([p])[0])
    .filter((cw): cw is NonNullable<typeof cw> => !!cw);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-line bg-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 md:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="font-serif text-sm uppercase tracking-[0.2em] text-accent">
              {dict.home.eyebrow}
            </p>
            <h1 className="mt-4 max-w-2xl font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
              {dict.home.title}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-stone-600">{dict.home.subtitle}</p>
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
          <div className="hidden justify-center md:flex">
            <Logo variant="full" className="w-full max-w-xs text-foreground" />
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
              product={cw.product}
              color={cw.color}
              image={cw.image}
              sizesMm={cw.variants.map((v) => v.sizeMm)}
              price={fromUnitPriceOf(cw.variants, cw.product.currency, customerClass)}
              locale={locale}
              dict={dict}
            />
          ))}
        </div>
        {!customerClass && (
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
        )}
      </section>
    </div>
  );
}
