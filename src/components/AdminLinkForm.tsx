"use client";

import { useEffect, useState } from "react";

/**
 * Staff tool (non-technical): generate a customer sign-in link to relay by hand
 * (LINE / メール等) when their email bounces. Calls GET /api/admin/signin-link
 * with the STAFF_LINK_SECRET as a header. The secret can be remembered on this device
 * (localStorage) so staff only type the customer's email after the first time.
 *
 * No customer data beyond the link is shown, and the class/tier is never exposed.
 */
type Result = { url: string; email: string; company: string; expiresAt: string };

const SECRET_KEY = "hbw_admin_secret";

export function AdminLinkForm() {
  const [secret, setSecret] = useState("");
  const [remember, setRemember] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(SECRET_KEY);
    if (saved) {
      setSecret(saved);
      setRemember(true);
    }
  }, []);

  const message = result
    ? `Hammond Button Works のログインリンクをお送りします（24時間有効・1回限り）。\n${result.url}`
    : "";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    setCopied(null);
    try {
      const res = await fetch(`/api/admin/signin-link?email=${encodeURIComponent(email.trim())}`, {
        headers: { "x-admin-secret": secret },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "管理キーが正しくありません。"
            : res.status === 404
              ? "このメールアドレスの取引先が見つかりません（Shopify で pricing_segment を設定してください）。"
              : (body.error ?? `エラーが発生しました（${res.status}）。`),
        );
      }
      setResult(body as Result);
      if (remember) localStorage.setItem(SECRET_KEY, secret);
      else localStorage.removeItem(SECRET_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string, which: "link" | "message") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard blocked — the field is selectable as a fallback */
    }
  }

  const inputCls =
    "mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="secret" className="block text-sm font-medium text-stone-700">
          スタッフ用キー（STAFF_LINK_SECRET）
        </label>
        <input
          id="secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          required
          autoComplete="off"
          className={inputCls}
        />
        <label className="mt-2 flex items-center gap-2 text-sm text-stone-500">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          この端末に管理キーを記憶する
        </label>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          お客様のメールアドレス
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="customer@example.com"
          className={inputCls}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "生成中…" : "ログインリンクを生成"}
      </button>

      {result && (
        <div className="space-y-3 rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-sm text-green-800">
            {result.company} 様のリンクを生成しました。有効期限：
            {new Date(result.expiresAt).toLocaleString("ja-JP")}
          </p>
          <textarea
            readOnly
            value={result.url}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full break-all rounded border border-stone-300 bg-white px-3 py-2 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => copy(result.url, "link")}
              className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background hover:bg-accent"
            >
              {copied === "link" ? "コピーしました ✓" : "リンクをコピー"}
            </button>
            <button
              type="button"
              onClick={() => copy(message, "message")}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm hover:border-accent"
            >
              {copied === "message" ? "コピーしました ✓" : "メッセージをコピー（LINE用）"}
            </button>
          </div>
          <p className="text-xs text-stone-500">
            LINE 等でお客様に共有してください。リンクは24時間有効・1回限りです。
          </p>
        </div>
      )}
    </form>
  );
}
