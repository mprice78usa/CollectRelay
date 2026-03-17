CREATE TABLE photo_notes (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  r2_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  title TEXT,
  notes TEXT,
  ai_description TEXT,
  ai_actions TEXT,
  ai_status TEXT DEFAULT 'none',
  is_relayed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
