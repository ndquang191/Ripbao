CREATE TABLE IF NOT EXISTS request_rate_limits (
  key text PRIMARY KEY,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT request_rate_limits_count_check CHECK (request_count > 0)
);

CREATE INDEX IF NOT EXISTS request_rate_limits_updated_idx
  ON request_rate_limits (updated_at);
