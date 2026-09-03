import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const sql = getDb();
  const items = await sql`
    SELECT listings.id AS "listingId", cards.id AS "cardId", sellers.username AS seller,
      sellers.facebook_url AS "sellerFacebookUrl",
      cards.name, cards.set_name AS "set", cards.collector_number AS number,
      listings.finish, listings.condition, listings.min_price_vnd AS "unitPrice",
      cards.image_url AS "imageUrl", listings.quantity AS stock, cart_items.quantity
    FROM carts
    JOIN cart_items ON cart_items.cart_id = carts.id
    JOIN listings ON listings.id = cart_items.listing_id
    JOIN users AS sellers ON sellers.id = listings.user_id
    JOIN cards ON cards.id = listings.card_id
    WHERE carts.user_id = ${user.id} AND carts.status = 'active'
    ORDER BY cart_items.id
  `;
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const body = await request.json().catch(() => null) as { items?: Array<{ seller?: string; cardId?: string; finish?: string; condition?: string; quantity?: number }> } | null;
  const items = (body?.items ?? []).map((item) => ({
    seller: String(item.seller ?? "").toLowerCase(),
    card_id: String(item.cardId ?? ""),
    finish: String(item.finish ?? "").toLowerCase() === "foil" ? "foil" : "nonfoil",
    condition: String(item.condition ?? "unspecified"),
    quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
  })).filter((item) => item.seller && item.card_id);
  const sql = getDb();
  const payload = JSON.stringify(items);
  await sql.transaction((tx) => [
    tx`
      INSERT INTO carts (user_id, status) VALUES (${user.id}, 'active')
      ON CONFLICT (user_id) WHERE status = 'active' DO UPDATE SET updated_at = now()
    `,
    tx`DELETE FROM cart_items WHERE cart_id = (SELECT id FROM carts WHERE user_id = ${user.id} AND status = 'active')`,
    tx`
      INSERT INTO cart_items (cart_id, listing_id, quantity, unit_price_vnd)
      SELECT cart.id, listings.id, LEAST(item.quantity, listings.quantity), listings.min_price_vnd
      FROM jsonb_to_recordset(${payload}::jsonb) AS item(seller text, card_id text, finish text, condition text, quantity integer)
      JOIN users AS seller ON seller.username = item.seller
      JOIN listings ON listings.user_id = seller.id AND listings.card_id = item.card_id
        AND listings.finish = item.finish AND listings.condition = item.condition
        AND listings.is_active AND listings.quantity > 0
      CROSS JOIN LATERAL (SELECT id FROM carts WHERE user_id = ${user.id} AND status = 'active') AS cart
    `,
  ]);
  return NextResponse.json({ saved: items.length });
}
