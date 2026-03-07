-- Sprint 10: Mortgage rates cache + expiration tracking
CREATE TABLE IF NOT EXISTS mortgage_rates (
    id TEXT PRIMARY KEY,
    rate_type TEXT NOT NULL DEFAULT 'conforming',
    rate_30yr REAL,
    rate_15yr REAL,
    source TEXT NOT NULL DEFAULT 'freddie_mac',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
