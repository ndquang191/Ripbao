import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { syncMissingListingPricesForUser } from "@/lib/justtcg-prices";
import { RIFTBOUND_AUTO_FOIL_RARITIES } from "@/lib/riftbound-constants";

export const maxDuration = 60;

type ListingInput = {
  cardId?: string;
  finish?: "nonfoil" | "foil";
  quantity?: number;
  minPrice?: number;
  tcgMultiplier?: number;
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const sql = getDb();
  const items = await sql`
    SELECT listings.card_id AS "cardId", listings.quantity, listings.finish,
      listings.min_price_vnd AS "minPrice",
      listings.tcg_multiplier::float8 AS "tcgMultiplier",
      listings.market_price_usd::float8 AS "marketPriceUsd",
      listings.price_source_updated_at AS "priceSourceUpdatedAt",
      cards.name,
      cards.collector_number AS "collectorNumber",
      cards.set_name AS "set",
      cards.rarity,
      cards.type,
      cards.domains,
      cards.supertype,
      cards.image_url AS "imageUrl"
    FROM listing_prices AS listings
    JOIN cards ON cards.id = listings.card_id
    WHERE listings.user_id = ${user.id} AND listings.is_active
    ORDER BY cards.name, cards.set_id, cards.collector_number
  `;
  return NextResponse.json({ items, user: { username: user.username } });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as {
    items?: ListingInput[];
  } | null;
  if (!Array.isArray(body?.items) || body.items.some((item) =>
    !item || (item.finish !== undefined && item.finish !== "nonfoil" && item.finish !== "foil")
  )) {
    return NextResponse.json({ error: "Loại foil không hợp lệ." }, { status: 400 });
  }
  const items = body.items
    .map((item) => ({
      card_id: String(item.cardId ?? ""),
      finish: item.finish ?? "nonfoil",
      quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)),
      min_price_vnd: Math.max(0, Math.round(Number(item.minPrice) || 0)),
      tcg_multiplier: Math.max(0, Number(item.tcgMultiplier) || 25),
    }))
    .filter((item) => item.card_id && item.quantity > 0);
  const sql = getDb();
  const payload = JSON.stringify(items);
  const autoFoilRarities = [...RIFTBOUND_AUTO_FOIL_RARITIES];
  await sql.transaction((tx) => [
    tx`UPDATE listings SET is_active = false, updated_at = now() WHERE user_id = ${user.id}`,
    tx`
      INSERT INTO listings (user_id, card_id, finish, quantity, min_price_vnd, tcg_multiplier, is_active)
      SELECT ${user.id}, normalized.card_id, normalized.finish,
        sum(normalized.quantity)::integer, max(normalized.min_price_vnd),
        max(normalized.tcg_multiplier), true
      FROM (
        SELECT item.card_id,
          CASE
            WHEN cards.rarity = ANY(${autoFoilRarities}) THEN 'foil'
            ELSE item.finish
          END AS finish,
          item.quantity, item.min_price_vnd, item.tcg_multiplier
        FROM jsonb_to_recordset(${payload}::jsonb) AS item(card_id text, finish text, quantity integer, min_price_vnd bigint, tcg_multiplier numeric)
        JOIN cards ON cards.id = item.card_id AND cards.is_active
      ) AS normalized
      GROUP BY normalized.card_id, normalized.finish
      ON CONFLICT (user_id, card_id, finish, condition) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        min_price_vnd = EXCLUDED.min_price_vnd,
        tcg_multiplier = EXCLUDED.tcg_multiplier,
        is_active = true,
        updated_at = now()
    `,
  ]);
  let priceSync: "synced" | "not-needed" | "failed" = "not-needed";
  try {
    const result = await syncMissingListingPricesForUser(user.id);
    if (result.cards > 0) priceSync = "synced";
  } catch (error) {
    priceSync = "failed";
    console.error("[listings.price-sync]", error);
  }
  const priceRows = await sql`
    SELECT DISTINCT prices.card_id AS "cardId", prices.finish,
      prices.market_price_usd::float8 AS "marketPriceUsd",
      prices.source_updated_at AS "sourceUpdatedAt"
    FROM card_market_prices AS prices
    JOIN listings ON listings.card_id = prices.card_id
      AND listings.finish = prices.finish
    WHERE listings.user_id = ${user.id}
      AND listings.is_active
      AND listings.quantity > 0
  `;
  return NextResponse.json({
    saved: items.length,
    priceSync,
    priceUpdates: priceRows.map((row) => ({
      cardId: String(row.cardId),
      finish: row.finish === "foil" ? "foil" : "nonfoil",
      marketPriceUsd: Number(row.marketPriceUsd),
      sourceUpdatedAt: row.sourceUpdatedAt,
    })),
  });
}
