-- Add industry column to templates table
ALTER TABLE templates ADD COLUMN industry TEXT DEFAULT NULL;

-- Tag existing system templates as real_estate
UPDATE templates SET industry = 'real_estate' WHERE workspace_id = 'system' AND is_default = 1;
