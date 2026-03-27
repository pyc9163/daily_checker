import { NextResponse } from "next/server";
import { getLatestBriefing } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const briefing = await getLatestBriefing();
    return NextResponse.json(briefing);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to read briefing"
      },
      { status: 500 }
    );
  }
}
