import en from "./dictionaries/en";
import ja from "./dictionaries/ja";
import { DEFAULT_LOCALE, type Locale } from "./i18n-config";

/**
 * The English dictionary is the canonical shape; `ja` is type-checked against
 * it at the `DICTS` assignment below (missing keys fail the build).
 */
export type Dictionary = typeof en;

const DICTS: Record<Locale, Dictionary> = { en, ja };

export function getDictionary(locale: Locale): Dictionary {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

export { type Locale } from "./i18n-config";
