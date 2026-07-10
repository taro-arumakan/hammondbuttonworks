import type { Metadata } from "next";
import { AdminLinkForm } from "@/components/AdminLinkForm";

/**
 * Staff-only page to mint a customer sign-in link (for LINE/manual relay when
 * email bounces). Protection is the STAFF_LINK_SECRET the form sends to the API —
 * the page itself is harmless (just a form) but kept out of search indexes and
 * unlinked from the site nav. Share the URL + secret with staff privately.
 */
export const metadata: Metadata = {
  title: "取引先ログインリンク発行（スタッフ用）",
  robots: { index: false, follow: false },
};

export default function AdminSigninLinkPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-2xl tracking-tight">ログインリンク発行</h1>
      <p className="mt-2 text-sm text-stone-600">
        メールが届かないお客様に、ログインリンクを発行して LINE 等でお渡しするためのスタッフ用ツールです。
        対象は Shopify に登録済み（pricing_segment 設定済み）のお客様に限ります。
      </p>
      <div className="mt-8">
        <AdminLinkForm />
      </div>
    </div>
  );
}
