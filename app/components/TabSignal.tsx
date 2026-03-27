import { PositionSignal } from "@/lib/types";
import { SignalBadge } from "@/app/components/SignalBadge";

export function TabSignal({
  signals,
  conclusion
}: {
  signals: PositionSignal[];
  conclusion: string;
}) {
  return (
    <div className="space-y-4">
      <section className="grid gap-3 sm:grid-cols-2">
        {signals.map((signal) => (
          <article key={signal.asset} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">Asset</p>
                <h3 className="mt-1 text-2xl font-semibold">{signal.asset}</h3>
              </div>
              <SignalBadge level={signal.level} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-700">{signal.reason}</p>
          </article>
        ))}
      </section>

      <section className="card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">오늘 한줄 결론</p>
        <p className="mt-3 text-2xl font-semibold leading-9">{conclusion}</p>
      </section>
    </div>
  );
}
