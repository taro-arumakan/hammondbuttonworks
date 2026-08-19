import type { Metadata } from "next";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { CartGate } from "@/components/CartGate";
import { CartView } from "@/components/CartView";

/**
 * Static shell — the cart itself is entirely client-side (localStorage
 * selections; prices arrive per-render from the gated /api/cart/quote). The
 * guest redirect moved into CartGate: a guest sees a sign-in prompt instead,
 * and every priced/ordering API still 401s without a signed session.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: dict.cart.title, robots: { index: false } };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl tracking-tight">{dict.cart.title}</h1>
      <p className="mt-2 max-w-2xl text-stone-600">{dict.cart.subtitle}</p>
      <CartGate locale={locale} dict={dict}>
        <CartView locale={locale} dict={dict} />
      </CartGate>
    </div>
  );
}
