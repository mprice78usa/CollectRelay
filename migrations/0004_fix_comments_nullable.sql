-- Fix: comments.checklist_item_id should be nullable (supports transaction-level comments)
-- SQLite doesn't support ALTER COLUMN, so recreate the table

CREATE TABLE comments_new (
    id TEXT PRIMARY KEY,
    checklist_item_id TEXT,
    transaction_id TEXT NOT NULL,
    author_type TEXT NOT NULL CHECK (author_type IN ('pro', 'client')),
    author_id TEXT,
    author_name TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (checklist_item_id) REFERENCES checklist_items(id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

INSERT INTO comments_new SELECT * FROM comments;
DROP TABLE comments;
ALTER TABLE comments_new RENAME TO comments;
