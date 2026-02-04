-- Slice 7: build artifacts and receipts.
CREATE TABLE IF NOT EXISTS build_artifacts (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  pr_url TEXT,
  deploy_url TEXT,
  status TEXT NOT NULL,
  claimed_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_build_artifacts_idea ON build_artifacts (idea_id);
CREATE INDEX IF NOT EXISTS idx_build_artifacts_agent ON build_artifacts (agent_id);
CREATE INDEX IF NOT EXISTS idx_build_artifacts_status ON build_artifacts (status);

CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  artifact_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  metric TEXT NOT NULL,
  next_steps TEXT,
  shipped_url TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE INDEX IF NOT EXISTS idx_receipts_idea ON receipts (idea_id);
CREATE INDEX IF NOT EXISTS idx_receipts_artifact ON receipts (artifact_id);
