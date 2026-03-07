-- Migration 0014: Key Dates / Milestones
CREATE TABLE IF NOT EXISTS transaction_milestones (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    milestone_type TEXT NOT NULL DEFAULT 'custom',
    label TEXT NOT NULL,
    date TEXT,
    completed INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_milestones_txn ON transaction_milestones(transaction_id);
