"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-client";

/**
 * Header cart link with a live item count (client-only; the count comes from
 * localStorage, never from priced data). Rendered only for logged-in buyers —
 * guests can't price or order, so no cart affordance for them.
 */
export function CartLink({
  href,
  label,
  variant = "desktop",
  onNavigate,
}: {
  href: string;
  label: string;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const count = useCart().reduce((n, i) => n + i.qty, 0);

  if (variant === "mobile") {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className="block border-b border-line/70 py-3 text-base text-foreground hover:text-accent"
      >
        {label} ({count})
      </Link>
    );
  }

  return (
    <Link href={href} className="hover:text-accent">
      {label} ({count})
    </Link>
  );
}
