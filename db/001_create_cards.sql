CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS cards (
  id text PRIMARY KEY,
  riftbound_id text NOT NULL,
  tcgplayer_id text,
  name text NOT NULL,
  search_name text NOT NULL,
  collector_number integer NOT NULL,
  set_id text NOT NULL,
  set_name text NOT NULL,
  type text NOT NULL,
  supertype text,
  rarity text NOT NULL,
  domains text[] NOT NULL DEFAULT '{}',
  image_url text NOT NULL,
  source_updated_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS cards_search_name_trgm_idx
  ON cards USING gin (search_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS cards_set_number_idx
  ON cards (set_id, collector_number);

CREATE INDEX IF NOT EXISTS cards_filters_idx
  ON cards (set_id, type, rarity)
  WHERE is_active;

CREATE INDEX IF NOT EXISTS cards_domains_idx
  ON cards USING gin (domains);
