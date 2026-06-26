import Link from "next/link";
import type { Product, Tier } from "@/lib/schema";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import { ButtonSwatch } from "./ButtonSwatch";
import { resolvePrice, formatPrice } from "@/lib/pricing";

/**
 * Flat, gridline-separated catalog cell (FreshService-style). The parent grid
 * draws its top + left edge; each cell draws its right + bottom edge, so the
 * cards tile into one continuous grid with no gaps.
 *
 * Price shows only when a `tier` is passed (logged-in trade account); guests
 * see a neutral "Trade pricing" tag — no numbers ever enter the guest payload.
 *
 * `product` is expected to already be localized for `locale` by the caller.
 */
export function ProductCard({
  product,
  tier,
  locale,
  dict,
}: {
  product: Product;
  tier: Tier | null;
  locale: Locale;
  dict: Dictionary;
}) {
  const hero = product.variants[0];
  const priced = tier ? resolvePrice(hero, tier, product.moq) : null;
  const minLigne = Math.min(...product.variants.map((v) => v.sizeLigne));

  const materialLabel = dict.labels.material[product.material] ?? product.material;
  const holeLabel = dict.labels.holeType[product.holeType] ?? product.holeType;
  const unitLabel = dict.labels.unit[product.unit] ?? product.unit;

  return (
    <Link
      href={`/${locale}/catalog/${product.slug}`}
      className="group flex flex-col border-r border-b border-line bg-surface transition-colors hover:bg-background"
    >
      <div className="flex aspect-square items-center justify-center overflow-hidden p-6">
        <ButtonSwatch
          colorHex={hero.colorHex}
          holeType={product.holeType}
          material={product.material}
          face={product.face}
          size={150}
          label={product.name}
          className="transition-transform duration-300 ease-out group-hover:scale-105"
        />
      </div>
      <div className="border-t border-line px-4 py-3">
        <h3 className="font-serif text-lg leading-tight text-foreground">
          {product.name}
        </h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
          {materialLabel} · {holeLabel} · {dict.catalog.fromLigne} {minLigne}L
        </p>
        <div className="mt-2 text-sm">
          {priced ? (
            <span className="font-medium text-foreground">
              {dict.catalog.fromLigne} {formatPrice(priced.unitPrice, priced.currency)}
              <span className="text-stone-400"> / {unitLabel}</span>
            </span>
          ) : (
            <span className="text-xs text-stone-500">
              {tier ? " " : dict.catalog.cardTradePricing}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
