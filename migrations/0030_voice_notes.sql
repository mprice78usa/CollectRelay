-- Voice Notes table for Voice-to-Task AI feature
CREATE TABLE IF NOT EXISTS voice_notes (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  r2_key TEXT NOT NULL,
  duration_seconds INTEGER,
  file_size INTEGER,
  transcript TEXT,
  transcript_status TEXT DEFAULT 'pending',
  ai_actions TEXT,
  ai_status TEXT DEFAULT 'pending',
  is_relayed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_voice_notes_transaction ON voice_notes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_voice_notes_created_by ON voice_notes(created_by);
