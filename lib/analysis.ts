import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_CAUSALITY } from "@/lib/constants";
import { CausalityIndicator, MetricCard, NewsImpactItem, PositionSignal } from "@/lib/types";
import { toSignalLevel } from "@/lib/utils";

interface AnalysisInput {
  date: string;
  macroCards: MetricCard[];
  rawData: unknown;
  news: Array<{
    title: string;
    source: string;
    publishedAt: string;
    url: string;
    description: string;
  }>;
}

function fallbackAnalysis(input: AnalysisInput) {
  const getMetric = (key: string) => input.macroCards.find((card) => card.key === key);
  const dgs10 = getMetric("dgs10")?.value ?? null;
  const dxy = getMetric("dxy");
  const vix = getMetric("vix")?.value ?? null;
  const fearGreed = getMetric("fear_greed")?.value ?? null;

  const riskTone =
    (typeof vix === "number" && vix >= 22) || (typeof fearGreed === "number" && fearGreed <= 40)
      ? "리스크오프 우세"
      : "중립~리스크온";
  const rateDirection =
    typeof dgs10 === "number" ? (dgs10 >= 4.4 ? "장기금리 상방 경계" : "장기금리 안정") : "장기금리 확인 필요";
  const dollarDirection =
    typeof dxy?.change === "number"
      ? dxy.change > 0
        ? "달러 강세"
        : "달러 숨고르기"
      : "달러 방향 확인 필요";

  const signals: PositionSignal[] = [
    {
      asset: "TMV",
      signal: typeof dgs10 === "number" && dgs10 >= 4.4 ? "진입가능" : "관망",
      level: typeof dgs10 === "number" && dgs10 >= 4.4 ? "entry" : "neutral",
      reason: "장기금리 수준과 변동성 신호를 기준으로 보수적으로 산출한 fallback 신호입니다."
    },
    {
      asset: "TMF",
      signal: typeof dgs10 === "number" && dgs10 < 4.2 ? "진입가능" : "관망",
      level: typeof dgs10 === "number" && dgs10 < 4.2 ? "entry" : "neutral",
      reason: "장기금리 하향 안정 여부를 기준으로 fallback 신호를 생성했습니다."
    },
    {
      asset: "금",
      signal: riskTone.includes("오프") ? "롱진입" : "관망",
      level: riskTone.includes("오프") ? "entry" : "neutral",
      reason: "리스크오프와 금리 부담 완화 가능성을 기준으로 fallback 신호를 생성했습니다."
    },
    {
      asset: "BTC",
      signal: riskTone.includes("오프") ? "위험" : "롱진입",
      level: riskTone.includes("오프") ? "risk" : "entry",
      reason: "변동성과 심리 지표를 바탕으로 fallback 신호를 생성했습니다."
    }
  ];

  const news: NewsImpactItem[] = input.news.slice(0, 3).map((item) => ({
    title: item.title,
    source: item.source,
    publishedAt: item.publishedAt,
    url: item.url,
    summary: item.description || item.title,
    positionImpact: "뉴스 원문 기반 영향은 제한적이므로 보수적으로 해석이 필요합니다."
  }));

  return {
    headline: "자동 브리핑 fallback 모드로 생성되었습니다.",
    regime: {
      rateDirection,
      riskTone,
      dollarDirection,
      macroSummary:
        "외부 뉴스 또는 Gemini 응답 일부가 불안정해 기본 규칙 기반 브리핑으로 대체했습니다."
    },
    conclusion:
      "데이터 일부는 비어 있을 수 있으므로, 장기금리와 변동성 확인 후 보수적으로 대응하는 편이 안전합니다.",
    signals,
    news,
    causality: FALLBACK_CAUSALITY
  };
}

export async function analyzeBriefing(input: AnalysisInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return fallbackAnalysis(input);
  }

  try {
    const client = new GoogleGenAI({ apiKey });

    const prompt = `
You are generating a Korean morning macro briefing for a mobile dashboard.
Analyze the provided metrics and news. Be specific, concise, and output valid JSON only.

Requirements:
1. Determine macro regime: rateDirection, riskTone, dollarDirection, macroSummary.
2. Produce 4 asset signals for TMV, TMF, 금, BTC.
3. Produce 3 core news summaries with one-line position impact.
4. Produce a sharp one-line conclusion.
5. For the six indicators below, choose currentScenario A or B and update scenario descriptions if needed:
   - 미 10년물 금리
   - CPI
   - VIX
   - DXY
   - 유가
   - BTC 펀딩비
6. Signal words must be one of: 진입가능, 주시, 관망, 위험, 롱진입

Reference data:
${JSON.stringify(input, null, 2)}
`;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            regime: {
              type: Type.OBJECT,
              properties: {
                rateDirection: { type: Type.STRING },
                riskTone: { type: Type.STRING },
                dollarDirection: { type: Type.STRING },
                macroSummary: { type: Type.STRING }
              },
              required: ["rateDirection", "riskTone", "dollarDirection", "macroSummary"]
            },
            conclusion: { type: Type.STRING },
            signals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  asset: { type: Type.STRING },
                  signal: { type: Type.STRING },
                  reason: { type: Type.STRING }
                },
                required: ["asset", "signal", "reason"]
              }
            },
            news: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  publishedAt: { type: Type.STRING },
                  url: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  positionImpact: { type: Type.STRING }
                },
                required: ["title", "source", "publishedAt", "url", "summary", "positionImpact"]
              }
            },
            causality: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  key: { type: Type.STRING },
                  label: { type: Type.STRING },
                  currentScenario: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  scenarios: {
                    type: Type.OBJECT,
                    properties: {
                      A: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          chain: { type: Type.ARRAY, items: { type: Type.STRING } },
                          signals: {
                            type: Type.OBJECT,
                            properties: {
                              TMV: { type: Type.STRING },
                              TMF: { type: Type.STRING },
                              금: { type: Type.STRING },
                              BTC: { type: Type.STRING }
                            },
                            required: ["TMV", "TMF", "금", "BTC"]
                          }
                        },
                        required: ["title", "description", "chain", "signals"]
                      },
                      B: {
                        type: Type.OBJECT,
                        properties: {
                          title: { type: Type.STRING },
                          description: { type: Type.STRING },
                          chain: { type: Type.ARRAY, items: { type: Type.STRING } },
                          signals: {
                            type: Type.OBJECT,
                            properties: {
                              TMV: { type: Type.STRING },
                              TMF: { type: Type.STRING },
                              금: { type: Type.STRING },
                              BTC: { type: Type.STRING }
                            },
                            required: ["TMV", "TMF", "금", "BTC"]
                          }
                        },
                        required: ["title", "description", "chain", "signals"]
                      }
                    },
                    required: ["A", "B"]
                  }
                },
                required: ["key", "label", "currentScenario", "summary", "scenarios"]
              }
            }
          },
          required: ["headline", "regime", "conclusion", "signals", "news", "causality"]
        }
      }
    });

    const parsed = JSON.parse(response.text ?? "{}") as {
      headline: string;
      regime: {
        rateDirection: string;
        riskTone: string;
        dollarDirection: string;
        macroSummary: string;
      };
      conclusion: string;
      signals: Array<{ asset: string; signal: string; reason: string }>;
      news: NewsImpactItem[];
      causality: CausalityIndicator[];
    };

    const signals: PositionSignal[] = parsed.signals
      .filter((item) => ["TMV", "TMF", "금", "BTC"].includes(item.asset))
      .map((item) => ({
        asset: item.asset as PositionSignal["asset"],
        signal: item.signal as PositionSignal["signal"],
        level: toSignalLevel(item.signal),
        reason: item.reason
      }));

    const causality = parsed.causality?.length
      ? parsed.causality.map((indicator) => ({
          ...indicator,
          scenarios: {
            A: {
              ...indicator.scenarios.A,
              signals: {
                TMV: toSignalLevel(indicator.scenarios.A.signals.TMV),
                TMF: toSignalLevel(indicator.scenarios.A.signals.TMF),
                금: toSignalLevel(indicator.scenarios.A.signals.금),
                BTC: toSignalLevel(indicator.scenarios.A.signals.BTC)
              }
            },
            B: {
              ...indicator.scenarios.B,
              signals: {
                TMV: toSignalLevel(indicator.scenarios.B.signals.TMV),
                TMF: toSignalLevel(indicator.scenarios.B.signals.TMF),
                금: toSignalLevel(indicator.scenarios.B.signals.금),
                BTC: toSignalLevel(indicator.scenarios.B.signals.BTC)
              }
            }
          }
        }))
      : FALLBACK_CAUSALITY;

    return {
      headline: parsed.headline,
      regime: parsed.regime,
      conclusion: parsed.conclusion,
      signals,
      news: parsed.news,
      causality
    };
  } catch {
    return fallbackAnalysis(input);
  }
}
