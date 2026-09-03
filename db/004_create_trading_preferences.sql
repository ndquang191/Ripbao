CREATE TABLE IF NOT EXISTS user_trading_preferences (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_id text,
  name text NOT NULL,
  detail text,
  enabled boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_trading_preferences_option_check
    CHECK (
      option_id IS NULL OR option_id IN (
        'nexus-night',
        'skirmish',
        'ship-inner-city',
        'ship-nationwide'
      )
    ),
  CONSTRAINT user_trading_preferences_name_not_blank_check
    CHECK (btrim(name) <> ''),
  CONSTRAINT user_trading_preferences_detail_not_blank_check
    CHECK (detail IS NULL OR btrim(detail) <> ''),
  CONSTRAINT user_trading_preferences_position_check
    CHECK (position >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS user_trading_preferences_default_idx
  ON user_trading_preferences (user_id, option_id)
  WHERE option_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_trading_preferences_user_position_idx
  ON user_trading_preferences (user_id, position, id);
