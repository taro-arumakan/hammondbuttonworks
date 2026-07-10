/**
 * Thin email wrapper. With RESEND_API_KEY set, sends via Resend. Without it
 * (local dev / preview), emails are printed to the server console — magic-link
 * sign-in URLs land there, which is how you log in without a mail provider.
 *
 * Templates are bilingual (EN/JA). Customer-facing mail is localised by the
 * recipient's preference (Shopify `customer.locale`) or the site locale they
 * used; staff notifications are Japanese. Callers resolve the locale and pass
 * it in — default to "ja" when there's no signal (most launch customers are JP).
 */
import type { Locale } from "./i18n-config";

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

const SHELL_OPEN = `<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1a1714;max-width:480px">
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:20px;margin:0 0 20px">Hammond Button Works</p>`;

function footer(locale: Locale): string {
  const line =
    locale === "ja"
      ? "Hammond Button Works ・ 天然素材のハンドクラフトボタン（水牛ホーン・ウッド・メタル）<br>お問い合わせ: "
      : "Hammond Button Works · Handcrafted natural buttons — buffalo horn, wood &amp; metal<br>Questions? ";
  return `<hr style="border:none;border-top:1px solid #e4e1da;margin:24px 0" />
    <p style="color:#78716c;font-size:12px;margin:0">${line}<a href="mailto:contact@hammondbutton.works" style="color:#8a6d3b">contact@hammondbutton.works</a></p>`;
}

// Deliverability note: phishing filters (e.g. iCloud/Proofpoint) score
// "sign in to your account" + urgency + a raw tokenised URL as a credential-
// harvest pattern. So: warm brand copy, the button as the only visible link
// (no raw token URL in the body), and an identifiable-sender footer.
export function magicLinkEmail(url: string, company: string, locale: Locale): string {
  const c = escapeHtml(company);
  const button = (label: string) =>
    `<p style="margin:26px 0"><a href="${url}" style="display:inline-block;background:#8a6d3b;color:#ffffff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600">${label}</a></p>`;

  if (locale === "ja") {
    return `${SHELL_OPEN}
    <p>${c} 様</p>
    <p>Hammond Button Works の取引カタログへのログインリンクをお送りします。下のボタンから、卸売価格のご確認とご注文いただけます。</p>
    ${button("取引カタログを開く")}
    <p style="color:#78716c;font-size:13px">リンクの有効期限は15分間、ご利用は1回限りです。期限が切れた場合は hammondbutton.works から再度お手続きください。</p>
    <p style="color:#78716c;font-size:13px">このメールは hammondbutton.works でこのアドレスが入力されたため送信されています。お心当たりがない場合は破棄してください。</p>
    ${footer(locale)}
  </div>`;
  }
  return `${SHELL_OPEN}
    <p>Hi ${c},</p>
    <p>Here's your link to the Hammond Button Works trade catalogue — tap below to view your wholesale pricing and place orders.</p>
    ${button("View the trade catalogue")}
    <p style="color:#78716c;font-size:13px">The link works for 15&nbsp;minutes and can be used once. If it has expired, request a new one at hammondbutton.works.</p>
    <p style="color:#78716c;font-size:13px">You're receiving this because this address was entered at hammondbutton.works. If that wasn't you, you can ignore this message.</p>
    ${footer(locale)}
  </div>`;
}

/** Customer-facing acknowledgment of a contact/quote submission (localised). */
export function quoteAckEmail(name: string, locale: Locale): { subject: string; html: string } {
  const n = escapeHtml(name);
  if (locale === "ja") {
    return {
      subject: "お問い合わせを受け付けました — Hammond Button Works",
      html: `${SHELL_OPEN}
    <p>${n} 様</p>
    <p>Hammond Button Works へお問い合わせいただき、誠にありがとうございます。内容を確認のうえ、通常1営業日以内に価格・お手続きについてご返信いたします。</p>
    <p>Hammond Button Works</p>
    ${footer(locale)}
  </div>`,
    };
  }
  return {
    subject: "We received your request — Hammond Button Works",
    html: `${SHELL_OPEN}
    <p>Hi ${n},</p>
    <p>Thanks for reaching out to Hammond Button Works. We've received your request and will reply with pricing and next steps, usually within one business day.</p>
    <p>— Hammond Button Works</p>
    ${footer(locale)}
  </div>`,
  };
}

/** Staff-facing contact/quote notification — always Japanese (the team is JP). */
export function quoteNotificationEmail(
  q: { company: string; name: string; email: string; phone?: string; sku?: string; qty?: string; message: string },
  customerLocale: Locale,
): { subject: string; html: string } {
  const rows: [string, string][] = [
    ["会社名", q.company],
    ["ご担当者", q.name],
    ["メール", q.email],
    ["電話", q.phone || "—"],
    ["品番", q.sku || "—"],
    ["数量", q.qty || "—"],
    ["ご要望", q.message],
    ["お客様の表示言語", customerLocale === "ja" ? "日本語" : "English"],
  ];
  return {
    subject: `お問い合わせ — ${q.company}`,
    html: `<div style="font-family:system-ui,sans-serif;color:#1a1714">
      <h2 style="font-size:16px">新しいお問い合わせ</h2>
      <table style="border-collapse:collapse">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 12px 4px 0;color:#78716c;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`,
          )
          .join("")}
      </table>
    </div>`,
  };
}
