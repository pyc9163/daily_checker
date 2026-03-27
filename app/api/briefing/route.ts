import { NextResponse } from "next/server";
import { generateBriefing } from "@/lib/briefing";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const briefing = await generateBriefing();
    return NextResponse.json(briefing);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate briefing"
      },
      { status: 500 }
    );
  }
}
