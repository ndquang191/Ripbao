ALTER TABLE trade_requests
  ADD COLUMN IF NOT EXISTS buyer_hidden_at timestamptz,
  ADD COLUMN IF NOT EXISTS seller_hidden_at timestamptz;
