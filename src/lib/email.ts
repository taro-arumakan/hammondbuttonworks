/**
 * Thin email wrapper. With RESEND_API_KEY set, sends via Resend. Without it
 * (local dev / preview), emails are printed to the server console — magic-link
 * sign-in URLs land there, which is how you log in without a mail provider.
 */

type Mail = {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
};

export async function sendEmail(mail: Mail): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "Hammond Button Works <onboarding@resend.dev>";

  if (!apiKey) {
    const links = Array.from(mail.html.matchAll(/https?:\/\/[^\s"'<>]+/g)).map((m) => m[0]);
    console.log("\n📧 [email console fallback — set RESEND_API_KEY to send for real]");
    console.log(`   to:      ${mail.to}`);
    console.log(`   subject: ${mail.subject}`);
    if (mail.replyTo) console.log(`   replyTo: ${mail.replyTo}`);
    if (links.length) {
      console.log("   links:");
      for (const l of links) console.log(`     → ${l}`);
    }
    console.log("");
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      reply_to: mail.replyTo,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("Resend send failed:", res.status, detail);
    throw new Error(`Email send failed (${res.status})`);
  }
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function magicLinkEmail(url: string, company: string): string {
  return `<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.55;color:#1a1714">
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;margin:0 0 16px">Hammond Button Works</p>
    <p>Hi ${escapeHtml(company)},</p>
    <p>Use the secure link below to sign in to your trade account. It expires in 15&nbsp;minutes and can be used once.</p>
    <p style="margin:24px 0">
      <a href="${url}" style="display:inline-block;background:#8a6d3b;color:#ffffff;padding:11px 20px;border-radius:6px;text-decoration:none;font-weight:600">Sign in to your account</a>
    </p>
    <p style="color:#78716c;font-size:13px">If the button doesn't work, paste this URL into your browser:<br>${escapeHtml(url)}</p>
    <p style="color:#78716c;font-size:13px">If you didn't request this, you can safely ignore it.</p>
  </div>`;
}
