import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { CartView } from "@/components/CartView";

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

  // Ordering requires a trade session (prices are gated); guests go to login.
  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login?next=/${locale}/cart`);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-4xl tracking-tight">{dict.cart.title}</h1>
      <p className="mt-2 max-w-2xl text-stone-600">{dict.cart.subtitle}</p>
      <CartView locale={locale} dict={dict} />
    </div>
  );
}
