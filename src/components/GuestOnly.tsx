"use client";

import { useAccountHint } from "@/lib/account-hint";

/**
 * Renders its children only for guests (no account-hint cookie). Used on
 * static pages for guest-facing copy ("sign in to see prices") that should
 * disappear once a buyer is signed in. SSR/prerender output includes the
 * children — the static page IS the guest view.
 */
export function GuestOnly({ children }: { children: React.ReactNode }) {
  const account = useAccountHint();
  if (account) return null;
  return <>{children}</>;
}
