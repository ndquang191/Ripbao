CREATE TABLE IF NOT EXISTS trade_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  buyer_id bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  seller_id bigint NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT trade_requests_different_users_check CHECK (buyer_id <> seller_id),
  CONSTRAINT trade_requests_status_check CHECK (status IN ('pending', 'completed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS trade_request_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  request_id bigint NOT NULL REFERENCES trade_requests(id) ON DELETE CASCADE,
  listing_id bigint NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
  quantity integer NOT NULL,
  unit_price_vnd bigint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trade_request_items_quantity_check CHECK (quantity > 0),
  CONSTRAINT trade_request_items_price_check CHECK (unit_price_vnd >= 0),
  CONSTRAINT trade_request_items_request_listing_key UNIQUE (request_id, listing_id)
);

CREATE INDEX IF NOT EXISTS trade_requests_buyer_idx ON trade_requests (buyer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trade_requests_seller_idx ON trade_requests (seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS trade_request_items_request_idx ON trade_request_items (request_id, id);
