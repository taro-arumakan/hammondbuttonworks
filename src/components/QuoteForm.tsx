"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n-config";

/**
 * Quote / trade-access request form. Posts JSON to /api/quote, which emails the
 * owner (and the requester), and optionally appends to a Google Sheet.
 *
 * Anti-spam: a hidden honeypot field ("website") bots fill but humans don't,
 * plus a server-signed "formToken" the handler uses to reject submissions that
 * arrive too fast or token-less (see form-guard.ts). The token is fetched on
 * mount (the quote page is static, so it can't be minted at render time) —
 * which keeps the same guarantee: a bot that doesn't run JS never gets one.
 *
 * The `?sku=&qty=` prefills (links from the product page / order panel) are
 * read from location.search after mount for the same reason — reading
 * searchParams server-side would force the page dynamic.
 */
export function QuoteForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.quote;
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [formToken, setFormToken] = useState("");
  const skuRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Prefill sku/qty from the URL (uncontrolled inputs — set once, only if
    // the visitor hasn't already typed something).
    const sp = new URLSearchParams(window.location.search);
    const sku = sp.get("sku");
    const qty = sp.get("qty");
    if (sku && skuRef.current && !skuRef.current.value) skuRef.current.value = sku;
    if (qty && qtyRef.current && !qtyRef.current.value) qtyRef.current.value = qty;

    // Mint the time-trap token. (Also naturally enforces the ≥3s minimum fill
    // time from actual page load.)
    let active = true;
    fetch("/api/form-token")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { token?: string } | null) => {
        if (active && d?.token) setFormToken(d.token);
      })
      .catch(() => {
        /* token stays empty; /api/quote will reject — surfaced via errorGeneric */
      });
    return () => {
      active = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      // Retry path: if the mount-time token fetch failed (network blip), the
      // form must not be a dead end — mint one now. (A sub-3s submit still
      // 400s by design; the user's natural retry then succeeds.)
      let token = formToken;
      if (!token) {
        token = await fetch("/api/form-token")
          .then((r) => (r.ok ? r.json() : null))
          .then((d: { token?: string } | null) => d?.token ?? "")
          .catch(() => "");
        if (token) setFormToken(token);
      }
      data.formToken = token;
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // 400s carry English validation strings — show the localized generic
        // message instead of an untranslated server error.
        throw new Error(res.status === 400 ? t.errorGeneric : (body.error ?? t.errorGeneric));
      }
      setStatus("ok");
      form.reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : t.errorGeneric);
    }
  }

  if (status === "ok") {
    return (
      <div className="rounded-md border border-green-200 bg-green-50 px-4 py-6 text-green-800">
        <p className="font-medium">{t.successTitle}</p>
        <p className="mt-1 text-sm">{t.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* carries the site locale so the ack email is sent in the right language */}
      <input type="hidden" name="locale" value={locale} />
      {/* anti-spam time-trap token (server-signed, stamped at render) */}
      <input type="hidden" name="formToken" value={formToken} />
      {/* honeypot */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="company" label={t.company} required />
        <Field name="name" label={t.name} required />
        <Field name="email" label={t.email} type="email" required />
        <Field name="phone" label={t.phone} />
        <Field name="sku" label={t.sku} inputRef={skuRef} />
        <Field name="qty" label={t.qty} inputRef={qtyRef} />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-stone-700">
          {t.message}
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          required
          placeholder={t.messagePlaceholder}
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      {status === "error" && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-md bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {status === "sending" ? t.sending : t.send}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  inputRef,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        ref={inputRef}
        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}
