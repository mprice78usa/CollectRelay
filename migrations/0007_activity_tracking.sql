-- Track when each viewer last saw a transaction
CREATE TABLE activity_seen (
  transaction_id TEXT NOT NULL,
  viewer_type TEXT NOT NULL CHECK (viewer_type IN ('pro', 'client')),
  viewer_id TEXT NOT NULL,
  last_seen_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (transaction_id, viewer_type, viewer_id),
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Track latest activity per checklist item (avoids expensive joins)
CREATE TABLE item_activity (
  checklist_item_id TEXT NOT NULL PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  last_activity_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_activity_type TEXT NOT NULL DEFAULT 'update',
  last_actor_type TEXT NOT NULL DEFAULT 'system',
  last_actor_name TEXT,
  FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Index for fast lookup of unseen items per transaction
CREATE INDEX idx_item_activity_txn ON item_activity(transaction_id);
