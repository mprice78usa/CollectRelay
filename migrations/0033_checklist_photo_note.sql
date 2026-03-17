ALTER TABLE checklist_items ADD COLUMN photo_note_id TEXT REFERENCES photo_notes(id);
