-- Add email column to participants
ALTER TABLE participants ADD COLUMN email TEXT;

-- Workspace images table
CREATE TABLE IF NOT EXISTS workspace_images (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  participant_id TEXT,
  participant_name TEXT,
  participant_email TEXT,
  image_data TEXT NOT NULL,
  prompt TEXT NOT NULL,
  generation_num INTEGER NOT NULL DEFAULT 1,
  type TEXT NOT NULL DEFAULT 'individual',
  feature_names TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_wi_session ON workspace_images(session_id);
CREATE INDEX idx_wi_participant ON workspace_images(participant_id);
