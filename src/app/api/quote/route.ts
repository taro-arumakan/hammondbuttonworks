import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendEmail, quoteAckEmail, quoteNotificationEmail } from "@/lib/email";
import { isLocale } from "@/lib/i18n-config";
import { rateLimit } from "@/lib/ratelimit";

/**
 * Quote / trade-access request handler.
 *  1. Honeypot + rate limit (anti-spam).
 *  2. Email the owner (CONTACT_INBOX) with the details, reply-to the requester.
 *  3. Auto-acknowledge the requester.
 *  4. Optionally append a row to a Google Sheet via QUOTE_SHEET_WEBHOOK_URL
 *     (a Google Apps Script web app — see README).
 *
 * No database required.
 */
const QuoteSchema = z.object({
  company: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  email: z.string().email().max(200),
  phone: z.string().max(80).optional().or(z.literal("")),
  sku: z.string().max(80).optional().or(z.literal("")),
  qty: z.string().max(40).optional().or(z.literal("")),
  message: z.string().min(1).max(4000),
  locale: z.string().max(8).optional(), // site locale the form was submitted from
  website: z.string().max(0).optional(), // honeypot: must be empty
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = rateLimit(`quote:${ip}`, 5, 10 * 60 * 1000); // 5 per 10 min
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const parsed = QuoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    // Honeypot filled or invalid input — fail quietly to bots.
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const q = parsed.data;
  // CONTACT_INBOX is the general inbound-business inbox (a Google Group,
  // e.g. contact@hammondbutton.works). QUOTE_INBOX kept as a legacy fallback
  // for the env-rename transition — remove once CONTACT_INBOX is set on all envs.
  const inbox =
    process.env.CONTACT_INBOX ??
    process.env.QUOTE_INBOX ??
    process.env.EMAIL_FROM ??
    "owner@example.com";

  // Requester's language: which site they submitted from; default JA (most
  // launch customers are Japanese). A prospect has no stored preference yet.
  const loc = isLocale(q.locale) ? q.locale : "ja";

  // 2. Notify the team (staff-facing, Japanese; notes the customer's language).
  const notify = quoteNotificationEmail(q, loc);
  await sendEmail({
    to: inbox,
    subject: notify.subject,
    html: notify.html,
    replyTo: q.email,
  });

  // 3. Acknowledge the requester in their language (best-effort). reply-to the
  //    contact inbox so a customer reply reaches a monitored inbox, not no-reply.
  const ack = quoteAckEmail(q.name, loc);
  await sendEmail({
    to: q.email,
    subject: ack.subject,
    html: ack.html,
    replyTo: inbox,
  }).catch(() => {});

  // 4. Optional: append to a Google Sheet.
  const sheetWebhook = process.env.QUOTE_SHEET_WEBHOOK_URL;
  if (sheetWebhook) {
    await fetch(sheetWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...q, receivedAt: new Date().toISOString() }),
    }).catch((e) => console.error("Sheet append failed:", e));
  }

  return NextResponse.json({ ok: true });
}
