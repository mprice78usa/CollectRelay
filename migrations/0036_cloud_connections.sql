-- Phase 3: cloud storage exports (Box, Dropbox, Drive)
-- One row per workspace per provider. Tokens stored encrypted at rest by Cloudflare.

CREATE TABLE cloud_connections (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('box', 'dropbox', 'gdrive')),
    external_user_id TEXT NOT NULL,
    external_account_email TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TEXT,
    default_folder_id TEXT,
    default_folder_name TEXT,
    connected_by TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE (workspace_id, provider),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (connected_by) REFERENCES users(id)
);

CREATE INDEX idx_cloud_connections_workspace ON cloud_connections(workspace_id);

CREATE TABLE cloud_export_log (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    user_id TEXT,
    file_id TEXT,
    transaction_id TEXT,
    external_file_id TEXT,
    external_path TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX idx_cloud_export_log_workspace ON cloud_export_log(workspace_id, created_at DESC);
CREATE INDEX idx_cloud_export_log_file ON cloud_export_log(file_id);
