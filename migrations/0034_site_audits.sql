CREATE TABLE site_audits (
  id TEXT PRIMARY KEY,
  photo_note_id TEXT NOT NULL REFERENCES photo_notes(id),
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  created_by TEXT NOT NULL REFERENCES users(id),
  workspace_id TEXT NOT NULL,
  findings TEXT,
  summary TEXT,
  overall_severity TEXT,
  finding_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  ai_status TEXT DEFAULT 'pending',
  is_relayed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_site_audits_transaction ON site_audits(transaction_id);
CREATE INDEX idx_site_audits_photo ON site_audits(photo_note_id);
