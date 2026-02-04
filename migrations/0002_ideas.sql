-- Create ideas table for Slice 2 submissions.
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  problem TEXT NOT NULL,
  who_it_helps TEXT NOT NULL,
  mvp_scope TEXT NOT NULL,
  success_metric TEXT NOT NULL,
  constraints TEXT,
  links TEXT,
  status TEXT NOT NULL,
  tags TEXT,
  score REAL,
  submitter_email TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_ideas_status_created ON ideas (status, created_at DESC);
