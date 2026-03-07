-- Sprint 10: System form templates (lender + agent)
-- These are reference entries only (no PDF files attached).
PRAGMA foreign_keys = OFF;

-- Lender Forms
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-01', 'SYSTEM', 'lender', 'Uniform Residential Loan Application (1003)', 'Standard mortgage application form required by most lenders', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-02', 'SYSTEM', 'lender', 'Loan Estimate (LE)', 'Itemized estimate of loan terms, projected payments, and closing costs', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-03', 'SYSTEM', 'lender', 'Closing Disclosure (CD)', 'Final accounting of all loan terms and closing costs', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-04', 'SYSTEM', 'lender', 'HUD-1 Settlement Statement', 'Detailed listing of all charges in a real estate transaction', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-05', 'SYSTEM', 'lender', 'Truth in Lending Disclosure (TIL)', 'Disclosure of APR, finance charges, and payment schedule', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-06', 'SYSTEM', 'lender', 'Good Faith Estimate (GFE)', 'Estimate of settlement charges for the borrower', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-07', 'SYSTEM', 'lender', 'Rate Lock Agreement', 'Agreement to lock in a specific interest rate for a set period', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-08', 'SYSTEM', 'lender', 'Borrower Authorization Form', 'Authorization for lender to verify employment, assets, and credit', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-09', 'SYSTEM', 'lender', 'IRS Form 4506-T (Tax Transcript Request)', 'Authorization for IRS to release tax transcripts to lender', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-lender-10', 'SYSTEM', 'lender', 'Verification of Employment (VOE)', 'Form to verify borrower employment and income', 1, 'system');

-- Agent Forms
INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-01', 'SYSTEM', 'agent', 'Purchase Agreement / Sales Contract', 'Primary contract between buyer and seller', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-02', 'SYSTEM', 'agent', 'Listing Agreement', 'Contract between property owner and listing agent', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-03', 'SYSTEM', 'agent', 'Seller Disclosure Statement', 'Seller''s disclosure of known property conditions and defects', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-04', 'SYSTEM', 'agent', 'Home Inspection Contingency', 'Addendum allowing buyer to withdraw based on inspection results', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-05', 'SYSTEM', 'agent', 'Buyer Agency Agreement', 'Agreement establishing the buyer-agent relationship', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-06', 'SYSTEM', 'agent', 'Addendum / Amendment Template', 'Standard template for modifying existing contracts', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-07', 'SYSTEM', 'agent', 'Earnest Money Receipt', 'Receipt confirming deposit of earnest money funds', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-08', 'SYSTEM', 'agent', 'Counteroffer Form', 'Form for responding to an offer with modified terms', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-09', 'SYSTEM', 'agent', 'Lead-Based Paint Disclosure', 'Required disclosure for properties built before 1978', 1, 'system');

INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
VALUES ('sys-agent-10', 'SYSTEM', 'agent', 'Agency Disclosure', 'Disclosure of agent representation in the transaction', 1, 'system');
