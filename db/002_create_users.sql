CREATE TABLE IF NOT EXISTS users (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username text NOT NULL,
  display_name text NOT NULL,
  facebook_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_username_format_check
    CHECK (username = lower(username) AND username ~ '^[a-z0-9._]{3,32}$'),
  CONSTRAINT users_display_name_not_blank_check
    CHECK (btrim(display_name) <> ''),
  CONSTRAINT users_facebook_url_not_blank_check
    CHECK (facebook_url IS NULL OR btrim(facebook_url) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS users_username_idx
  ON users (username);

CREATE TABLE IF NOT EXISTS user_authentication (
  user_id bigint PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash text NOT NULL,
  password_changed_at timestamptz NOT NULL DEFAULT now(),
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  CONSTRAINT user_authentication_password_hash_not_blank_check
    CHECK (btrim(password_hash) <> ''),
  CONSTRAINT user_authentication_failed_attempts_check
    CHECK (failed_attempts >= 0)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash text PRIMARY KEY,
  user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT auth_sessions_token_hash_not_blank_check
    CHECK (btrim(token_hash) <> ''),
  CONSTRAINT auth_sessions_expiry_check
    CHECK (expires_at > created_at),
  CONSTRAINT auth_sessions_revoked_after_creation_check
    CHECK (revoked_at IS NULL OR revoked_at >= created_at)
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_idx
  ON auth_sessions (user_id, expires_at DESC)
  WHERE revoked_at IS NULL;
