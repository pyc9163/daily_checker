export type SignalLevel = "entry" | "watch" | "neutral" | "risk";

export type PositionAction =
  | "진입가능"
  | "관망"
  | "위험"
  | "롱진입"
  | "주시";

export interface MetricCard {
  key: string;
  label: string;
  value: number | null;
  displayValue: string;
  unit?: string;
  change?: number | null;
  source: string;
  updatedAt?: string;
}

export interface CausalityScenario {
  title: string;
  description: string;
  chain: string[];
  signals: Record<"TMV" | "TMF" | "금" | "BTC", SignalLevel>;
}

export interface CausalityIndicator {
  key: string;
  label: string;
  currentScenario: "A" | "B";
  summary: string;
  scenarios: {
    A: CausalityScenario;
    B: CausalityScenario;
  };
}

export interface NewsImpactItem {
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  summary: string;
  positionImpact: string;
}

export interface PositionSignal {
  asset: "TMV" | "TMF" | "금" | "BTC";
  signal: PositionAction;
  level: SignalLevel;
  reason: string;
}

export interface RegimeSummary {
  rateDirection: string;
  riskTone: string;
  dollarDirection: string;
  macroSummary: string;
}

export interface BriefingPayload {
  date: string;
  generatedAt: string;
  updatedAt: string;
  headline: string;
  conclusion: string;
  regime: RegimeSummary;
  macroCards: MetricCard[];
  causality: CausalityIndicator[];
  news: NewsImpactItem[];
  signals: PositionSignal[];
  rawData: Record<string, unknown>;
}
