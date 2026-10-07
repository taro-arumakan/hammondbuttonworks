/* eslint-disable @next/next/no-img-element */
import { Fragment } from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";
import { Banner } from "@/components/Banner";

// The owner's Nepal photos (2026-10) follow the paragraph about the Nepal
// factory — the 4th of `about.paragraphs`. Keep in sync if the copy moves.
const NEPAL_PARAGRAPH = 3;
const NEPAL_PHOTOS = ["valley", "flag", "lake"] as const;

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
            <Fragment key={i}>
              <p>{p}</p>
              {i === NEPAL_PARAGRAPH && (
                // Phones: the valley full width, the other two side by side.
                <div className="!my-8 grid grid-cols-2 gap-1 sm:grid-cols-3">
                  {NEPAL_PHOTOS.map((name, j) => (
                    <img
                      key={name}
                      src={`/images/site/about-nepal-${name}-1200.jpg`}
                      alt={about.nepalAlts[j]}
                      width={1200}
                      height={900}
                      loading="lazy"
                      className={`aspect-[4/3] w-full object-cover ${j === 0 ? "col-span-2 sm:col-span-1" : ""}`}
                    />
                  ))}
                </div>
              )}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
