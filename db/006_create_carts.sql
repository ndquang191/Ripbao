CREATE TABLE IF NOT EXISTS carts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT carts_status_check
    CHECK (status IN ('active', 'converted', 'abandoned'))
);

CREATE UNIQUE INDEX IF NOT EXISTS carts_one_active_per_user_idx
  ON carts (user_id)
  WHERE status = 'active';

CREATE TABLE IF NOT EXISTS cart_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cart_id bigint NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  listing_id bigint NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  quantity integer NOT NULL,
  unit_price_vnd bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cart_items_quantity_check
    CHECK (quantity > 0),
  CONSTRAINT cart_items_unit_price_check
    CHECK (unit_price_vnd >= 0),
  CONSTRAINT cart_items_cart_listing_key
    UNIQUE (cart_id, listing_id)
);

CREATE INDEX IF NOT EXISTS cart_items_cart_idx
  ON cart_items (cart_id, id);

