-- Slice 8 landing receipts.
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  artifact_id TEXT,
  summary TEXT NOT NULL,
  metric TEXT NOT NULL,
  next_steps TEXT,
  shipped_url TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_receipts_idea_id ON receipts (idea_id);
CREATE INDEX IF NOT EXISTS idx_receipts_created_at ON receipts (created_at);
