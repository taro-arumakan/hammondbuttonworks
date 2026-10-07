"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";

/**
 * Footer newsletter sign-up. Posts to /api/newsletter, which records the
 * address in Shopify with e-mail marketing consent.
 *
 * Same anti-spam as QuoteForm (honeypot + signed time-trap token), except the
 * token is fetched when the visitor first focuses the form, not on mount: the
 * footer is on every page, and a mount-time fetch would turn every static,
 * CDN-cached page view (bots included) into a function invocation.
 */
export function NewsletterForm({
  t,
  privacyHref,
  locale,
}: {
  t: Dictionary["footer"]["newsletter"];
  privacyHref: string;
  locale: Locale;
}) {
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const token = useRef<Promise<string> | null>(null);

  function fetchToken(): Promise<string> {
    return fetch("/api/form-token")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { token?: string } | null) => d?.token ?? "")
      .catch(() => "");
  }

  function warmToken() {
    token.current ??= fetchToken();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      let formToken = await (token.current ?? fetchToken());
      if (!formToken) formToken = await fetchToken(); // the focus-time fetch failed
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, consent: data.consent === "on", formToken }),
      });
      if (!res.ok) throw new Error();
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("error");
      token.current = null; // a spent or expired token: mint a fresh one next time
    }
  }

  if (status === "ok") {
    return (
      <p role="status" className="mt-10 text-[15px] leading-relaxed">
        {t.success}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} onFocus={warmToken} className="mt-10">
      <input type="hidden" name="locale" value={locale} />
      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <label htmlFor="newsletter-email" className="sr-only">
        {t.label}
      </label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder={t.placeholder}
        className="w-full border-0 border-b border-white/70 bg-transparent px-0 py-3 text-base tracking-[0.04em] text-white placeholder:text-white/80 focus:border-white focus:outline-none"
      />

      <label className="mt-6 flex items-start gap-3 text-[13px] uppercase leading-relaxed tracking-[0.08em]">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-white"
        />
        <span>
          {t.consentBefore}
          <Link href={privacyHref} className="underline underline-offset-4 hover:text-white/60">
            {t.consentLink}
          </Link>
          {t.consentAfter}
        </span>
      </label>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-6 w-full rounded-sm bg-white/20 py-4 text-[15px] uppercase tracking-[0.12em] transition hover:bg-white/30 disabled:opacity-60"
      >
        {status === "sending" ? t.sending : t.submit}
      </button>

      {status === "error" && (
        <p role="alert" className="mt-3 text-sm text-red-300">
          {t.error}
        </p>
      )}
    </form>
  );
}
