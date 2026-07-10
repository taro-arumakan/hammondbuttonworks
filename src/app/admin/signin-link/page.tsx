import { AdminLinkForm } from "@/components/AdminLinkForm";

export const metadata = { title: "ログインリンク発行" };

export default function AdminSigninLinkPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-serif text-2xl tracking-tight">ログインリンク発行</h1>
      <p className="mt-2 text-sm text-stone-600">
        メールが届かないお客様に、ログインリンクを発行して LINE 等でお渡しするためのツールです。
        対象は Shopify に登録済み（価格区分の設定済み）のお客様に限ります。
      </p>
      <div className="mt-8">
        <AdminLinkForm />
      </div>
    </div>
  );
}
