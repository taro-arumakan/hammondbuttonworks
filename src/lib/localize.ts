import type { Product } from "./schema";
import type { Locale } from "./i18n-config";

/**
 * Returns a product with its copy localized for `locale`, falling back to the
 * English source for any field a translation doesn't supply. Pure + isomorphic
 * (no server-only deps), so it works in server and client component trees.
 */
export function localizeProduct(product: Product, locale: Locale): Product {
  if (locale === "en") return product;
  const tr = product.translations?.ja;
  if (!tr) return product;

  return {
    ...product,
    name: tr.name ?? product.name,
    shortDescription: tr.shortDescription ?? product.shortDescription,
    longDescription: tr.longDescription ?? product.longDescription,
    careNotes: tr.careNotes ?? product.careNotes,
    seo: {
      title: tr.seo?.title ?? product.seo.title,
      description: tr.seo?.description ?? product.seo.description,
    },
    variants: product.variants.map((v) => ({
      ...v,
      finish: tr.finishes?.[v.finish] ?? v.finish,
    })),
  };
}
