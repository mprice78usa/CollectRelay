-- Migration 0019: Add AI summary columns to files
ALTER TABLE files ADD COLUMN ai_summary TEXT;
ALTER TABLE files ADD COLUMN ai_summary_status TEXT DEFAULT 'pending';
