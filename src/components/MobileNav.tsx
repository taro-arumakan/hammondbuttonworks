"use client";

import { useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";

type Account = { email: string; tier?: string; companyName?: string };

/**
 * Mobile-only nav: a hamburger that opens a stacked panel below the header bar.
 * Shown under `sm`; the desktop inline nav lives in the layout and is hidden on
 * mobile. The language switcher stays in the bar (handled by the layout).
 */
export function MobileNav({
  home,
  dict,
  account,
  cartEnabled,
}: {
  home: string;
  dict: Dictionary;
  account?: Account;
  cartEnabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const linkClass =
    "block py-3 text-base text-foreground hover:text-accent border-b border-line/70";

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center text-foreground"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          {open ? (
            <>
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </>
          ) : (
            <>
              <line x1="3" y1="7" x2="21" y2="7" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="17" x2="21" y2="17" />
            </>
          )}
        </svg>
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={close}
            className="fixed inset-0 top-16 z-10 cursor-default bg-foreground/10"
          />
          <nav className="absolute left-0 right-0 top-full z-20 border-b border-line bg-surface px-4 pb-4 shadow-sm">
            <Link href={`${home}/catalog`} onClick={close} className={linkClass}>
              {dict.nav.catalog}
            </Link>
            <Link href={`${home}/about`} onClick={close} className={linkClass}>
              {dict.nav.about}
            </Link>
            <Link href={`${home}/quote`} onClick={close} className={linkClass}>
              {dict.nav.quote}
            </Link>

            {cartEnabled && account && (
              <button className="snipcart-checkout block w-full py-3 text-left text-base text-foreground hover:text-accent border-b border-line/70">
                {dict.nav.cartPrefix} (<span className="snipcart-items-count">0</span>)
              </button>
            )}

            {account ? (
              <div className="flex items-center justify-between pt-4">
                <span className="flex items-center gap-2 text-sm text-stone-500">
                  <span className="truncate">{account.companyName ?? account.email}</span>
                  <span className="rounded bg-stone-200/60 px-2 py-0.5 text-xs uppercase tracking-wide">
                    {account.tier?.replace("tier_", "") ?? "trade"}
                  </span>
                </span>
                <form action="/api/auth/logout" method="post">
                  <button type="submit" className="text-sm underline hover:text-accent">
                    {dict.nav.signout}
                  </button>
                </form>
              </div>
            ) : (
              <Link
                href={`${home}/login`}
                onClick={close}
                className="mt-4 block rounded-md bg-foreground px-3 py-2.5 text-center text-background hover:bg-accent"
              >
                {dict.nav.login}
              </Link>
            )}
          </nav>
        </>
      )}
    </div>
  );
}
