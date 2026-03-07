-- CollectRelay: Starter Templates
-- These are system-level defaults cloned into each new workspace on registration.
-- workspace_id = 'system' and created_by = 'system' for default templates.

-- Template 1: Pre-Approval (Fast)
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by)
VALUES ('tpl_preapproval', 'system', 'Pre-Approval (Fast)', 'Quick pre-approval document collection for borrowers.', 'pre-approval', 1, 'system');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_pa_01', 'tpl_preapproval', 'Government ID', 'Valid driver''s license, passport, or state ID.', 'document', 1, 1, '["pdf","jpg","png"]'),
('ti_pa_02', 'tpl_preapproval', 'Paystubs (30 days)', 'Most recent 30 days of paystubs from all employers.', 'document', 1, 2, '["pdf","jpg","png"]'),
('ti_pa_03', 'tpl_preapproval', 'W-2s (2 years)', 'W-2 forms for the last two tax years. Provide 1099s if self-employed.', 'document', 1, 3, '["pdf","jpg","png"]'),
('ti_pa_04', 'tpl_preapproval', 'Bank Statements (2 months)', 'All pages of statements for the last two months from all accounts.', 'document', 1, 4, '["pdf","jpg","png"]'),
('ti_pa_05', 'tpl_preapproval', 'Employment Type', 'What is your employment type?', 'question', 1, 5, NULL),
('ti_pa_06', 'tpl_preapproval', 'Do you have gift funds?', 'Will you be using gift funds for this transaction?', 'question', 1, 6, NULL),
('ti_pa_07', 'tpl_preapproval', 'Authorization to Pull Credit', 'Authorization form for credit check.', 'signature', 1, 7, NULL);

-- Template 2: Purchase (Standard)
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by)
VALUES ('tpl_purchase', 'system', 'Purchase (Standard)', 'Full document collection for a home purchase transaction.', 'purchase', 1, 'system');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_pu_01', 'tpl_purchase', 'Government ID', 'Valid driver''s license, passport, or state ID.', 'document', 1, 1, '["pdf","jpg","png"]'),
('ti_pu_02', 'tpl_purchase', 'Paystubs (30 days)', 'Most recent 30 days of paystubs from all employers.', 'document', 1, 2, '["pdf","jpg","png"]'),
('ti_pu_03', 'tpl_purchase', 'W-2s (2 years)', 'W-2 forms for the last two tax years.', 'document', 1, 3, '["pdf","jpg","png"]'),
('ti_pu_04', 'tpl_purchase', 'Bank Statements (2 months)', 'All pages from all accounts.', 'document', 1, 4, '["pdf","jpg","png"]'),
('ti_pu_05', 'tpl_purchase', 'Purchase Contract', 'Fully executed purchase agreement.', 'document', 1, 5, '["pdf"]'),
('ti_pu_06', 'tpl_purchase', 'Earnest Money Receipt', 'Proof of earnest money deposit.', 'document', 1, 6, '["pdf","jpg","png"]'),
('ti_pu_07', 'tpl_purchase', 'Gift Letter', 'If using gift funds, provide a signed gift letter.', 'document', 0, 7, '["pdf"]'),
('ti_pu_08', 'tpl_purchase', 'Explanation Letter', 'Letter of explanation for any credit or employment gaps.', 'document', 0, 8, '["pdf"]'),
('ti_pu_09', 'tpl_purchase', 'HOA Documents', 'HOA covenants, fees, and contact info if applicable.', 'document', 0, 9, '["pdf"]'),
('ti_pu_10', 'tpl_purchase', 'Homeowners Insurance Binder', 'Insurance binder for the new property.', 'document', 0, 10, '["pdf"]'),
('ti_pu_11', 'tpl_purchase', 'Authorization to Pull Credit', 'Authorization form for credit check.', 'signature', 1, 11, NULL);

-- Template 3: Refinance
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by)
VALUES ('tpl_refinance', 'system', 'Refinance', 'Document collection for refinance transactions.', 'refinance', 1, 'system');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_re_01', 'tpl_refinance', 'Government ID', 'Valid driver''s license, passport, or state ID.', 'document', 1, 1, '["pdf","jpg","png"]'),
('ti_re_02', 'tpl_refinance', 'Paystubs (30 days)', 'Most recent 30 days of paystubs.', 'document', 1, 2, '["pdf","jpg","png"]'),
('ti_re_03', 'tpl_refinance', 'W-2s (2 years)', 'W-2 forms for the last two tax years.', 'document', 1, 3, '["pdf","jpg","png"]'),
('ti_re_04', 'tpl_refinance', 'Bank Statements (2 months)', 'All pages from all accounts.', 'document', 1, 4, '["pdf","jpg","png"]'),
('ti_re_05', 'tpl_refinance', 'Current Mortgage Statement', 'Most recent mortgage statement.', 'document', 1, 5, '["pdf","jpg","png"]'),
('ti_re_06', 'tpl_refinance', 'Homeowners Insurance Declaration', 'Current homeowners insurance policy declaration page.', 'document', 1, 6, '["pdf"]'),
('ti_re_07', 'tpl_refinance', 'Property Tax Statement', 'Most recent property tax bill or escrow statement.', 'document', 1, 7, '["pdf","jpg","png"]'),
('ti_re_08', 'tpl_refinance', 'Authorization to Pull Credit', 'Authorization form for credit check.', 'signature', 1, 8, NULL);

-- Template 4: Seller Packet (Agent-focused)
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by)
VALUES ('tpl_seller', 'system', 'Seller Packet', 'Listing and disclosure documents for sellers.', 'seller', 1, 'system');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_se_01', 'tpl_seller', 'Listing Agreement', 'Signed listing agreement between seller and agent.', 'signature', 1, 1, NULL),
('ti_se_02', 'tpl_seller', 'Seller Disclosures', 'State-required property disclosure forms.', 'document', 1, 2, '["pdf"]'),
('ti_se_03', 'tpl_seller', 'HOA Information', 'HOA name, contact, fees, and governing documents.', 'document', 0, 3, '["pdf"]'),
('ti_se_04', 'tpl_seller', 'Utility Information', 'Average utility costs and providers.', 'document', 0, 4, '["pdf","jpg","png"]'),
('ti_se_05', 'tpl_seller', 'Repair Receipts', 'Receipts or invoices for recent repairs or improvements.', 'document', 0, 5, '["pdf","jpg","png"]'),
('ti_se_06', 'tpl_seller', 'Property Survey', 'Most recent property survey if available.', 'document', 0, 6, '["pdf"]');
