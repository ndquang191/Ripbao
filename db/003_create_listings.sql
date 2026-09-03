CREATE TABLE IF NOT EXISTS listings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id text NOT NULL REFERENCES cards(id) ON DELETE RESTRICT,
  finish text NOT NULL DEFAULT 'nonfoil',
  condition text NOT NULL DEFAULT 'unspecified',
  quantity integer NOT NULL,
  min_price_vnd bigint NOT NULL DEFAULT 0,
  tcg_multiplier numeric(6, 3) NOT NULL DEFAULT 0.900,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listings_finish_check
    CHECK (finish IN ('nonfoil', 'foil')),
  CONSTRAINT listings_condition_not_blank_check
    CHECK (btrim(condition) <> ''),
  CONSTRAINT listings_quantity_check
    CHECK (quantity >= 0),
  CONSTRAINT listings_min_price_check
    CHECK (min_price_vnd >= 0),
  CONSTRAINT listings_tcg_multiplier_check
    CHECK (tcg_multiplier >= 0),
  CONSTRAINT listings_user_card_variant_key
    UNIQUE (user_id, card_id, finish, condition)
);

CREATE INDEX IF NOT EXISTS listings_public_collection_idx
  ON listings (user_id, card_id)
  WHERE is_active AND quantity > 0;

CREATE INDEX IF NOT EXISTS listings_card_market_idx
  ON listings (card_id, min_price_vnd)
  WHERE is_active AND quantity > 0;

