import { DraftOrderForm } from "@/components/DraftOrderForm";

export const metadata = { title: "代理で注文を作成" };

export default function NewOrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-2xl tracking-tight">代理で注文を作成</h1>
      <p className="mt-2 text-sm text-stone-600">
        電話・LINE などで受けたご注文を、お客様に代わって作成します。
      </p>
      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <b>このツールを使ってください。</b>
        Shopify の管理画面から手動で「下書き注文」を作ると、plus のお客様でも +10% が適用されません
        （管理画面では価格を上げられず、値引きしかできないためです）。
        このツールは価格区分を自動で反映します。
      </div>
      <div className="mt-8">
        <DraftOrderForm />
      </div>
    </div>
  );
}
