-- Create system placeholder rows for FK compliance
INSERT OR IGNORE INTO users (id, email, name, password_hash, password_salt) VALUES ('system', 'system@collectrelay.com', 'System', '', '');
INSERT OR IGNORE INTO workspaces (id, name, owner_id, industry) VALUES ('system', 'System Templates', 'system', 'system');

-- =========================================================
-- CONTRACTORS TEMPLATES
-- =========================================================

-- Contractors Template 1: New Project Setup
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_ctr_project', 'system', 'New Project Setup', 'Collect contracts, permits, and insurance before a project kicks off.', 'project_setup', 1, 'system', 'contractors');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_cp_01', 'tpl_ctr_project', 'Signed Contract', 'Fully executed project contract or agreement.', 'signature', 1, 1, NULL),
('ti_cp_02', 'tpl_ctr_project', 'Building Permit', 'Approved building permit for the project scope.', 'document', 1, 2, '["pdf","jpg","png"]'),
('ti_cp_03', 'tpl_ctr_project', 'Insurance Certificate (COI)', 'Certificate of insurance showing general liability coverage.', 'document', 1, 3, '["pdf"]'),
('ti_cp_04', 'tpl_ctr_project', 'W-9 Form', 'Completed W-9 for tax reporting purposes.', 'document', 1, 4, '["pdf","jpg","png"]'),
('ti_cp_05', 'tpl_ctr_project', 'Scope of Work', 'Detailed scope of work document or specification sheet.', 'document', 1, 5, '["pdf"]'),
('ti_cp_06', 'tpl_ctr_project', 'Project Timeline', 'What is the expected project start date and duration?', 'question', 1, 6, NULL);

-- Contractors Template 2: Subcontractor Onboarding
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_ctr_sub', 'system', 'Subcontractor Onboarding', 'Collect licenses, insurance, and agreements from subcontractors before they start work.', 'sub_onboarding', 1, 'system', 'contractors');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_cs_01', 'tpl_ctr_sub', 'Contractor License', 'Valid contractor or trade license for the jurisdiction.', 'document', 1, 1, '["pdf","jpg","png"]'),
('ti_cs_02', 'tpl_ctr_sub', 'Workers Comp Certificate', 'Workers'' compensation insurance certificate.', 'document', 1, 2, '["pdf"]'),
('ti_cs_03', 'tpl_ctr_sub', 'General Liability COI', 'Certificate of insurance for general liability coverage.', 'document', 1, 3, '["pdf"]'),
('ti_cs_04', 'tpl_ctr_sub', 'W-9 Form', 'Completed W-9 for tax reporting.', 'document', 1, 4, '["pdf","jpg","png"]'),
('ti_cs_05', 'tpl_ctr_sub', 'Signed Subcontractor Agreement', 'Executed subcontractor agreement or master service agreement.', 'signature', 1, 5, NULL),
('ti_cs_06', 'tpl_ctr_sub', 'Trade Certifications', 'Relevant trade certifications (electrical, plumbing, HVAC, etc.).', 'document', 0, 6, '["pdf","jpg","png"]');

-- Contractors Template 3: Draw Request / Pay Application
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_ctr_draw', 'system', 'Draw Request / Pay App', 'Collect payment applications, lien waivers, and progress documentation for each draw.', 'draw_request', 1, 'system', 'contractors');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_cd_01', 'tpl_ctr_draw', 'Payment Application', 'AIA G702/G703 or equivalent payment application form.', 'document', 1, 1, '["pdf"]'),
('ti_cd_02', 'tpl_ctr_draw', 'Lien Waiver', 'Conditional or unconditional lien waiver for current draw.', 'document', 1, 2, '["pdf"]'),
('ti_cd_03', 'tpl_ctr_draw', 'Progress Photos', 'Photos documenting work completed for this pay period.', 'document', 1, 3, '["pdf","jpg","png"]'),
('ti_cd_04', 'tpl_ctr_draw', 'Updated Schedule', 'Current project schedule showing progress and milestones.', 'document', 0, 4, '["pdf"]'),
('ti_cd_05', 'tpl_ctr_draw', 'Change Order', 'Signed change order if scope has changed since last draw.', 'document', 0, 5, '["pdf"]'),
('ti_cd_06', 'tpl_ctr_draw', 'Inspection Report', 'Third-party inspection report if required by lender or owner.', 'document', 0, 6, '["pdf"]');

-- =========================================================
-- ACCOUNTANTS TEMPLATES
-- =========================================================

-- Accountants Template 1: Tax Return Engagement
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_acc_tax', 'system', 'Tax Return Engagement', 'Collect income documents, deductions, and engagement authorization for tax preparation.', 'tax_return', 1, 'system', 'accountants');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_at_01', 'tpl_acc_tax', 'Prior Year Tax Return', 'Complete copy of last year''s federal and state tax returns.', 'document', 1, 1, '["pdf"]'),
('ti_at_02', 'tpl_acc_tax', 'W-2 Forms', 'W-2 forms from all employers for the tax year.', 'document', 1, 2, '["pdf","jpg","png"]'),
('ti_at_03', 'tpl_acc_tax', '1099 Forms', 'All 1099 forms (1099-INT, 1099-DIV, 1099-MISC, 1099-NEC, etc.).', 'document', 1, 3, '["pdf","jpg","png"]'),
('ti_at_04', 'tpl_acc_tax', 'K-1 Forms', 'Schedule K-1 forms from partnerships, S-corps, or trusts.', 'document', 0, 4, '["pdf"]'),
('ti_at_05', 'tpl_acc_tax', 'Bank Interest Statements', 'Year-end interest statements from all bank accounts.', 'document', 1, 5, '["pdf","jpg","png"]'),
('ti_at_06', 'tpl_acc_tax', 'Charitable Donation Receipts', 'Receipts for charitable contributions and donations.', 'document', 0, 6, '["pdf","jpg","png"]'),
('ti_at_07', 'tpl_acc_tax', 'Signed Engagement Letter', 'Authorization to prepare and file tax returns.', 'signature', 1, 7, NULL);

-- Accountants Template 2: New Client Onboarding
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_acc_onboard', 'system', 'New Client Onboarding', 'Collect identification, prior records, and engagement authorization for new accounting clients.', 'client_onboarding', 1, 'system', 'accountants');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_ao_01', 'tpl_acc_onboard', 'Government ID', 'Valid driver''s license, passport, or state-issued ID.', 'document', 1, 1, '["pdf","jpg","png"]'),
('ti_ao_02', 'tpl_acc_onboard', 'Signed Engagement Letter', 'Executed engagement letter outlining scope and fees.', 'signature', 1, 2, NULL),
('ti_ao_03', 'tpl_acc_onboard', 'Prior Year Returns (2 years)', 'Last two years of federal and state tax returns.', 'document', 1, 3, '["pdf"]'),
('ti_ao_04', 'tpl_acc_onboard', 'Entity Documents', 'Articles of incorporation, operating agreements, or EIN letter if applicable.', 'document', 0, 4, '["pdf"]'),
('ti_ao_05', 'tpl_acc_onboard', 'Accounting Software Access', 'What accounting software do you use (QuickBooks, Xero, etc.) and can you provide access?', 'question', 1, 5, NULL),
('ti_ao_06', 'tpl_acc_onboard', 'Authorized Contacts', 'Who else is authorized to communicate on this account?', 'question', 1, 6, NULL);

-- Accountants Template 3: Financial Statement Review
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_acc_financial', 'system', 'Financial Statement Review', 'Collect financial records for compilation, review, or audit engagements.', 'financial_review', 1, 'system', 'accountants');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_af_01', 'tpl_acc_financial', 'Bank Statements (12 months)', 'Complete bank statements for all accounts for the review period.', 'document', 1, 1, '["pdf"]'),
('ti_af_02', 'tpl_acc_financial', 'Profit & Loss Statement', 'Year-to-date or period P&L from your accounting software.', 'document', 1, 2, '["pdf","xlsx","csv"]'),
('ti_af_03', 'tpl_acc_financial', 'Balance Sheet', 'Current balance sheet from your accounting software.', 'document', 1, 3, '["pdf","xlsx","csv"]'),
('ti_af_04', 'tpl_acc_financial', 'General Ledger', 'Detailed general ledger for the review period.', 'document', 1, 4, '["pdf","xlsx","csv"]'),
('ti_af_05', 'tpl_acc_financial', 'Accounts Receivable Aging', 'Current A/R aging report.', 'document', 0, 5, '["pdf","xlsx","csv"]'),
('ti_af_06', 'tpl_acc_financial', 'Accounts Payable Aging', 'Current A/P aging report.', 'document', 0, 6, '["pdf","xlsx","csv"]');

-- =========================================================
-- HR TEMPLATES
-- =========================================================

-- HR Template 1: New Hire Onboarding
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_hr_newhire', 'system', 'New Hire Onboarding', 'Collect identification, tax forms, and employment documents from new employees.', 'new_hire', 1, 'system', 'hr');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_hn_01', 'tpl_hr_newhire', 'Government ID', 'Valid driver''s license, passport, or state-issued ID for I-9 verification.', 'document', 1, 1, '["pdf","jpg","png"]'),
('ti_hn_02', 'tpl_hr_newhire', 'I-9 Form', 'Completed Employment Eligibility Verification form.', 'document', 1, 2, '["pdf"]'),
('ti_hn_03', 'tpl_hr_newhire', 'W-4 Form', 'Federal tax withholding form.', 'document', 1, 3, '["pdf"]'),
('ti_hn_04', 'tpl_hr_newhire', 'Direct Deposit Form', 'Bank account information for payroll direct deposit.', 'document', 1, 4, '["pdf","jpg","png"]'),
('ti_hn_05', 'tpl_hr_newhire', 'Emergency Contact', 'Please provide your emergency contact name, phone number, and relationship.', 'question', 1, 5, NULL),
('ti_hn_06', 'tpl_hr_newhire', 'Signed Offer Letter', 'Acknowledgment and acceptance of the employment offer.', 'signature', 1, 6, NULL);

-- HR Template 2: Benefits Enrollment
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_hr_benefits', 'system', 'Benefits Enrollment', 'Collect insurance elections, beneficiary info, and dependent documentation during open enrollment.', 'benefits', 1, 'system', 'hr');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_hb_01', 'tpl_hr_benefits', 'Insurance Election Form', 'Completed health/dental/vision insurance election form.', 'document', 1, 1, '["pdf"]'),
('ti_hb_02', 'tpl_hr_benefits', 'Beneficiary Designation', 'Life insurance and retirement beneficiary designation form.', 'document', 1, 2, '["pdf"]'),
('ti_hb_03', 'tpl_hr_benefits', 'Dependent Documentation', 'Birth certificates, marriage certificate, or court orders for dependents.', 'document', 0, 3, '["pdf","jpg","png"]'),
('ti_hb_04', 'tpl_hr_benefits', 'Prior Coverage Information', 'Certificate of prior health coverage or COBRA documentation.', 'document', 0, 4, '["pdf"]'),
('ti_hb_05', 'tpl_hr_benefits', 'FSA/HSA Election', 'What is your annual FSA or HSA contribution election amount?', 'question', 1, 5, NULL);

-- HR Template 3: Performance Review
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_hr_review', 'system', 'Performance Review', 'Collect self-assessments, goals, and development plans for annual reviews.', 'performance', 1, 'system', 'hr');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_hr_01', 'tpl_hr_review', 'Self-Assessment', 'Completed self-assessment form for the review period.', 'document', 1, 1, '["pdf","docx"]'),
('ti_hr_02', 'tpl_hr_review', 'Goal Setting Worksheet', 'Goals and objectives for the upcoming review period.', 'document', 1, 2, '["pdf","docx"]'),
('ti_hr_03', 'tpl_hr_review', 'Manager Acknowledgment', 'Acknowledgment that the review has been discussed and received.', 'signature', 1, 3, NULL),
('ti_hr_04', 'tpl_hr_review', 'Development Plan', 'Professional development plan or training requests.', 'document', 0, 4, '["pdf","docx"]'),
('ti_hr_05', 'tpl_hr_review', 'Training Certificates', 'Certificates from completed training or continuing education.', 'document', 0, 5, '["pdf","jpg","png"]');

-- =========================================================
-- OTHER / GENERAL TEMPLATES
-- =========================================================

-- Other Template 1: Document Request
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_gen_request', 'system', 'Document Request', 'Simple template for requesting documents from anyone.', 'general', 1, 'system', 'other');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_gr_01', 'tpl_gen_request', 'Document Upload', 'Upload the requested documents here.', 'document', 1, 1, '["pdf","jpg","png","docx","xlsx"]'),
('ti_gr_02', 'tpl_gen_request', 'Additional Information', 'Is there anything else we should know about these documents?', 'question', 0, 2, NULL),
('ti_gr_03', 'tpl_gen_request', 'Acknowledgment', 'I confirm the documents provided are accurate and complete.', 'signature', 1, 3, NULL);

-- Other Template 2: Client Intake
INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by, industry)
VALUES ('tpl_gen_intake', 'system', 'Client Intake', 'Onboard new clients with identification, agreements, and contact information.', 'intake', 1, 'system', 'other');

INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types) VALUES
('ti_gi_01', 'tpl_gen_intake', 'Government ID', 'Valid government-issued photo identification.', 'document', 1, 1, '["pdf","jpg","png"]'),
('ti_gi_02', 'tpl_gen_intake', 'Signed Agreement', 'Service agreement or engagement letter.', 'signature', 1, 2, NULL),
('ti_gi_03', 'tpl_gen_intake', 'Additional Documents', 'Any additional documents relevant to your engagement.', 'document', 0, 3, '["pdf","jpg","png","docx","xlsx"]'),
('ti_gi_04', 'tpl_gen_intake', 'Contact Information', 'Please provide your preferred phone number and mailing address.', 'question', 1, 4, NULL);
