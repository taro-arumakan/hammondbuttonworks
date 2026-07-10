"use server";

import { redirect } from "next/navigation";
import { createStaffToken } from "@/lib/session";
import { isStaffEmail } from "@/lib/staff";
import { sendEmail } from "@/lib/email";
import { adminBaseUrl } from "@/lib/url";

/**
 * Staff sign-in. Same passwordless magic-link mechanism as customers, but a
 * separate token kind + cookie, and gated on the STAFF_EMAILS allowlist.
 * Unknown addresses get the same "sent" response — we don't reveal who is staff.
 */
export async function requestStaffLink(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/admin");

  if (isStaffEmail(email)) {
    const token = await createStaffToken("staff-magic", email);
    // adminBaseUrl(), not baseUrl() — /admin/* 404s on the public storefront host.
    const url = `${await adminBaseUrl()}/admin/signin/${token}?next=${encodeURIComponent(next)}`;
    await sendEmail({
      to: email,
      subject: "HBW スタッフツール ログインリンク",
      html: `<div style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#1a1714;max-width:480px">
        <p style="font-family:Georgia,serif;font-size:20px;margin:0 0 20px">Hammond Button Works</p>
        <p>スタッフツールのログインリンクをお送りします。</p>
        <p style="margin:26px 0"><a href="${url}" style="display:inline-block;background:#8a6d3b;color:#fff;padding:12px 22px;border-radius:6px;text-decoration:none;font-weight:600">スタッフツールを開く</a></p>
        <p style="color:#78716c;font-size:13px">有効期限は15分間、ご利用は1回限りです。お心当たりがない場合は破棄してください。</p>
      </div>`,
    });
  }

  // Always the same outcome, whether or not the address is on the allowlist.
  redirect("/admin/login?status=sent");
}
