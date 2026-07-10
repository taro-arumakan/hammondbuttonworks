import type { Metadata } from "next";
import Link from "next/link";
import { Marcellus, Zen_Old_Mincho } from "next/font/google";
import { staffSession } from "@/lib/auth";
import "../globals.css";

/**
 * Admin (staff) surface. Same app + deploy as the storefront — so the pricing
 * multiplier, segment lookup and draft-order code cannot fork — but served only
 * on ADMIN_HOST and behind a staff session (see src/middleware.ts).
 *
 * Not locale-prefixed: this is an internal tool, Japanese only.
 */
const display = Marcellus({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const jp = Zen_Old_Mincho({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-jp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: { default: "スタッフツール", template: "%s · HBW スタッフツール" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const staff = await staffSession();

  return (
    <html lang="ja" className={`${display.variable} ${jp.variable}`}>
      <body className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-line">
          <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
            <Link href="/admin" className="font-serif text-sm tracking-[0.08em]">
              HAMMOND BUTTON WORKS · スタッフツール
            </Link>
            {staff && (
              <span className="flex items-center gap-3 text-xs text-stone-500">
                <span>{staff.email}</span>
                <form action="/api/admin/auth/logout" method="post">
                  <button type="submit" className="underline hover:text-accent">
                    ログアウト
                  </button>
                </form>
              </span>
            )}
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line mt-16">
          <p className="mx-auto max-w-3xl px-4 py-6 text-xs text-stone-400">
            社内用ツールです。URL・ログイン情報を社外に共有しないでください。
          </p>
        </footer>
      </body>
    </html>
  );
}
