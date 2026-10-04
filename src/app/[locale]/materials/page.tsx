import type { Metadata } from "next";
import Link from "next/link";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { localeAlternates } from "@/lib/seo";
import { MATERIAL_IMAGES, MATERIAL_SLUGS } from "@/lib/materials";
import { Banner } from "@/components/Banner";

// Static: copy and images only. The index of materials, after Le Labo's
// fragrance index (owner reference, 2026-10): one plain flat-lay per material,
// its name over the photo, linking to that material's own page.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { materials } = getDictionary(locale);
  return {
    title: materials.title,
    description: materials.description,
    alternates: localeAlternates(locale, "/materials"),
  };
}

export default async function MaterialsIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const { materials } = getDictionary(locale);
  const items = MATERIAL_SLUGS.map((slug) => ({
    slug,
    ...materials.items.find((i) => i.id === slug)!,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-2xl tracking-tight">{materials.title}</h1>

      <div className="mt-8 space-y-6 sm:space-y-10">
        {items.map((item, i) => (
          <Link
            key={item.slug}
            href={`/${locale}/materials/${item.slug}`}
            className="group relative block overflow-hidden"
          >
            <div className="transition duration-700 ease-out group-hover:scale-[1.02]">
              <Banner
                images={[{ name: MATERIAL_IMAGES[item.slug].grid, alt: item.gridAlt }]}
                className="aspect-[12/5]"
                sizes="(min-width: 1152px) 1152px, 100vw"
                priority={i === 0}
              />
            </div>
            <span className="absolute inset-0 flex items-center justify-center bg-black/25 px-4 text-center font-serif text-xl uppercase tracking-[0.25em] text-white transition group-hover:bg-black/10 sm:text-3xl">
              {item.name}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
