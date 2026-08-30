import { NextResponse } from "next/server";
import { getAllRiftboundCards } from "@/lib/riftbound";

export async function GET() {
  try {
    const result = await getAllRiftboundCards();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load Riftbound cards";

    return NextResponse.json(
      { error: message },
      { status: message.includes("not configured") ? 503 : 502 },
    );
  }
}
