-- Add industry column to workspaces
-- Defaults to 'real_estate' so existing workspaces are unaffected
ALTER TABLE workspaces ADD COLUMN industry TEXT NOT NULL DEFAULT 'real_estate';
