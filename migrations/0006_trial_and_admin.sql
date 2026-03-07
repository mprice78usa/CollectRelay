-- Trial support: track when trial ends
ALTER TABLE workspaces ADD COLUMN trial_ends_at TEXT;

-- Admin: ability to disable/revoke users
ALTER TABLE users ADD COLUMN disabled_at TEXT;

-- Backfill: give existing free users a 14-day trial from now
UPDATE workspaces
SET trial_ends_at = datetime('now', '+14 days')
WHERE plan_key = 'free' AND subscription_status = 'inactive';
