import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

type ItemInput = { id?: string | number; quantity?: number };

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id))
    return NextResponse.json(
      { error: "Giao dịch không hợp lệ." },
      { status: 400 },
    );

  const sql = getDb();
  const result = await sql`
    UPDATE trade_requests
    SET buyer_hidden_at = CASE WHEN buyer_id = ${user.id} THEN now() ELSE buyer_hidden_at END,
        seller_hidden_at = CASE WHEN seller_id = ${user.id} THEN now() ELSE seller_hidden_at END,
        updated_at = now()
    WHERE id = ${id} AND status = 'completed'
      AND (buyer_id = ${user.id} OR seller_id = ${user.id})
    RETURNING id
  `;
  if (!result[0])
    return NextResponse.json(
      { error: "Chỉ có thể ẩn giao dịch đã hoàn thành." },
      { status: 409 },
    );
  return NextResponse.json({ hidden: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Bạn cần đăng nhập." }, { status: 401 });
  const { id } = await params;
  if (!/^\d+$/.test(id))
    return NextResponse.json(
      { error: "Yêu cầu không hợp lệ." },
      { status: 400 },
    );
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    items?: ItemInput[];
  } | null;
  const sql = getDb();

  if (body?.action === "update") {
    const items = (body.items ?? [])
      .map((item) => ({
        id: String(item.id ?? ""),
        quantity: Math.floor(Number(item.quantity) || 0),
      }))
      .filter((item) => /^\d+$/.test(item.id) && item.quantity > 0);
    if (items.length === 0)
      return NextResponse.json(
        { error: "Đơn cần có ít nhất một card." },
        { status: 400 },
      );
    const result = await sql`
      WITH allowed AS (
        SELECT id FROM trade_requests WHERE id = ${id} AND seller_id = ${user.id} AND status = 'pending'
      ), payload AS (
        SELECT * FROM jsonb_to_recordset(${JSON.stringify(items)}::jsonb) AS value(id bigint, quantity integer)
      ), updated AS (
        UPDATE trade_request_items AS item SET quantity = LEAST(payload.quantity, listing.quantity), updated_at = now()
        FROM payload, listings AS listing
        WHERE item.id = payload.id AND item.request_id IN (SELECT id FROM allowed)
          AND listing.id = item.listing_id AND listing.quantity > 0
        RETURNING item.id
      )
      UPDATE trade_requests SET updated_at = now() WHERE id IN (SELECT id FROM allowed)
      RETURNING (SELECT count(*) FROM updated)::integer AS count
    `;
    if (!result[0])
      return NextResponse.json(
        { error: "Bạn không thể sửa yêu cầu này." },
        { status: 403 },
      );
    return NextResponse.json({ updated: Number(result[0].count) });
  }

  if (body?.action === "complete") {
    const result = await sql`
      WITH completed AS (
        UPDATE trade_requests AS request SET status = 'completed', completed_at = now(), updated_at = now()
        WHERE request.id = ${id} AND request.seller_id = ${user.id} AND request.status = 'pending'
          AND NOT EXISTS (
            SELECT 1 FROM trade_request_items AS item
            JOIN listings ON listings.id = item.listing_id
            WHERE item.request_id = request.id AND (NOT listings.is_active OR listings.quantity < item.quantity)
          )
        RETURNING request.id
      ), stock AS (
        UPDATE listings SET quantity = listings.quantity - item.quantity, updated_at = now()
        FROM trade_request_items AS item, completed
        WHERE item.request_id = completed.id AND listings.id = item.listing_id
        RETURNING listings.id
      )
      SELECT id, (SELECT count(*) FROM stock)::integer AS "updatedListings" FROM completed
    `;
    if (!result[0])
      return NextResponse.json(
        { error: "Tồn kho không đủ hoặc giao dịch đã được xử lý." },
        { status: 409 },
      );
    return NextResponse.json({
      completed: true,
      updatedListings: Number(result[0].updatedListings),
    });
  }

  if (body?.action === "cancel") {
    const result = await sql`
      UPDATE trade_requests SET status = 'cancelled', updated_at = now()
      WHERE id = ${id} AND status = 'pending' AND (seller_id = ${user.id} OR buyer_id = ${user.id})
      RETURNING id
    `;
    if (!result[0])
      return NextResponse.json(
        { error: "Không thể huỷ yêu cầu này." },
        { status: 409 },
      );
    return NextResponse.json({ cancelled: true });
  }

  return NextResponse.json(
    { error: "Thao tác không hợp lệ." },
    { status: 400 },
  );
}
