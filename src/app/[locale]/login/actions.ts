"use server";

import { redirect } from "next/navigation";
import { lookupAccount } from "@/lib/allowlist";
import { createToken } from "@/lib/session";
import { magicLinkEmail, sendEmail } from "@/lib/email";
import { baseUrl } from "@/lib/url";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";

/**
 * Handle a trade-login request.
 * - On the allowlist  → email a magic link, redirect to a "check your inbox" state.
 * - Not on the list    → redirect to a state that points them at the quote form
 *                        (turns a rejected login into a lead).
 *
 * The locale is carried through a hidden form field so redirects + the
 * post-verify landing stay in the user's language.
 */
export async function requestMagicLink(formData: FormData): Promise<void> {
  const rawLocale = String(formData.get("locale") ?? "");
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const email = String(formData.get("email") ?? "").trim();
  if (!email) redirect(`/${locale}/login?status=error`);

  const account = lookupAccount(email);
  if (!account) {
    redirect(`/${locale}/login?status=notfound`);
  }

  const token = await createToken("magic", {
    email: account.email,
    tier: account.tier,
    company: account.company,
  });
  const url = `${await baseUrl()}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${locale}`;

  await sendEmail({
    to: account.email,
    subject: "Your Hammond Button Works sign-in link",
    html: magicLinkEmail(url, account.company),
  });

  redirect(`/${locale}/login?status=sent`);
}
