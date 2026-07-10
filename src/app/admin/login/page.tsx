import { requestStaffLink } from "./actions";

export const metadata = { title: "ログイン" };

export default async function StaffLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; next?: string }>;
}) {
  const { status, next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-2xl tracking-tight">スタッフツール ログイン</h1>
      <p className="mt-2 text-sm text-stone-600">
        登録済みのスタッフ用メールアドレスにログインリンクをお送りします。パスワードはありません。
      </p>

      {status === "sent" && (
        <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          メールをご確認ください。ログインリンクを送信しました（有効期限15分）。
          届かない場合は、迷惑メールフォルダもご確認ください。
        </div>
      )}
      {status === "invalid" && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          このリンクは無効か、有効期限が切れています。もう一度お手続きください。
        </div>
      )}

      <form action={requestStaffLink} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next ?? "/admin"} />
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">
            スタッフ用メールアドレス
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-md bg-foreground px-4 py-2.5 font-medium text-background hover:bg-accent"
        >
          ログインリンクを送る
        </button>
      </form>
    </div>
  );
}
