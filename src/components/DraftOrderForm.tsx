"use client";

import { useState } from "react";

/**
 * Staff tool: create an order on a customer's behalf. Staff enter the customer's
 * email and (SKU, qty) lines; the server resolves the customer's class from
 * Shopify and applies the price itself — the form never sends a price.
 */
type Line = { sku: string; qty: string; engraving: boolean };
type Result = {
  name: string;
  company: string;
  expectedShipping: string;
  total: number;
  currency: string;
};

const blank: Line = { sku: "", qty: "1", engraving: false };

export function DraftOrderForm() {
  const [email, setEmail] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...blank }]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update(i: number, patch: Partial<Line>) {
    setLines((ls) => ls.map((l, n) => (n === i ? { ...l, ...patch } : l)));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const payload = {
        email: email.trim(),
        lines: lines
          .filter((l) => l.sku.trim())
          .map((l) => ({ sku: l.sku.trim(), qty: Number(l.qty) || 0, engraving: l.engraving })),
      };
      if (!payload.lines.length) throw new Error("品番を1つ以上入力してください。");

      const res = await fetch("/api/admin/draft-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? `エラーが発生しました（${res.status}）。`);
      setResult(body as Result);
      setLines([{ ...blank }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました。");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1 w-full rounded-md border border-stone-300 px-3 py-2 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-stone-700">
          お客様のメールアドレス
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="customer@example.com"
          className={field}
        />
        <p className="mt-1 text-xs text-stone-500">
          価格区分（standard / plus）は Shopify から自動で判定され、価格に反映されます。
        </p>
      </div>

      <div>
        <p className="text-sm font-medium text-stone-700">商品</p>
        <div className="mt-2 space-y-2">
          {lines.map((l, i) => (
            <div key={i} className="flex flex-wrap items-end gap-2">
              <div className="min-w-[12rem] flex-1">
                <label className="block text-xs text-stone-500">品番（SKU）</label>
                <input
                  value={l.sku}
                  onChange={(e) => update(i, { sku: e.target.value })}
                  placeholder="HBW-PEB-BLK-18"
                  className={field}
                />
              </div>
              <div className="w-24">
                <label className="block text-xs text-stone-500">数量</label>
                <input
                  type="number"
                  min={1}
                  value={l.qty}
                  onChange={(e) => update(i, { qty: e.target.value })}
                  className={field}
                />
              </div>
              <label className="flex items-center gap-1.5 pb-2.5 text-sm text-stone-600">
                <input
                  type="checkbox"
                  checked={l.engraving}
                  onChange={(e) => update(i, { engraving: e.target.checked })}
                />
                刻印
              </label>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLines((ls) => ls.filter((_, n) => n !== i))}
                  className="pb-2.5 text-sm text-stone-400 underline hover:text-red-600"
                >
                  削除
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setLines((ls) => [...ls, { ...blank }])}
          className="mt-3 text-sm text-accent underline hover:text-foreground"
        >
          ＋ 明細を追加
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-accent px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "作成中…" : "注文を作成する"}
      </button>

      {result && (
        <div className="space-y-1 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-900">
          <p className="font-medium">
            注文 {result.name} を作成しました（{result.company} 様）。
          </p>
          <p>
            合計：{new Intl.NumberFormat("ja-JP", { style: "currency", currency: result.currency, maximumFractionDigits: 0 }).format(result.total)}
            （価格区分を反映済み・税別）
          </p>
          <p>出荷予定：{result.expectedShipping}</p>
          <p className="text-xs text-green-800">
            Shopify の「注文」一覧に「支払い保留」で入っています。請求書は Order Printer から印刷してください。
          </p>
        </div>
      )}
    </form>
  );
}
