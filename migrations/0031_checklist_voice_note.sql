-- Add voice_note_id to checklist_items for linking tasks back to their source voice note
ALTER TABLE checklist_items ADD COLUMN voice_note_id TEXT REFERENCES voice_notes(id);
