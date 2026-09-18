import { NextResponse } from "next/server";
import { syncActiveListingPrices } from "@/lib/justtcg-prices";

export const maxDuration = 300;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await syncActiveListingPrices());
  } catch (error) {
    console.error("[prices.sync]", error);
    return NextResponse.json({ error: "Price synchronization failed" }, { status: 502 });
  }
}
