-- Add external_url column for linking to official government form downloads
ALTER TABLE document_library ADD COLUMN external_url TEXT;

-- Accountants: IRS forms
UPDATE document_library SET external_url = 'https://www.irs.gov/pub/irs-pdf/f1040.pdf' WHERE id = 'sys-acc-01';
UPDATE document_library SET external_url = 'https://www.irs.gov/pub/irs-pdf/f1120.pdf' WHERE id = 'sys-acc-02';
UPDATE document_library SET external_url = 'https://www.irs.gov/pub/irs-pdf/f1065.pdf' WHERE id = 'sys-acc-03';
UPDATE document_library SET external_url = 'https://www.irs.gov/pub/irs-pdf/fw9.pdf' WHERE id = 'sys-acc-04';
UPDATE document_library SET external_url = 'https://www.irs.gov/pub/irs-pdf/f4506t.pdf' WHERE id = 'sys-acc-05';
UPDATE document_library SET external_url = 'https://www.irs.gov/pub/irs-pdf/f2848.pdf' WHERE id = 'sys-acc-07';

-- HR: Federal employment forms
UPDATE document_library SET external_url = 'https://www.uscis.gov/sites/default/files/document/forms/i-9-paper-version.pdf' WHERE id = 'sys-hr-01';
UPDATE document_library SET external_url = 'https://www.irs.gov/pub/irs-pdf/fw4.pdf' WHERE id = 'sys-hr-02';

-- Other/General: W-9
UPDATE document_library SET external_url = 'https://www.irs.gov/pub/irs-pdf/fw9.pdf' WHERE id = 'sys-gen-04';
