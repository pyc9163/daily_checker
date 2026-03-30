"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { MetricCard } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

async function fetchMacroCard(key: string) {
  const response = await fetch(`/api/macro/${key}`, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`지표 ${key} 조회 실패`);
  }

  return (await response.json()) as { card: MetricCard };
}

export function TabMacro({ cards }: { cards: MetricCard[] }) {
  const [items, setItems] = useState(cards);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setItems(cards);
  }, [cards]);

  const refreshMacro = useCallback((showSummaryError = true) => {
    setError(null);
    startTransition(async () => {
      const results = await Promise.allSettled(
        cards.map((card) => fetchMacroCard(card.key))
      );

      const nextItems = cards.map((card, index) => {
        const result = results[index];
        return result.status === "fulfilled" ? result.value.card : card;
      });

      setItems(nextItems);

      const failedCount = results.filter((result) => result.status === "rejected").length;
      if (showSummaryError && failedCount === cards.length) {
        setError("모든 매크로 소스가 실패했습니다. 잠시 후 다시 시도하세요.");
      } else if (showSummaryError && failedCount > 0) {
        setError(`${failedCount}개 지표는 갱신에 실패했고, 나머지는 정상 반영했습니다.`);
      }
    });
  }, [cards]);

  useEffect(() => {
    refreshMacro(false);
  }, [refreshMacro]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-900">실시간 지표 카드</p>
          <p className="text-xs text-muted">시장 중 수동 갱신 가능</p>
        </div>
        <button
          type="button"
          onClick={() => refreshMacro(true)}
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
                {card.error
                  ? "업데이트 실패"
                  : typeof card.change === "number"
                  ? `${card.change >= 0 ? "+" : ""}${card.change.toFixed(2)}%`
                  : "변화율 없음"}
              </span>
              <span>{formatDateTime(card.updatedAt)}</span>
            </div>
            {card.error ? (
              <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-700">
                {card.error}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
