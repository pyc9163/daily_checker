import { NextResponse } from "next/server";
import { EMPTY_MACRO_CARDS } from "@/lib/constants";
import { getMacroCard } from "@/lib/data-sources";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: { key: string } }
) {
  const exists = EMPTY_MACRO_CARDS.some((card) => card.key === params.key);

  if (!exists) {
    return NextResponse.json({ error: "Unknown macro key" }, { status: 404 });
  }

  const card = await getMacroCard(params.key as (typeof EMPTY_MACRO_CARDS)[number]["key"]);
  return NextResponse.json({ card });
}
