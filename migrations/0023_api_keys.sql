-- API keys for public REST API authentication
CREATE TABLE api_keys (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    last_used_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    revoked_at TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

-- Track webhook source (null = UI-created, 'zapier' = API subscription)
ALTER TABLE webhooks ADD COLUMN source TEXT;
