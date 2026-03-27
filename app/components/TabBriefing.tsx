import { BriefingPayload } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { SignalBadge } from "@/app/components/SignalBadge";

export function TabBriefing({ briefing }: { briefing: BriefingPayload }) {
  return (
    <div className="space-y-4">
      <section className="card overflow-hidden p-5">
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-accent">Morning Macro Briefing</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">{briefing.headline}</h2>
          </div>
          <div className="rounded-2xl bg-slate-900 px-3 py-2 text-right text-xs text-slate-100">
            <div>{briefing.date}</div>
            <div className="text-slate-300">{formatDateTime(briefing.updatedAt)}</div>
          </div>
        </div>
        <p className="rounded-2xl bg-white/80 p-4 text-sm leading-6 text-slate-700">
          {briefing.regime.macroSummary}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">금리 방향</p>
          <p className="mt-2 text-lg font-semibold">{briefing.regime.rateDirection}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">리스크 톤</p>
          <p className="mt-2 text-lg font-semibold">{briefing.regime.riskTone}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">달러 방향</p>
          <p className="mt-2 text-lg font-semibold">{briefing.regime.dollarDirection}</p>
        </div>
      </section>

      <section className="card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">오늘 포지션 스냅샷</h3>
          <span className="text-xs text-muted">자산 4종</span>
        </div>
        <div className="mt-4 grid gap-3">
          {briefing.signals.map((signal) => (
            <div
              key={signal.asset}
              className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold">{signal.asset}</p>
                <p className="mt-1 text-xs text-muted">{signal.reason}</p>
              </div>
              <SignalBadge level={signal.level} />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">오늘 한줄 결론</p>
        <p className="mt-3 text-xl font-semibold leading-8 text-slate-900">{briefing.conclusion}</p>
      </section>
    </div>
  );
}
