import type { ReactNode } from "react";

/**
 * Pass-through root layout. The real <html>/<body> + chrome live in
 * `[locale]/layout.tsx` so the `lang` attribute and all copy can be
 * locale-aware. Every page lives under a `/{locale}` segment; middleware
 * redirects bare paths to a locale.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
