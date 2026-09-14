import { NextResponse } from "next/server";
import { getCardFilters, RiftboundApiError } from "@/lib/riftbound";
import { apiErrorResponse } from "@/lib/api-error";

export async function GET() {
  try {
    return NextResponse.json(await getCardFilters());
  } catch (error) {
    const status = error instanceof RiftboundApiError ? error.status : 502;
    return apiErrorResponse("riftbound.filters", error, status);
  }
}
