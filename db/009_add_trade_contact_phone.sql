ALTER TABLE trade_requests ADD COLUMN IF NOT EXISTS buyer_contact_phone text;

ALTER TABLE trade_requests ADD CONSTRAINT trade_requests_phone_not_blank_check
  CHECK (buyer_contact_phone IS NULL OR btrim(buyer_contact_phone) <> '');
