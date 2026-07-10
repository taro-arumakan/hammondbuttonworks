"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { CartLink } from "@/components/CartLink";

// Display fields only — the pricing class is never sent to the client.
type Account = { email: string; companyName?: string };

const DURATION = 200; // ms — keep in sync with the `duration-200` classes below

/**
 * Mobile-only nav: a hamburger that opens a stacked panel below the header bar.
 * Shown under `sm`; the desktop inline nav lives in the layout and is hidden on
 * mobile. The panel mounts, then animates (slide-down + fade) in and out; the
 * language switcher stays in the bar (handled by the layout).
 */
export function MobileNav({
  home,
  dict,
  account,
}: {
  home: string;
  dict: Dictionary;
  account?: Account;
}) {
  const [mounted, setMounted] = useState(false); // in the DOM?
  const [visible, setVisible] = useState(false); // animated-in state

  // Mount first, then flip to visible on the next frame so the transition runs.
  useEffect(() => {
    if (!mounted) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [mounted]);

  const open = () => setMounted(true);
  const close = () => {
    setVisible(false);
    setTimeout(() => setMounted(false), DURATION);
  };
  const toggle = () => (mounted ? close() : open());

  // Serif menu (Marcellus/Zen Old Mincho), matching the desktop nav + niceness.jp.
  const linkClass =
    "block py-3 font-serif text-base tracking-[0.02em] text-foreground hover:text-accent border-b border-line/70";

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={toggle}
        aria-label={mounted ? "Close menu" : "Open menu"}
        aria-expanded={mounted}
        className="flex h-9 w-9 items-center justify-center text-foreground"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          {mounted ? (
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

      {mounted && (
        <>
          {/* click-away backdrop */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={close}
            className={`fixed inset-0 top-16 z-10 cursor-default bg-foreground/10 transition-opacity duration-200 ease-out ${
              visible ? "opacity-100" : "opacity-0"
            }`}
          />
          <nav
            className={`absolute left-0 right-0 top-full z-20 border-b border-line bg-surface px-4 pb-4 shadow-sm transition duration-200 ease-out ${
              visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
            }`}
          >
            <Link href={`${home}/catalog`} onClick={close} className={linkClass}>
              {dict.nav.catalog}
            </Link>
            <Link href={`${home}/about`} onClick={close} className={linkClass}>
              {dict.nav.about}
            </Link>
            <Link href={`${home}/quote`} onClick={close} className={linkClass}>
              {dict.nav.quote}
            </Link>

            {account && (
              <CartLink
                href={`${home}/cart`}
                label={dict.nav.cartPrefix}
                variant="mobile"
                onNavigate={close}
              />
            )}

            {account ? (
              <div className="flex items-center justify-between pt-4">
                <span className="flex items-center gap-2 text-sm text-stone-500">
                  <span className="truncate">{account.companyName ?? account.email}</span>
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
