import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";
import { Banner } from "@/components/Banner";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  return {
    title: dict.nav.about,
    description: dict.about.lead,
    alternates: localeAlternates(locale, "/about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { about } = getDictionary(locale);

  // Banner: the owner's pick (2026-10), 0826_000765 from the 0901 shoot —
  // buttons in a dark wooden bowl. The horn close-up it replaced now heads
  // /quote.
  return (
    <div>
      <Banner
        images={[{ name: "about-bowl", alt: about.bannerAlt }]}
        className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
        priority
      />

      <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <p className="font-serif text-sm uppercase tracking-[0.2em] text-accent">
          {about.eyebrow}
        </p>
        <h1 className="mt-3 font-serif text-3xl uppercase tracking-[0.08em] sm:text-4xl">
          {about.heading}
        </h1>

        <div className="mt-10 space-y-5 leading-relaxed text-stone-700">
          <p>{about.lead}</p>
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
