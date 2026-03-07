-- Migration 0015: Partner links for read-only partner portals
CREATE TABLE IF NOT EXISTS partner_links (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    partner_type TEXT NOT NULL DEFAULT 'other' CHECK (partner_type IN ('lender', 'title', 'agent', 'other')),
    partner_name TEXT NOT NULL,
    partner_email TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    scope TEXT NOT NULL DEFAULT '{}',
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT NOT NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_partner_links_token ON partner_links(token);
CREATE INDEX IF NOT EXISTS idx_partner_links_txn ON partner_links(transaction_id);
