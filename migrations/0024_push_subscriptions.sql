-- Push subscriptions for Web Push notifications
CREATE TABLE push_subscriptions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    transaction_id TEXT,
    client_email TEXT,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
CREATE INDEX idx_push_subs_transaction ON push_subscriptions(transaction_id);
CREATE INDEX idx_push_subs_workspace ON push_subscriptions(workspace_id);
