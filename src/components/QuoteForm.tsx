"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

/**
 * Quote / trade-access request form. Posts JSON to /api/quote, which emails the
 * owner (and the requester), and optionally appends to a Google Sheet. Includes
 * a hidden honeypot field ("website") — bots fill it, humans don't.
 */
export function QuoteForm({
  dict,
  defaultSku,
  defaultQty,
}: {
  dict: Dictionary;
  defaultSku?: string;
  defaultQty?: string;
}) {
  const t = dict.quote;
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const res = await fetch("/api/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? t.errorGeneric);
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
        <Field name="sku" label={t.sku} defaultValue={defaultSku} />
        <Field name="qty" label={t.qty} defaultValue={defaultQty} />
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
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
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
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
    </div>
  );
}
