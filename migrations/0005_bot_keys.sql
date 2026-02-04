-- Self-serve bot keys.
CREATE TABLE IF NOT EXISTS bot_keys (
  id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  contact TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  last_used_at TEXT,
  revoked INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_bot_keys_hash ON bot_keys (key_hash);
CREATE INDEX IF NOT EXISTS idx_bot_keys_revoked ON bot_keys (revoked);
