import { NextRequest, NextResponse } from "next/server";
import { generateBriefing } from "@/lib/briefing";

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const briefing = await generateBriefing();
    return NextResponse.json({ ok: true, updatedAt: briefing.updatedAt });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cron execution failed"
      },
      { status: 500 }
    );
  }
}
