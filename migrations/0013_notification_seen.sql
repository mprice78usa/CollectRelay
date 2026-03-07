-- Migration 0013: Add notification_seen_at for activity feed
ALTER TABLE users ADD COLUMN notification_seen_at TEXT;
