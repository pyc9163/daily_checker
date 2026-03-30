import { FALLBACK_CAUSALITY } from "@/lib/constants";
import { analyzeBriefing } from "@/lib/analysis";
import { getMacroSnapshot, getNewsHeadlines } from "@/lib/data-sources";
import { saveBriefing } from "@/lib/storage";
import { BriefingPayload } from "@/lib/types";

export async function generateBriefing() {
  const now = new Date().toISOString();
  const date = now.slice(0, 10);

  const [macroSnapshot, newsResult] = await Promise.allSettled([
    getMacroSnapshot(),
    getNewsHeadlines()
  ]);

  if (macroSnapshot.status === "rejected") {
    throw macroSnapshot.reason;
  }

  const { cards, raw } = macroSnapshot.value;
  const newsHeadlines = newsResult.status === "fulfilled" ? newsResult.value : [];

  const analysis = await analyzeBriefing({
    date,
    macroCards: cards,
    rawData: raw,
    news: newsHeadlines
  });

  const payload: BriefingPayload = {
    date,
    generatedAt: now,
    updatedAt: now,
    headline: analysis.headline,
    conclusion: analysis.conclusion,
    regime: analysis.regime,
    macroCards: cards,
    causality: analysis.causality?.length ? analysis.causality : FALLBACK_CAUSALITY,
    news: analysis.news,
    signals: analysis.signals,
    rawData: {
      ...raw,
      newsHeadlines
    }
  };

  await saveBriefing(payload);
  return payload;
}
