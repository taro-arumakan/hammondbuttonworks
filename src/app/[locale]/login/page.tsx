import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { requestMagicLink } from "./actions";
import { getDictionary } from "@/lib/i18n";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";
import { LoginStatus } from "@/components/LoginStatus";

// Static: the ?status= banner is a client island (LoginStatus) so the page —
// linked from every guest header — serves from the cache instead of invoking
// a function per crawler hit.

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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: raw } = await params;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl tracking-tight">{dict.login.title}</h1>
      <p className="mt-2 text-stone-600">{dict.login.subtitle}</p>

      {/* Suspense keeps the page prerenderable despite useSearchParams. */}
      <Suspense fallback={null}>
        <LoginStatus locale={locale} dict={dict} />
      </Suspense>

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
