-- Migration 0017: Add email notification preferences to users table (all default ON)
ALTER TABLE users ADD COLUMN notify_submissions INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_review_reminders INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN notify_completed INTEGER NOT NULL DEFAULT 1;
