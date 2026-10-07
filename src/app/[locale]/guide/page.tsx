import Link from "next/link";
import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";
import type { GuideLink, GuideSegment } from "@/lib/guide";

const CONTACT_EMAIL = "info@hammondbutton.works";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { guide } = getDictionary(locale);
  return {
    title: guide.title,
    description: guide.description,
    alternates: localeAlternates(locale, "/guide"),
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { guide } = getDictionary(locale);

  // There is no terms page yet, so "terms" renders as plain text until one
  // exists. Registration is the trade-access request, which goes through the
  // inquiry form (/quote) — the same place the login page sends new buyers.
  const hrefs: Record<GuideLink, string | null> = {
    terms: null,
    register: `/${locale}/quote`,
    login: `/${locale}/login`,
    email: `mailto:${CONTACT_EMAIL}`,
  };

  const renderText = (text: GuideSegment[]) =>
    text.map((seg, i) => {
      if (typeof seg === "string") return seg;
      const href = hrefs[seg.link];
      if (!href) return <span key={i}>{seg.text}</span>;
      const className = "text-accent underline underline-offset-4 hover:opacity-80";
      return seg.link === "email" ? (
        <a key={i} href={href} className={className}>
          {seg.text}
        </a>
      ) : (
        <Link key={i} href={href} className={className}>
          {seg.text}
        </Link>
      );
    });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-20">
      <p className="font-serif text-sm uppercase tracking-[0.2em] text-accent">{guide.eyebrow}</p>
      <h1 className="mt-3 font-serif text-3xl tracking-[0.04em] sm:text-4xl">{guide.title}</h1>

      <div className="mt-12 space-y-12">
        {guide.sections.map((section) => (
          <section key={section.heading} className="border-t border-line pt-8">
            <h2 className="font-serif text-xl tracking-[0.02em]">{section.heading}</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-stone-700">
              {section.blocks.map((block, i) => {
                if (block.kind === "list") {
                  return (
                    <ul key={i} className="list-disc space-y-1 pl-6">
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={i} className={block.kind === "note" ? "text-sm text-stone-500" : undefined}>
                    {renderText(block.text)}
                  </p>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
