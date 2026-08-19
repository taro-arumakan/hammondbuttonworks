"use client";

import Link from "next/link";
import { useAccountHint } from "@/lib/account-hint";
import { CartLink } from "./CartLink";

/**
 * The account-dependent slice of the desktop header nav, split out as a client
 * island so the layout (and with it every public page) can render statically.
 * Signed-in state comes from the display-hint cookie — see account-hint.ts.
 * SSR/prerender output is the guest state (a Login button); signed-in users
 * see it swap to their name after hydration.
 */
export function HeaderAccount({
  home,
  labels,
}: {
  home: string;
  labels: { cartPrefix: string; signout: string; login: string };
}) {
  const account = useAccountHint();

  if (!account) {
    return (
      <Link
        href={`${home}/login`}
        className="rounded-md bg-foreground px-3 py-1.5 text-background hover:bg-accent"
      >
        {labels.login}
      </Link>
    );
  }

  return (
    <>
      <CartLink href={`${home}/cart`} label={labels.cartPrefix} />
      {/* No pricing-class badge — customers must not be able to tell their
          tier (standard/plus). The hint cookie doesn't even carry it. */}
      <span className="flex items-center gap-2 text-stone-500">
        <span>{account.company ?? account.email}</span>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="text-xs underline hover:text-accent">
            {labels.signout}
          </button>
        </form>
      </span>
    </>
  );
}
