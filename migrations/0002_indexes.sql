-- CollectRelay: Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_templates_workspace ON templates(workspace_id);
CREATE INDEX idx_templates_category ON templates(category);
CREATE INDEX idx_transactions_workspace ON transactions(workspace_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);
CREATE INDEX idx_transactions_client_email ON transactions(client_email);
CREATE INDEX idx_checklist_items_transaction ON checklist_items(transaction_id);
CREATE INDEX idx_checklist_items_status ON checklist_items(status);
CREATE INDEX idx_files_checklist_item ON files(checklist_item_id);
CREATE INDEX idx_files_transaction ON files(transaction_id);
CREATE INDEX idx_comments_checklist_item ON comments(checklist_item_id);
CREATE INDEX idx_comments_transaction ON comments(transaction_id);
CREATE INDEX idx_audit_events_transaction ON audit_events(transaction_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);
CREATE INDEX idx_client_sessions_transaction ON client_sessions(transaction_id);
CREATE INDEX idx_client_sessions_expires ON client_sessions(expires_at);
