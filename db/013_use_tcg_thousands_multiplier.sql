ALTER TABLE listings ALTER COLUMN tcg_multiplier SET DEFAULT 25;

UPDATE listings SET tcg_multiplier = 25 WHERE tcg_multiplier <= 1;

CREATE OR REPLACE VIEW listing_prices AS
SELECT
  listings.*,
  prices.market_price_usd,
  prices.market_price_vnd,
  prices.source_updated_at AS price_source_updated_at,
  prices.synced_at AS price_synced_at,
  GREATEST(
    listings.min_price_vnd,
    CASE
      WHEN prices.market_price_usd IS NULL THEN 0
      ELSE ceil(prices.market_price_usd * listings.tcg_multiplier)::bigint * 1000
    END
  ) AS effective_price_vnd
FROM listings
LEFT JOIN card_market_prices AS prices
  ON prices.card_id = listings.card_id
  AND prices.finish = listings.finish;
