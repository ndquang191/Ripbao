import { NextResponse } from "next/server";
import { getCardFilters, RiftboundApiError } from "@/lib/riftbound";

export async function GET() {
  try {
    return NextResponse.json(await getCardFilters());
  } catch (error) {
    const status = error instanceof RiftboundApiError ? error.status : 502;
    const message = error instanceof Error ? error.message : "Unable to load card filters";
    return NextResponse.json({ error: message }, { status });
  }
}
