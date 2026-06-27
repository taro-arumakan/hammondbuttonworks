import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { Logo } from "@/components/Logo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: dict.nav.about, description: dict.about.lead };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { about } = getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Logo variant="full" className="w-56" />

      <p className="mt-10 font-serif text-sm uppercase tracking-[0.2em] text-accent">
        {about.eyebrow}
      </p>
      <h1 className="mt-3 font-serif text-3xl leading-snug tracking-tight sm:text-4xl">
        {about.lead}
      </h1>

      <div className="mt-8 space-y-5 border-t border-line pt-8 leading-relaxed text-stone-600">
        {about.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Logo variant="stamp" className="h-16 w-16 text-foreground/70" />
      </div>
    </div>
  );
}
