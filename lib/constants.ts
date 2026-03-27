import {
  BriefingPayload,
  CausalityIndicator,
  MetricCard,
  PositionSignal,
  SignalLevel
} from "@/lib/types";

export const BRIEFING_STORAGE_KEY = "daily-briefing:latest";

export const TAB_ITEMS = [
  { key: "briefing", label: "오늘 브리핑" },
  { key: "macro", label: "매크로 지표" },
  { key: "causality", label: "인과관계" },
  { key: "news", label: "뉴스 요약" },
  { key: "signal", label: "포지션 신호" }
] as const;

export const SIGNAL_META: Record<
  SignalLevel,
  { label: string; className: string }
> = {
  entry: {
    label: "진입가능",
    className: "bg-emerald-100 text-emerald-700"
  },
  watch: {
    label: "주시",
    className: "bg-amber-100 text-amber-700"
  },
  neutral: {
    label: "관망",
    className: "bg-slate-200 text-slate-600"
  },
  risk: {
    label: "위험",
    className: "bg-rose-100 text-rose-700"
  }
};

export const EMPTY_MACRO_CARDS: MetricCard[] = [
  { key: "dgs2", label: "미 2년물 금리", value: null, displayValue: "-", source: "FRED" },
  { key: "dgs10", label: "미 10년물 금리", value: null, displayValue: "-", source: "FRED" },
  { key: "dgs30", label: "미 30년물 금리", value: null, displayValue: "-", source: "FRED" },
  { key: "spread_2s10s", label: "2Y-10Y 스프레드", value: null, displayValue: "-", source: "Derived" },
  { key: "vix", label: "VIX", value: null, displayValue: "-", source: "Yahoo Finance" },
  { key: "dxy", label: "DXY 달러 인덱스", value: null, displayValue: "-", source: "Yahoo Finance" },
  { key: "wti", label: "WTI 유가", value: null, displayValue: "-", source: "Yahoo Finance" },
  { key: "fear_greed", label: "공포탐욕지수", value: null, displayValue: "-", source: "CNN" },
  { key: "sp_futures", label: "S&P500 선물", value: null, displayValue: "-", source: "Yahoo Finance" }
];

const makeSignal = (
  asset: "TMV" | "TMF" | "금" | "BTC",
  level: SignalLevel,
  reason: string
): PositionSignal => ({
  asset,
  signal: asset === "금" || asset === "BTC" ? (level === "entry" ? "롱진입" : level === "risk" ? "위험" : "관망") : level === "entry" ? "진입가능" : level === "risk" ? "위험" : "관망",
  level,
  reason
});

export const FALLBACK_CAUSALITY: CausalityIndicator[] = [
  {
    key: "us10y",
    label: "미 10년물 금리",
    currentScenario: "A",
    summary: "장기금리의 방향은 TMV/TMF와 성장주 리스크를 동시에 흔듭니다.",
    scenarios: {
      A: {
        title: "상승/과열",
        description: "재정 확대나 인플레 재가속으로 장기금리가 상방 압력을 받는 상태",
        chain: ["장기금리 상승", "밸류에이션 압축", "달러 방어", "장기채 부담 확대"],
        signals: { TMV: "entry", TMF: "risk", 금: "watch", BTC: "neutral" }
      },
      B: {
        title: "하락/냉각",
        description: "성장 둔화 또는 디스인플레로 장기금리가 하향 안정되는 상태",
        chain: ["장기금리 하락", "채권 듀레이션 선호", "달러 숨고르기", "리스크 자산 복원"],
        signals: { TMV: "risk", TMF: "entry", 금: "entry", BTC: "watch" }
      }
    }
  },
  {
    key: "cpi",
    label: "CPI",
    currentScenario: "A",
    summary: "물가 재가속은 실질금리와 연준 기대를 함께 밀어 올립니다.",
    scenarios: {
      A: {
        title: "상승/과열",
        description: "인플레이션 서프라이즈가 지속되는 상태",
        chain: ["CPI 상회", "연준 긴축 기대", "실질금리 상승", "멀티플 압박"],
        signals: { TMV: "watch", TMF: "risk", 금: "neutral", BTC: "risk" }
      },
      B: {
        title: "하락/냉각",
        description: "디스인플레가 확인되며 금리 기대가 완화되는 상태",
        chain: ["CPI 둔화", "긴축 우려 완화", "실질금리 하락", "유동성 선호 회복"],
        signals: { TMV: "risk", TMF: "entry", 금: "entry", BTC: "watch" }
      }
    }
  },
  {
    key: "vix",
    label: "VIX",
    currentScenario: "B",
    summary: "변동성 지표는 단기 리스크 온오프 스위치로 가장 빠르게 반응합니다.",
    scenarios: {
      A: {
        title: "상승/과열",
        description: "헤지 수요 급증으로 변동성 프리미엄이 확대되는 상태",
        chain: ["VIX 급등", "리스크 회피", "현금 선호", "고베타 자산 약세"],
        signals: { TMV: "watch", TMF: "watch", 금: "entry", BTC: "risk" }
      },
      B: {
        title: "하락/냉각",
        description: "시장 스트레스가 완화되고 프리미엄이 축소되는 상태",
        chain: ["VIX 안정", "리스크 감내 확대", "주식/크립토 선호", "헤지 수요 완화"],
        signals: { TMV: "neutral", TMF: "neutral", 금: "watch", BTC: "entry" }
      }
    }
  },
  {
    key: "dxy",
    label: "DXY",
    currentScenario: "A",
    summary: "달러 강세는 글로벌 유동성 압박과 원자재 역풍을 동반하는 경우가 많습니다.",
    scenarios: {
      A: {
        title: "상승/과열",
        description: "미국 성장 우위나 안전자산 선호로 달러가 강해지는 상태",
        chain: ["달러 강세", "글로벌 금융여건 긴축", "원자재 부담", "신흥국/크립토 압박"],
        signals: { TMV: "watch", TMF: "neutral", 금: "risk", BTC: "risk" }
      },
      B: {
        title: "하락/냉각",
        description: "달러 숨고르기로 글로벌 유동성 부담이 줄어드는 상태",
        chain: ["달러 약세", "금융여건 완화", "원자재 지지", "대체자산 선호 확대"],
        signals: { TMV: "neutral", TMF: "watch", 금: "entry", BTC: "entry" }
      }
    }
  },
  {
    key: "oil",
    label: "유가",
    currentScenario: "A",
    summary: "유가는 성장 기대와 인플레이션 압력을 동시에 담는 복합 변수입니다.",
    scenarios: {
      A: {
        title: "상승/과열",
        description: "공급차질이나 지정학 리스크로 유가가 급등하는 상태",
        chain: ["유가 상승", "기대인플레 자극", "중앙은행 부담", "소비 둔화 우려"],
        signals: { TMV: "watch", TMF: "risk", 금: "watch", BTC: "neutral" }
      },
      B: {
        title: "하락/냉각",
        description: "수요 둔화 또는 공급 회복으로 유가가 안정되는 상태",
        chain: ["유가 안정", "물가 부담 완화", "정책 유연성 확대", "듀레이션 회복"],
        signals: { TMV: "risk", TMF: "entry", 금: "watch", BTC: "watch" }
      }
    }
  },
  {
    key: "btc_funding",
    label: "BTC 펀딩비",
    currentScenario: "B",
    summary: "펀딩비는 레버리지 포지셔닝의 과열 여부를 보여줍니다.",
    scenarios: {
      A: {
        title: "상승/과열",
        description: "롱 포지션 과열로 펀딩비가 비정상적으로 높은 상태",
        chain: ["펀딩비 급등", "레버리지 과밀", "롱 청산 위험", "단기 변동성 확대"],
        signals: { TMV: "neutral", TMF: "neutral", 금: "watch", BTC: "risk" }
      },
      B: {
        title: "하락/냉각",
        description: "과열이 정리되어 다음 상승 여력이 남아 있는 상태",
        chain: ["펀딩 정상화", "과도한 롱 해소", "현물 중심 수급", "추세 재개 여지"],
        signals: { TMV: "neutral", TMF: "neutral", 금: "neutral", BTC: "entry" }
      }
    }
  }
];

export const FALLBACK_BRIEFING: BriefingPayload = {
  date: new Date().toISOString().slice(0, 10),
  generatedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  headline: "오늘 아침 브리핑이 아직 생성되지 않았습니다.",
  conclusion: "수동 새로고침 또는 Vercel Cron 실행 후 브리핑이 채워집니다.",
  regime: {
    rateDirection: "대기",
    riskTone: "중립",
    dollarDirection: "대기",
    macroSummary: "외부 데이터 수집 전에는 기본 가이드만 표시합니다."
  },
  macroCards: EMPTY_MACRO_CARDS,
  causality: FALLBACK_CAUSALITY,
  news: [],
  signals: [
    makeSignal("TMV", "neutral", "실시간 브리핑이 없어서 판단 보류"),
    makeSignal("TMF", "neutral", "실시간 브리핑이 없어서 판단 보류"),
    makeSignal("금", "neutral", "실시간 브리핑이 없어서 판단 보류"),
    makeSignal("BTC", "neutral", "실시간 브리핑이 없어서 판단 보류")
  ],
  rawData: {}
};
