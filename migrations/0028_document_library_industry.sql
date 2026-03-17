-- Recreate document_library without restrictive CHECK constraint, add industry column
-- Remove FK to workspaces since SYSTEM docs use a virtual workspace_id

-- Step 1: Rename existing table
ALTER TABLE document_library RENAME TO document_library_old;

-- Step 2: Create new table without CHECK constraint or FK, with industry column
CREATE TABLE document_library (
    id TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL,
    category TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    filename TEXT,
    r2_key TEXT,
    file_size INTEGER,
    mime_type TEXT,
    is_system INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    industry TEXT DEFAULT NULL
);

-- Step 3: Copy existing data
INSERT INTO document_library (id, workspace_id, category, name, description, filename, r2_key, file_size, mime_type, is_system, created_by, created_at)
SELECT id, workspace_id, category, name, description, filename, r2_key, file_size, mime_type, is_system, created_by, created_at
FROM document_library_old;

-- Step 4: Drop old table
DROP TABLE document_library_old;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_doc_library_workspace ON document_library(workspace_id);
CREATE INDEX IF NOT EXISTS idx_doc_library_category ON document_library(category);
CREATE INDEX IF NOT EXISTS idx_doc_library_industry ON document_library(industry);

-- Step 6: Tag existing system docs as real_estate
UPDATE document_library SET industry = 'real_estate' WHERE workspace_id = 'SYSTEM' AND is_system = 1;

-- Step 7: Seed industry-specific system documents

-- Contractors system docs
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-01', 'SYSTEM', 'contracts', 'AIA A101 Owner-Contractor Agreement', 'Standard form agreement between owner and contractor for construction', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-02', 'SYSTEM', 'contracts', 'AIA G702 Application for Payment', 'Contractor application and certificate for payment', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-03', 'SYSTEM', 'contracts', 'Subcontractor Agreement Template', 'Standard subcontractor agreement for construction projects', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-04', 'SYSTEM', 'contracts', 'Change Order Form', 'Standard form for documenting scope changes and cost adjustments', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-05', 'SYSTEM', 'contracts', 'Notice to Proceed', 'Formal authorization to begin work on a project', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-06', 'SYSTEM', 'compliance', 'Conditional Lien Waiver', 'Lien waiver conditioned on receipt of payment', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-07', 'SYSTEM', 'compliance', 'Unconditional Lien Waiver', 'Lien waiver effective immediately upon signing', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-08', 'SYSTEM', 'compliance', 'Certificate of Insurance Template', 'Standard ACORD certificate of insurance form', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-09', 'SYSTEM', 'compliance', 'Safety Plan Template', 'Site-specific safety plan for construction projects', 1, 'system', 'contractors');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-ctr-10', 'SYSTEM', 'compliance', 'Daily Field Report', 'Template for daily construction progress and conditions reporting', 1, 'system', 'contractors');

-- Accountants system docs
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-01', 'SYSTEM', 'tax_forms', 'IRS Form 1040 (Individual Tax Return)', 'U.S. individual income tax return form', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-02', 'SYSTEM', 'tax_forms', 'IRS Form 1120 (Corporate Tax Return)', 'U.S. corporation income tax return form', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-03', 'SYSTEM', 'tax_forms', 'IRS Form 1065 (Partnership Return)', 'U.S. return of partnership income', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-04', 'SYSTEM', 'tax_forms', 'IRS Form W-9', 'Request for taxpayer identification number and certification', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-05', 'SYSTEM', 'tax_forms', 'IRS Form 4506-T', 'Request for transcript of tax return', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-06', 'SYSTEM', 'client_forms', 'Engagement Letter Template', 'Standard engagement letter for accounting services', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-07', 'SYSTEM', 'client_forms', 'Power of Attorney (Form 2848)', 'IRS power of attorney and declaration of representative', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-08', 'SYSTEM', 'client_forms', 'Client Information Sheet', 'New client intake questionnaire for accounting services', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-09', 'SYSTEM', 'client_forms', 'Bank Authorization Letter', 'Authorization to release financial records to accountant', 1, 'system', 'accountants');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-acc-10', 'SYSTEM', 'client_forms', 'Document Checklist', 'Standard checklist of documents needed for tax preparation', 1, 'system', 'accountants');

-- HR system docs
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-01', 'SYSTEM', 'employment', 'I-9 Employment Eligibility Verification', 'Federal form verifying identity and work authorization', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-02', 'SYSTEM', 'employment', 'W-4 Employee Withholding Certificate', 'Federal tax withholding form for employees', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-03', 'SYSTEM', 'employment', 'Offer Letter Template', 'Standard employment offer letter template', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-04', 'SYSTEM', 'employment', 'Employee Handbook Acknowledgment', 'Receipt and acknowledgment of employee handbook', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-05', 'SYSTEM', 'employment', 'Direct Deposit Authorization', 'Employee authorization for payroll direct deposit', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-06', 'SYSTEM', 'benefits', 'Benefits Enrollment Form', 'Health, dental, and vision insurance enrollment form', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-07', 'SYSTEM', 'benefits', 'Beneficiary Designation Form', 'Life insurance and retirement beneficiary designation', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-08', 'SYSTEM', 'benefits', 'COBRA Election Notice', 'Notice of COBRA continuation coverage rights', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-09', 'SYSTEM', 'benefits', 'FMLA Request Form', 'Family and Medical Leave Act request form', 1, 'system', 'hr');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-hr-10', 'SYSTEM', 'benefits', 'ADA Accommodation Request', 'Request for reasonable accommodation under the ADA', 1, 'system', 'hr');

-- Other/General system docs
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-gen-01', 'SYSTEM', 'general', 'Non-Disclosure Agreement (NDA)', 'Standard mutual or one-way non-disclosure agreement', 1, 'system', 'other');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-gen-02', 'SYSTEM', 'general', 'Service Agreement Template', 'General service agreement or contract template', 1, 'system', 'other');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-gen-03', 'SYSTEM', 'general', 'Invoice Template', 'Standard invoice template for billing', 1, 'system', 'other');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-gen-04', 'SYSTEM', 'general', 'W-9 Request Form', 'IRS Form W-9 for vendor tax identification', 1, 'system', 'other');
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by, industry)
VALUES ('sys-gen-05', 'SYSTEM', 'general', 'Release of Information', 'Authorization to release confidential information', 1, 'system', 'other');
