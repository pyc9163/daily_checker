"use client";

import { useEffect, useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { FALLBACK_BRIEFING, TAB_ITEMS } from "@/lib/constants";
import { BriefingPayload } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { TabBriefing } from "@/app/components/TabBriefing";
import { TabMacro } from "@/app/components/TabMacro";
import { TabCausality } from "@/app/components/TabCausality";
import { TabNews } from "@/app/components/TabNews";
import { TabSignal } from "@/app/components/TabSignal";

type TabKey = (typeof TAB_ITEMS)[number]["key"];

async function fetchJson<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    cache: "no-store"
  });

  if (!response.ok) {
    let message = `Failed to load ${url}`;

    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parsing failure and keep the generic message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function DashboardShell({
  initialBriefing
}: {
  initialBriefing: BriefingPayload;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("briefing");
  const [briefing, setBriefing] = useState<BriefingPayload>(initialBriefing);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, startTransition] = useTransition();

  useEffect(() => {
    setBriefing(initialBriefing);
  }, [initialBriefing]);

  const refreshBriefing = () => {
    setError(null);
    startTransition(async () => {
      try {
        const data = await fetchJson<BriefingPayload>("/api/briefing", {
          method: "POST"
        });
        setBriefing(data);
      } catch (refreshError) {
        setError(
          refreshError instanceof Error
            ? refreshError.message
            : "브리핑 새로고침에 실패했습니다."
        );
      }
    });
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <section className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Daily Checker</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">매일 아침 금융 브리핑</h1>
            <p className="mt-2 text-sm text-slate-600">
              마지막 업데이트 {formatDateTime(briefing.updatedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshBriefing}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            수동 새로고침
          </button>
        </div>
        {error ? (
          <p className="mt-3 rounded-2xl bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}
      </section>

      <div className="sticky top-0 z-20 mt-4 overflow-x-auto rounded-3xl border border-slate-200/70 bg-white/80 p-2 shadow-soft backdrop-blur">
        <div className="flex min-w-max gap-2">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-slate-900 text-white"
                  : "bg-transparent text-slate-600 hover:bg-slate-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {activeTab === "briefing" ? <TabBriefing briefing={briefing} /> : null}
        {activeTab === "macro" ? <TabMacro cards={briefing.macroCards} /> : null}
        {activeTab === "causality" ? <TabCausality indicators={briefing.causality} /> : null}
        {activeTab === "news" ? <TabNews news={briefing.news} /> : null}
        {activeTab === "signal" ? (
          <TabSignal signals={briefing.signals} conclusion={briefing.conclusion} />
        ) : null}
      </div>
    </main>
  );
}
