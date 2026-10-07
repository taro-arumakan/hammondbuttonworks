import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isLocale } from "@/lib/i18n-config";
import { rateLimit } from "@/lib/ratelimit";
import { checkFormToken } from "@/lib/form-guard";
import { subscribeNewsletter } from "@/lib/newsletter";

/**
 * Footer newsletter sign-up. Same anti-spam as /api/quote (rate limit +
 * honeypot + signed time-trap token), then records the subscriber in Shopify
 * (see lib/newsletter.ts). The response never says whether the address was
 * already known.
 */
const NewsletterSchema = z.object({
  email: z.string().email().max(200),
  consent: z.literal(true), // the privacy-policy checkbox
  locale: z.string().max(8).optional(),
  website: z.string().max(0).optional(), // honeypot: must be empty
  formToken: z.string().max(500).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`newsletter:${ip}`, 5, 10 * 60 * 1000).ok) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const parsed = NewsletterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }
  const n = parsed.data;

  const guard = await checkFormToken(n.formToken);
  if (guard !== "ok") {
    console.info(`newsletter: rejected submission (${guard}) from ${ip}`);
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  try {
    await subscribeNewsletter(n.email, isLocale(n.locale) ? n.locale : "ja");
  } catch (e) {
    console.error("newsletter: Shopify subscribe failed:", e);
    return NextResponse.json({ error: "Subscription failed." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
