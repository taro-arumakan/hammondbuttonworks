"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";

/**
 * The ?status=… banner of the (static) login page. Reads the query via
 * useSearchParams — NOT a mount-time location.search read: the post-submit
 * redirect (server action → /login?status=sent) is a SOFT navigation that
 * keeps this component mounted, so only a reactive source re-renders the
 * banner. The page wraps this in <Suspense fallback={null}>, which keeps the
 * route fully static (the banner is never in the prerendered HTML anyway).
 */
export function LoginStatus({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const status = useSearchParams().get("status");

  const messages: Record<string, { tone: "info" | "warn" | "error"; text: string }> = {
    sent: { tone: "info", text: dict.login.msgSent },
    notfound: { tone: "warn", text: dict.login.msgNotfound },
    invalid: { tone: "error", text: dict.login.msgInvalid },
    error: { tone: "error", text: dict.login.msgError },
  };
  const message = status ? messages[status] : undefined;
  if (!message) return null;

  return (
    <div
      className={`mt-6 rounded-md border px-4 py-3 text-sm ${
        message.tone === "info"
          ? "border-green-200 bg-green-50 text-green-800"
          : message.tone === "warn"
            ? "border-amber-200 bg-amber-50 text-amber-800"
            : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {message.text}
      {status === "notfound" && (
        <>
          {" "}
          <Link href={`/${locale}/quote`} className="font-medium underline">
            {dict.login.requestQuoteLink}
          </Link>
        </>
      )}
    </div>
  );
}
