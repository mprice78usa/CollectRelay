-- Sprint 10: Transaction collaborators
CREATE TABLE IF NOT EXISTS transaction_collaborators (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'commenter', 'reviewer')),
    invited_by TEXT NOT NULL,
    invited_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(transaction_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_collaborators_txn ON transaction_collaborators(transaction_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON transaction_collaborators(user_id);
