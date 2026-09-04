import { NextRequest, NextResponse } from "next/server";
import { getAllCards, getCards, RiftboundApiError } from "@/lib/riftbound";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    if (params.get("all") === "true" && !params.get("name")) {
      return NextResponse.json({ items: await getAllCards() });
    }

    const result = await getCards({
      page: toNumber(params.get("page")),
      size: toNumber(params.get("size")),
      name: params.get("name") ?? undefined,
      match: params.get("match") === "exact" ? "exact" : "fuzzy",
      sort: "name",
      direction: 1,
    });

    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof RiftboundApiError ? error.status : 502;
    const message =
      error instanceof Error ? error.message : "Unable to load cards";
    return NextResponse.json({ error: message }, { status });
  }
}

function toNumber(value: string | null): number | undefined {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}
