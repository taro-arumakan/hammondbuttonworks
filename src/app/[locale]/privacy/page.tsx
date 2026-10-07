import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { privacy } = getDictionary(locale);
  return {
    title: privacy.heading,
    description: privacy.metaDescription,
    alternates: localeAlternates(locale, "/privacy"),
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { privacy } = getDictionary(locale);

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
      <h1 className="font-serif text-3xl uppercase tracking-[0.08em] sm:text-4xl">
        {privacy.heading}
      </h1>
      <p className="mt-3 text-sm text-stone-500">{privacy.updated}</p>
      <p className="mt-10 leading-relaxed text-stone-700">{privacy.intro}</p>
      {privacy.sections.map((s) => (
        <section key={s.title} className="mt-10">
          <h2 className="font-serif text-lg">{s.title}</h2>
          {s.body.length === 1 ? (
            <p className="mt-3 leading-relaxed text-stone-700">{s.body[0]}</p>
          ) : (
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-stone-700">
              {s.body.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
