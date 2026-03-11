-- Add onboarding tracking to workspaces
-- Default to 1 (completed) so existing workspaces are unaffected
-- New workspaces created via registration will explicitly set to 0
ALTER TABLE workspaces ADD COLUMN onboarding_completed INTEGER NOT NULL DEFAULT 1;
