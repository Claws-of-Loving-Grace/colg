-- Slice 6 triage metadata for ideas.
ALTER TABLE ideas ADD COLUMN triage_summary TEXT;
ALTER TABLE ideas ADD COLUMN score_components TEXT;
ALTER TABLE ideas ADD COLUMN clarifying_questions TEXT;
ALTER TABLE ideas ADD COLUMN clarifying_responses TEXT;
ALTER TABLE ideas ADD COLUMN dedupe_cluster_id TEXT;
