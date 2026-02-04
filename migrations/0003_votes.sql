-- Create votes table for Slice 3 leaderboard voting.
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  idea_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  FOREIGN KEY (idea_id) REFERENCES ideas(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique ON votes (idea_id, voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_idea ON votes (idea_id);
