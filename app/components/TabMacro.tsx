"use client";

import { useEffect, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { MetricCard } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function TabMacro({ cards }: { cards: MetricCard[] }) {
  const [items, setItems] = useState(cards);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(cards);
  }, [cards]);

  useEffect(() => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/macro", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { cards?: MetricCard[] };
        if (data.cards?.length) {
          setItems(data.cards);
        }
      } catch {
        // Leave the stored briefing values on screen if real-time refresh fails.
      }
    });
  }, []);

  const refreshMacro = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/macro", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("매크로 지표를 불러오지 못했습니다.");
        }
        const data = (await response.json()) as { cards?: MetricCard[] };
        setItems(data.cards ?? cards);
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "매크로 지표를 불러오지 못했습니다."
        );
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">실시간 지표 카드</p>
          <p className="text-xs text-muted">시장 중 수동 갱신 가능</p>
        </div>
        <button
          type="button"
          onClick={refreshMacro}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          새로고침
        </button>
      </div>
      {error ? (
        <p className="rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((card) => (
          <article key={card.key} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-600">{card.label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{card.displayValue}</p>
              </div>
              <div className="rounded-full bg-slate-900 px-2 py-1 text-[11px] text-white">
                {card.source}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-muted">
              <span>
                {typeof card.change === "number"
                  ? `${card.change >= 0 ? "+" : ""}${card.change.toFixed(2)}%`
                  : "변화율 없음"}
              </span>
              <span>{formatDateTime(card.updatedAt)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
