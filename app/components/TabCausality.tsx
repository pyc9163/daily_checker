"use client";

import { useState } from "react";
import { CausalityIndicator } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SignalBadge } from "@/app/components/SignalBadge";

export function TabCausality({ indicators }: { indicators: CausalityIndicator[] }) {
  const [selectedKey, setSelectedKey] = useState(indicators[0]?.key ?? "");
  const current =
    indicators.find((indicator) => indicator.key === selectedKey) ?? indicators[0];

  if (!current) return null;

  const activeScenario = current.scenarios[current.currentScenario];
  const inactiveScenario = current.scenarios[current.currentScenario === "A" ? "B" : "A"];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {indicators.map((indicator) => (
          <button
            key={indicator.key}
            type="button"
            onClick={() => setSelectedKey(indicator.key)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-2 text-sm font-medium",
              indicator.key === current.key
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-300 bg-white/75 text-slate-700"
            )}
          >
            {indicator.label}
          </button>
        ))}
      </div>

      <section className="card p-5">
        <p className="text-sm font-medium text-accent">{current.label}</p>
        <h3 className="mt-2 text-xl font-semibold">{activeScenario.title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-700">{current.summary}</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {([["A", current.scenarios.A], ["B", current.scenarios.B]] as const).map(([key, scenario]) => {
          const isActive = key === current.currentScenario;
          return (
            <article
              key={key}
              className={cn(
                "card p-5",
                isActive ? "ring-2 ring-accent/30" : "opacity-80"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">Scenario {key}</p>
                  <h4 className="mt-1 text-lg font-semibold">{scenario.title}</h4>
                </div>
                <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700">
                  {isActive ? "현재 국면" : "대안 시나리오"}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">{scenario.description}</p>
              <div className="mt-4 space-y-2 rounded-2xl bg-white/80 p-4">
                {scenario.chain.map((step) => (
                  <div key={step} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-2 w-2 rounded-full bg-accent" />
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {Object.entries(scenario.signals).map(([asset, level]) => (
                  <div key={asset} className="rounded-2xl border border-slate-200/70 bg-white/80 p-3">
                    <p className="text-sm font-semibold">{asset}</p>
                    <div className="mt-2">
                      <SignalBadge level={level} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>

      <section className="card p-5">
        <p className="text-sm font-medium text-slate-900">현재 적용 시나리오 요약</p>
        <p className="mt-2 text-sm leading-6 text-slate-700">{activeScenario.description}</p>
        <p className="mt-3 text-sm leading-6 text-slate-500">{inactiveScenario.description}</p>
      </section>
    </div>
  );
}
