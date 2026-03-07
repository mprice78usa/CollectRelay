-- CollectRelay: Initial Schema
-- Users (Pro accounts)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    company TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Workspaces (for future team features)
CREATE TABLE workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Workspace members
CREATE TABLE workspace_members (
    workspace_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (workspace_id, user_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Templates (reusable checklists)
CREATE TABLE templates (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'custom',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Template items (checklist item definitions)
CREATE TABLE template_items (
    id TEXT PRIMARY KEY,
    template_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    item_type TEXT NOT NULL DEFAULT 'document' CHECK (item_type IN ('document', 'question', 'checkbox', 'signature')),
    required INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    allowed_file_types TEXT,
    max_file_size INTEGER,
    example_text TEXT,
    FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

-- Transactions (active document collection sessions)
CREATE TABLE transactions (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    template_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    transaction_type TEXT NOT NULL DEFAULT 'custom',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'in_review', 'completed', 'cancelled')),
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT,
    due_date TEXT,
    reminder_enabled INTEGER NOT NULL DEFAULT 1,
    reminder_interval_days INTEGER NOT NULL DEFAULT 2,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
    FOREIGN KEY (template_id) REFERENCES templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Checklist items (per-transaction, cloned from template)
CREATE TABLE checklist_items (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    item_type TEXT NOT NULL DEFAULT 'document' CHECK (item_type IN ('document', 'question', 'checkbox', 'signature')),
    required INTEGER NOT NULL DEFAULT 1,
    sort_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'accepted', 'rejected', 'waived')),
    allowed_file_types TEXT,
    max_file_size INTEGER,
    example_text TEXT,
    due_date TEXT,
    answer TEXT,
    reviewed_by TEXT,
    reviewed_at TEXT,
    review_note TEXT,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Files (uploaded documents, stored in R2)
CREATE TABLE files (
    id TEXT PRIMARY KEY,
    checklist_item_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    uploaded_by_client INTEGER NOT NULL DEFAULT 1,
    filename TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Comments (per-item discussion threads)
CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    checklist_item_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('pro', 'client')),
    author_id TEXT,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Audit events (immutable timeline)
CREATE TABLE audit_events (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    checklist_item_id TEXT,
    actor_type TEXT NOT NULL CHECK (actor_type IN ('pro', 'client', 'system')),
    actor_id TEXT,
    actor_name TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- Client sessions (magic link tokens)
CREATE TABLE client_sessions (
    token TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    client_email TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    session_id TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
