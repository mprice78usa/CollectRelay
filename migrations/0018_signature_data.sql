-- Migration 0018: Add signature metadata to checklist_items
ALTER TABLE checklist_items ADD COLUMN signature_data TEXT;
