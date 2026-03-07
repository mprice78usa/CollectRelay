-- Migration 0016: Add SMS toggle per transaction (default ON for backward compat)
ALTER TABLE transactions ADD COLUMN sms_enabled INTEGER NOT NULL DEFAULT 1;
