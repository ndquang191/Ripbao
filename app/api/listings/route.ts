import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

type ListingInput = { cardId?: string; quantity?: number; minPrice?: number; tcgMultiplier?: number };

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const sql = getDb();
  const items = await sql`
    SELECT listings.card_id AS "cardId", listings.quantity,
      listings.min_price_vnd AS "minPrice",
      listings.tcg_multiplier::float8 AS "tcgMultiplier",
      cards.name,
      cards.collector_number AS "collectorNumber",
      cards.set_name AS "set",
      cards.rarity,
      cards.type,
      cards.domains,
      cards.supertype,
      cards.image_url AS "imageUrl"
    FROM listings
    JOIN cards ON cards.id = listings.card_id
    WHERE listings.user_id = ${user.id} AND listings.is_active
    ORDER BY cards.name, cards.set_id, cards.collector_number
  `;
  return NextResponse.json({ items, user: { username: user.username } });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const body = await request.json().catch(() => null) as { items?: ListingInput[] } | null;
  const items = (body?.items ?? []).map((item) => ({
    card_id: String(item.cardId ?? ""),
    quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)),
    min_price_vnd: Math.max(0, Math.round(Number(item.minPrice) || 0)),
    tcg_multiplier: Math.max(0, Number(item.tcgMultiplier) || 0.9),
  })).filter((item) => item.card_id && item.quantity > 0);
  const sql = getDb();
  const payload = JSON.stringify(items);
  await sql.transaction((tx) => [
    tx`UPDATE listings SET is_active = false, updated_at = now() WHERE user_id = ${user.id}`,
    tx`
      INSERT INTO listings (user_id, card_id, quantity, min_price_vnd, tcg_multiplier, is_active)
      SELECT ${user.id}, item.card_id, item.quantity, item.min_price_vnd, item.tcg_multiplier, true
      FROM jsonb_to_recordset(${payload}::jsonb) AS item(card_id text, quantity integer, min_price_vnd bigint, tcg_multiplier numeric)
      JOIN cards ON cards.id = item.card_id AND cards.is_active
      ON CONFLICT (user_id, card_id, finish, condition) DO UPDATE SET
        quantity = EXCLUDED.quantity,
        min_price_vnd = EXCLUDED.min_price_vnd,
        tcg_multiplier = EXCLUDED.tcg_multiplier,
        is_active = true,
        updated_at = now()
    `,
  ]);
  return NextResponse.json({ saved: items.length });
}
