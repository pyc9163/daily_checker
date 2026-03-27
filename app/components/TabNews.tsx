import { NewsImpactItem } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function TabNews({ news }: { news: NewsImpactItem[] }) {
  if (!news.length) {
    return (
      <div className="card p-5">
        <p className="text-sm text-muted">저장된 뉴스 요약이 없습니다. 수동 새로고침 후 다시 확인하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((item) => (
        <article key={item.url} className="card p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">{item.source}</p>
              <h3 className="mt-2 text-lg font-semibold leading-7">{item.title}</h3>
            </div>
            <span className="shrink-0 text-xs text-muted">{formatDateTime(item.publishedAt)}</span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{item.summary}</p>
          <div className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white">
            내 포지션 영향: {item.positionImpact}
          </div>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex text-sm font-medium text-accent underline underline-offset-4"
          >
            원문 보기
          </a>
        </article>
      ))}
    </div>
  );
}
