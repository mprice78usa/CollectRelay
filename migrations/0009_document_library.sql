-- Sprint 10: Document library for lender/agent forms
CREATE TABLE IF NOT EXISTS document_library (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('lender', 'agent', 'custom')),
    name TEXT NOT NULL,
    description TEXT,
    filename TEXT,
    r2_key TEXT,
    file_size INTEGER,
    mime_type TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_library_workspace ON document_library(workspace_id);
CREATE INDEX IF NOT EXISTS idx_doc_library_category ON document_library(category);
