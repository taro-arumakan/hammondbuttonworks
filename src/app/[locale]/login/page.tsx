import Link from "next/link";
import type { Metadata } from "next";
import { requestMagicLink } from "./actions";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE);
  return { title: dict.login.title };
}

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);
  const { status } = await searchParams;

  const messages: Record<string, { tone: "info" | "warn" | "error"; text: string }> = {
    sent: { tone: "info", text: dict.login.msgSent },
    notfound: { tone: "warn", text: dict.login.msgNotfound },
    invalid: { tone: "error", text: dict.login.msgInvalid },
    error: { tone: "error", text: dict.login.msgError },
  };
  const message = status ? messages[status] : undefined;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl tracking-tight">{dict.login.title}</h1>
      <p className="mt-2 text-stone-600">{dict.login.subtitle}</p>

      {message && (
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
      )}

      <form action={requestMagicLink} className="mt-8 space-y-4">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">
            {dict.login.emailLabel}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={dict.login.emailPlaceholder}
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-accent px-4 py-2.5 font-medium text-white hover:opacity-90"
        >
          {dict.login.submit}
        </button>
      </form>

      <p className="mt-6 text-xs text-stone-500">
        {dict.login.notTrade}{" "}
        <Link href={`/${locale}/quote`} className="underline">
          {dict.login.requestAccess}
        </Link>
        .
      </p>
    </div>
  );
}
