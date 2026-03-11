-- White-label branding columns for workspaces
ALTER TABLE workspaces ADD COLUMN brand_logo_r2_key TEXT;
ALTER TABLE workspaces ADD COLUMN brand_color TEXT;
ALTER TABLE workspaces ADD COLUMN brand_name TEXT;
