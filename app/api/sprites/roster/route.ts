import { NextResponse } from "next/server";
import { buildCharacterRoster } from "../../../../lib/server/sprite-roster";

export async function GET() {
  try {
    const roster = await buildCharacterRoster();
    return NextResponse.json({ roster });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build roster";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
