import Link from "next/link";

const TOOLS = [
  {
    href: "/admin/orders/new",
    title: "代理で注文を作成",
    body: "電話・LINE などで受けたご注文を作成します。plus のお客様には自動で110%の価格が適用されます（管理画面の手入力では適用されません）。",
  },
  {
    href: "/admin/signin-link",
    title: "ログインリンク発行",
    body: "メールが届かないお客様に、ログインリンクを発行して LINE 等でお渡しします。24時間有効・1回限り。",
  },
];

export default function AdminHomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-serif text-2xl tracking-tight">スタッフツール</h1>
      <div className="mt-8 space-y-3">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="block rounded-lg border border-line bg-surface p-5 hover:border-accent"
          >
            <p className="font-medium text-foreground">{t.title}</p>
            <p className="mt-1 text-sm text-stone-600">{t.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
