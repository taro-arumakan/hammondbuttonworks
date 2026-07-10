"use server";

import { redirect } from "next/navigation";
import { resolveTradeAccount } from "@/lib/shopify";
import { createToken } from "@/lib/session";
import { magicLinkEmail, sendEmail } from "@/lib/email";
import { baseUrl } from "@/lib/url";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n-config";

/**
 * Handle a trade-login request.
 * - Known trade account → email a magic link, redirect to a "check your inbox" state.
 *   Accounts resolve from Shopify (segment-gated) with an allowlist fallback.
 * - Unknown           → redirect to a state that points them at the quote form
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

  const account = await resolveTradeAccount(email);
  if (!account) {
    redirect(`/${locale}/login?status=notfound`);
  }

  const token = await createToken("magic", {
    email: account.email,
    customerClass: account.customerClass,
    company: account.company,
  });
  const url = `${await baseUrl()}/api/auth/verify?token=${encodeURIComponent(token)}&locale=${locale}`;

  await sendEmail({
    to: account.email,
    subject: "Your Hammond Button Works trade catalogue link",
    html: magicLinkEmail(url, account.company),
    // A monitored reply-to (vs pure no-reply) reads as a legitimate sender and
    // lets a stuck customer just reply. Falls back gracefully if unset.
    replyTo: process.env.CONTACT_INBOX ?? process.env.QUOTE_INBOX,
  });

  redirect(`/${locale}/login?status=sent`);
}
