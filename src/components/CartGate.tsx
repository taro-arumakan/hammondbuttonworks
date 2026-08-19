"use client";

import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";
import { useAccountHint } from "@/lib/account-hint";

/**
 * Client-side sign-in gate for the (static) cart page. The old server shell
 * redirected guests via auth(); that made the page dynamic. Now the page is
 * cached and this island decides: account hint → render the cart; guest → a
 * sign-in prompt. The REAL gates are unchanged and server-side — every priced
 * call (/api/cart/quote, /api/checkout) 401s without a valid signed session.
 */
export function CartGate({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const account = useAccountHint();

  if (!account) {
    return (
      <div className="mt-8 rounded-xl border border-dashed border-stone-300 bg-stone-50 p-6">
        <h2 className="text-lg font-semibold">{dict.cart.guestHeading}</h2>
        <p className="mt-2 text-sm text-stone-600">{dict.cart.guestBody}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/login?next=/${locale}/cart`}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            {dict.priceBlock.login}
          </Link>
          <Link
            href={`/${locale}/quote`}
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium hover:border-accent"
          >
            {dict.priceBlock.requestAccess}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
