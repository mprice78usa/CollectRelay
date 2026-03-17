CREATE TABLE sync_log (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  note_type TEXT NOT NULL,
  note_id TEXT NOT NULL,
  synced_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_sync_log_client ON sync_log(client_id, note_type, note_id);
