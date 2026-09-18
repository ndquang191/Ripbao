import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  syncMissingCardPrices,
  type PriceLookupItem,
} from "@/lib/justtcg-prices";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    items?: PriceLookupItem[];
  } | null;
  if (!Array.isArray(body?.items) || body.items.length > 100) {
    return NextResponse.json({ error: "Danh sách card không hợp lệ." }, { status: 400 });
  }
  const items = body.items
    .map((item) => ({
      cardId: String(item?.cardId ?? ""),
      finish: item?.finish,
    }))
    .filter((item): item is PriceLookupItem =>
      Boolean(item.cardId) && (item.finish === "nonfoil" || item.finish === "foil")
    );
  if (items.length !== body.items.length) {
    return NextResponse.json({ error: "Phiên bản card không hợp lệ." }, { status: 400 });
  }
  try {
    const { result, priceUpdates } = await syncMissingCardPrices(items);
    return NextResponse.json({
      priceUpdates,
      fetchedCards: result.cards,
      requests: result.batches,
    });
  } catch (error) {
    console.error("[prices.lookup]", error);
    return NextResponse.json({ error: "Chưa thể lấy giá TCG." }, { status: 502 });
  }
}
