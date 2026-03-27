import { GoogleGenAI, Type } from "@google/genai";
import { FALLBACK_CAUSALITY } from "@/lib/constants";
import { CausalityIndicator, NewsImpactItem, PositionSignal } from "@/lib/types";
import { toSignalLevel } from "@/lib/utils";

interface AnalysisInput {
  date: string;
  macroCards: unknown;
  rawData: unknown;
  news: Array<{
    title: string;
    source: string;
    publishedAt: string;
    url: string;
    description: string;
  }>;
}

export async function analyzeBriefing(input: AnalysisInput) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

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
}
