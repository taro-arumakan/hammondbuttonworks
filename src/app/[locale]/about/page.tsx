import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";
import { Banner } from "@/components/Banner";
import { Logo } from "@/components/Logo";

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

  // Banner: the owner asked for close-up shots on About (2026-10); the plain
  // grid layouts are kept for the home page banner.
  return (
    <div>
      <Banner
        images={[{ name: "about-horn-closeup", alt: about.bannerAlt }]}
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

        <div className="mt-16 flex justify-center">
          <Logo variant="stamp" className="h-16 w-16 text-foreground/70" />
        </div>
      </div>
    </div>
  );
}
