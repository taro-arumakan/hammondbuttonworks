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
  // Clean sign-in URL (/{locale}/signin/{token}) — reads less like a phishing
  // link than /api/auth/verify?token=… on a new domain. Token is URL-safe
  // (base64url + dots), so it needs no encoding as a path segment.
  const url = `${await baseUrl()}/${locale}/signin/${token}`;

  // Email language: the customer's stored preference (Shopify customer.locale)
  // wins; otherwise the site locale they signed in from. Subject follows suit.
  const emailLocale = account.locale ?? locale;
  await sendEmail({
    to: account.email,
    subject:
      emailLocale === "ja"
        ? "Hammond Button Works 取引カタログへのログインリンク"
        : "Your Hammond Button Works trade catalogue link",
    html: magicLinkEmail(url, account.company, emailLocale),
    // A monitored reply-to (vs pure no-reply) reads as a legitimate sender and
    // lets a stuck customer just reply. Falls back gracefully if unset.
    replyTo: process.env.CONTACT_INBOX ?? process.env.QUOTE_INBOX,
  });

  redirect(`/${locale}/login?status=sent`);
}
