-- Add subscription tracking to workspaces
ALTER TABLE workspaces ADD COLUMN stripe_customer_id TEXT;
ALTER TABLE workspaces ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE workspaces ADD COLUMN plan_key TEXT DEFAULT 'free';
ALTER TABLE workspaces ADD COLUMN billing_interval TEXT;
ALTER TABLE workspaces ADD COLUMN subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE workspaces ADD COLUMN current_period_end TEXT;
ALTER TABLE workspaces ADD COLUMN max_users INTEGER DEFAULT 1;
ALTER TABLE workspaces ADD COLUMN max_storage_bytes INTEGER DEFAULT 536870912000; -- 500GB default

-- Index for looking up workspace by Stripe customer ID
CREATE INDEX IF NOT EXISTS idx_workspaces_stripe_customer ON workspaces(stripe_customer_id);
