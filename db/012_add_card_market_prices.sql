CREATE TABLE IF NOT EXISTS card_market_prices (
  card_id text NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  finish text NOT NULL,
  market_price_usd numeric(12, 2) NOT NULL,
  market_price_vnd bigint NOT NULL,
  usd_to_vnd numeric(12, 4) NOT NULL,
  source text NOT NULL DEFAULT 'justtcg',
  source_variant_id text,
  source_sku_id text,
  source_updated_at timestamptz NOT NULL,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (card_id, finish),
  CONSTRAINT card_market_prices_finish_check CHECK (finish IN ('nonfoil', 'foil')),
  CONSTRAINT card_market_prices_usd_check CHECK (market_price_usd >= 0),
  CONSTRAINT card_market_prices_vnd_check CHECK (market_price_vnd >= 0),
  CONSTRAINT card_market_prices_exchange_rate_check CHECK (usd_to_vnd > 0)
);

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
      WHEN prices.market_price_vnd IS NULL THEN 0
      ELSE ceil(prices.market_price_vnd * listings.tcg_multiplier / 1000.0)::bigint * 1000
    END
  ) AS effective_price_vnd
FROM listings
LEFT JOIN card_market_prices AS prices
  ON prices.card_id = listings.card_id
  AND prices.finish = listings.finish;
