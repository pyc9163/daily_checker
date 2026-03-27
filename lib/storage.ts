import { kv } from "@vercel/kv";
import { BRIEFING_STORAGE_KEY, FALLBACK_BRIEFING } from "@/lib/constants";
import { BriefingPayload } from "@/lib/types";

function hasKvBinding() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function saveBriefing(payload: BriefingPayload) {
  if (!hasKvBinding()) {
    return;
  }

  await kv.set(BRIEFING_STORAGE_KEY, payload);
}

export async function getLatestBriefing() {
  if (!hasKvBinding()) {
    return FALLBACK_BRIEFING;
  }

  try {
    const briefing = await kv.get<BriefingPayload>(BRIEFING_STORAGE_KEY);
    return briefing ?? FALLBACK_BRIEFING;
  } catch {
    return FALLBACK_BRIEFING;
  }
}
