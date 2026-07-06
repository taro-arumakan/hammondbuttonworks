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

  // Simple one-pager: no page title — the lead line reads as the first body
  // paragraph (owner direction, 2026-07).
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24">
      <Logo variant="full" className="w-56" />

      <div className="mt-12 space-y-5 leading-relaxed text-stone-700">
        <p>{about.lead}</p>
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
