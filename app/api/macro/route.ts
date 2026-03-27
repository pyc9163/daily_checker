import { NextResponse } from "next/server";
import { getMacroSnapshot } from "@/lib/data-sources";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const macro = await getMacroSnapshot();
    return NextResponse.json(macro);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load macro data"
      },
      { status: 500 }
    );
  }
}
