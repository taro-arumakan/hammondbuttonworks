"use client";

import { useState } from "react";

/**
 * Staff tool: generate a customer sign-in link to relay by hand (LINE / メール等)
 * when their email bounces. Auth is the staff session cookie — the middleware
 * gates /api/admin/*, so no secret is entered here.
 */
type Result = { url: string; email: string; company: string; expiresAt: string };

export function AdminLinkForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);

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
      const res = await fetch(`/api/admin/signin-link?email=${encodeURIComponent(email.trim())}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          res.status === 401
            ? "ログインの有効期限が切れました。再度ログインしてください。"
            : res.status === 404
              ? "このメールアドレスの取引先が見つかりません（Shopify で価格区分を設定してください）。"
              : (body.error ?? `エラーが発生しました（${res.status}）。`),
        );
      }
      setResult(body as Result);
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

  return (
    <form onSubmit={onSubmit} className="space-y-5">
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
          className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
