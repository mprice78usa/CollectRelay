-- Sprint 10: Deal details on transactions + custom fields
ALTER TABLE transactions ADD COLUMN sale_price REAL;
ALTER TABLE transactions ADD COLUMN commission_rate REAL;
ALTER TABLE transactions ADD COLUMN commission_amount REAL;
ALTER TABLE transactions ADD COLUMN last_reminder_at TEXT;

-- Custom key-value fields per transaction
CREATE TABLE IF NOT EXISTS transaction_custom_fields (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL,
    field_name TEXT NOT NULL,
    field_value TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_txn_custom_fields_txn ON transaction_custom_fields(transaction_id);

-- Document expiration tracking on checklist items
ALTER TABLE checklist_items ADD COLUMN expiration_days INTEGER;
ALTER TABLE checklist_items ADD COLUMN expires_at TEXT;
