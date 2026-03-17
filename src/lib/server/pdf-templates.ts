/** Fillable PDF template definitions for Document Center */

export interface TemplateField {
	name: string;
	label: string;
	type: 'text' | 'textarea' | 'date';
	default?: string;
	section: 'pro' | 'client' | 'body';
}

export interface TemplateDefinition {
	title: string;
	fields: TemplateField[];
	bodyTemplate: string;
}

/** Map of system doc IDs → template definitions. Only these docs get a "Generate" button. */
export const TEMPLATE_DEFINITIONS: Record<string, TemplateDefinition> = {
	// ── Real Estate ──────────────────────────────────────────
	'sys-agent-01': {
		title: 'Purchase Agreement',
		fields: [
			{ name: 'proName', label: 'Agent Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Agent Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Agent Phone', type: 'text', section: 'pro' },
			{ name: 'buyerName', label: 'Buyer Name', type: 'text', section: 'client' },
			{ name: 'sellerName', label: 'Seller Name', type: 'text', section: 'client' },
			{ name: 'propertyAddress', label: 'Property Address', type: 'text', section: 'client' },
			{ name: 'purchasePrice', label: 'Purchase Price', type: 'text', section: 'client' },
			{ name: 'closingDate', label: 'Closing Date', type: 'date', section: 'client' },
			{ name: 'bodyText', label: 'Agreement Terms', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `This Purchase Agreement ("Agreement") is entered into as of the date set forth below by and between the Buyer and Seller identified herein.

1. PROPERTY: The Seller agrees to sell and the Buyer agrees to purchase the property located at the address specified above.

2. PURCHASE PRICE: The total purchase price shall be as stated above, payable at closing.

3. EARNEST MONEY: Buyer shall deposit earnest money in the amount of $_________ within _____ business days of the execution of this Agreement.

4. FINANCING: This Agreement is contingent upon Buyer obtaining financing approval within _____ days of the execution date.

5. INSPECTIONS: Buyer shall have _____ days from execution to conduct inspections at Buyer's expense.

6. CLOSING: Closing shall take place on the date specified above, or at such other time as mutually agreed upon by the parties.

7. POSSESSION: Possession shall be delivered to Buyer at closing unless otherwise agreed in writing.

This Agreement, including any addenda, constitutes the entire agreement between the parties.`,
	},

	'sys-agent-03': {
		title: 'Seller Disclosure Statement',
		fields: [
			{ name: 'proName', label: 'Agent Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Agent Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Agent Phone', type: 'text', section: 'pro' },
			{ name: 'sellerName', label: 'Seller Name', type: 'text', section: 'client' },
			{ name: 'propertyAddress', label: 'Property Address', type: 'text', section: 'client' },
			{ name: 'bodyText', label: 'Disclosure Details', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `The Seller makes the following disclosures regarding the condition of the property located at the address specified above.

STRUCTURAL: [ ] Known issues  [ ] No known issues
Description: _______________________________________________

ROOF: [ ] Known issues  [ ] No known issues
Age of roof: ______  Last repaired: ______
Description: _______________________________________________

PLUMBING: [ ] Known issues  [ ] No known issues
Description: _______________________________________________

ELECTRICAL: [ ] Known issues  [ ] No known issues
Description: _______________________________________________

HVAC: [ ] Known issues  [ ] No known issues
Age of system: ______  Last serviced: ______

WATER DAMAGE/MOLD: [ ] Known issues  [ ] No known issues
Description: _______________________________________________

PEST/TERMITE: [ ] Known issues  [ ] No known issues
Last inspection date: ______

ENVIRONMENTAL: [ ] Known issues  [ ] No known issues
(Lead paint, asbestos, radon, underground tanks)

Seller certifies that the above information is true and accurate to the best of their knowledge.`,
	},

	'sys-agent-05': {
		title: 'Buyer Agency Agreement',
		fields: [
			{ name: 'proName', label: 'Agent Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Agent Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Agent Phone', type: 'text', section: 'pro' },
			{ name: 'buyerName', label: 'Buyer Name', type: 'text', section: 'client' },
			{ name: 'buyerAddress', label: 'Buyer Address', type: 'text', section: 'client' },
			{ name: 'startDate', label: 'Agreement Start Date', type: 'date', section: 'client' },
			{ name: 'endDate', label: 'Agreement End Date', type: 'date', section: 'client' },
			{ name: 'bodyText', label: 'Agreement Terms', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `This Buyer Agency Agreement ("Agreement") is entered into between the Buyer and Agent identified above.

1. APPOINTMENT: Buyer hereby appoints Agent as exclusive buyer's agent for the purpose of locating and negotiating the purchase of real property.

2. TERM: This Agreement shall be effective from the start date through the end date specified above.

3. AGENT DUTIES: Agent agrees to act in the Buyer's best interest, including but not limited to: locating suitable properties, arranging showings, preparing offers, and negotiating terms.

4. BUYER DUTIES: Buyer agrees to work exclusively with Agent during the term of this Agreement and to communicate all property inquiries through Agent.

5. COMPENSATION: Agent's compensation shall be ___% of the purchase price, to be paid at closing from the transaction proceeds.

6. TERMINATION: Either party may terminate this Agreement with _____ days written notice.`,
	},

	// ── Contractors ──────────────────────────────────────────
	'sys-ctr-03': {
		title: 'Subcontractor Agreement',
		fields: [
			{ name: 'proName', label: 'Contractor Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Contractor Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Contractor Phone', type: 'text', section: 'pro' },
			{ name: 'subName', label: 'Subcontractor Name', type: 'text', section: 'client' },
			{ name: 'subAddress', label: 'Subcontractor Address', type: 'text', section: 'client' },
			{ name: 'projectName', label: 'Project Name', type: 'text', section: 'client' },
			{ name: 'projectAddress', label: 'Project Address', type: 'text', section: 'client' },
			{ name: 'startDate', label: 'Start Date', type: 'date', section: 'client' },
			{ name: 'bodyText', label: 'Scope of Work & Terms', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `This Subcontractor Agreement ("Agreement") is entered into between the Contractor and Subcontractor identified above.

1. SCOPE OF WORK: Subcontractor shall perform the following work on the project specified above:
_______________________________________________

2. COMPENSATION: Subcontractor shall be compensated as follows:
   Total Contract Amount: $__________
   Payment Schedule: _________________

3. TIMELINE: Work shall commence on the start date above and be substantially complete by __________.

4. INSURANCE: Subcontractor shall maintain general liability insurance with minimum coverage of $__________ and workers' compensation as required by law.

5. MATERIALS: [ ] Subcontractor provides materials  [ ] Contractor provides materials

6. CHANGE ORDERS: Any changes to the scope of work must be agreed upon in writing by both parties.

7. LIEN WAIVERS: Subcontractor shall provide lien waivers with each payment application.

8. INDEMNIFICATION: Subcontractor shall indemnify and hold harmless Contractor from claims arising from Subcontractor's work.`,
	},

	'sys-ctr-04': {
		title: 'Change Order Form',
		fields: [
			{ name: 'proName', label: 'Contractor Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Contractor Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Contractor Phone', type: 'text', section: 'pro' },
			{ name: 'clientName', label: 'Owner/Client Name', type: 'text', section: 'client' },
			{ name: 'projectName', label: 'Project Name', type: 'text', section: 'client' },
			{ name: 'changeOrderNumber', label: 'Change Order #', type: 'text', section: 'client' },
			{ name: 'bodyText', label: 'Description of Changes', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `CHANGE ORDER

Original Contract Amount: $__________
Previous Change Orders Total: $__________
This Change Order Amount: $__________
New Contract Total: $__________

DESCRIPTION OF CHANGES:
_______________________________________________

REASON FOR CHANGE:
[ ] Owner requested  [ ] Unforeseen conditions  [ ] Design change  [ ] Code requirement  [ ] Other

IMPACT ON SCHEDULE:
[ ] No impact  [ ] Extension of _____ days required

The above change order is hereby approved by both parties. Work shall proceed upon signed approval.`,
	},

	'sys-ctr-05': {
		title: 'Notice to Proceed',
		fields: [
			{ name: 'proName', label: 'Contractor Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Contractor Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Contractor Phone', type: 'text', section: 'pro' },
			{ name: 'clientName', label: 'Owner/Client Name', type: 'text', section: 'client' },
			{ name: 'projectName', label: 'Project Name', type: 'text', section: 'client' },
			{ name: 'projectAddress', label: 'Project Address', type: 'text', section: 'client' },
			{ name: 'proceedDate', label: 'Proceed Date', type: 'date', section: 'client' },
			{ name: 'bodyText', label: 'Additional Terms', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `NOTICE TO PROCEED

You are hereby authorized and directed to proceed with the work described in the contract for the project identified above.

Contract Date: __________
Contract Amount: $__________
Commencement Date: As specified above
Substantial Completion Date: __________
Final Completion Date: __________

Calendar days allowed for completion: _____ days

All terms and conditions of the original contract remain in full force and effect.`,
	},

	// ── Other / General ──────────────────────────────────────
	'sys-gen-01': {
		title: 'Non-Disclosure Agreement',
		fields: [
			{ name: 'proName', label: 'Your Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Your Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Your Phone', type: 'text', section: 'pro' },
			{ name: 'recipientName', label: 'Recipient Name', type: 'text', section: 'client' },
			{ name: 'recipientAddress', label: 'Recipient Address', type: 'text', section: 'client' },
			{ name: 'effectiveDate', label: 'Effective Date', type: 'date', section: 'client' },
			{ name: 'bodyText', label: 'NDA Terms', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of the effective date specified above.

1. DEFINITION OF CONFIDENTIAL INFORMATION: "Confidential Information" means any non-public information disclosed by either party, including but not limited to business plans, financial data, customer lists, technical specifications, trade secrets, and proprietary processes.

2. OBLIGATIONS: The receiving party agrees to:
   a. Hold all Confidential Information in strict confidence
   b. Not disclose Confidential Information to any third party without prior written consent
   c. Use Confidential Information solely for the purpose of evaluating the potential business relationship
   d. Protect Confidential Information with at least the same degree of care used for its own confidential information

3. EXCLUSIONS: This Agreement does not apply to information that:
   a. Is or becomes publicly available through no fault of the receiving party
   b. Was known to the receiving party prior to disclosure
   c. Is independently developed without use of Confidential Information
   d. Is required to be disclosed by law or court order

4. TERM: This Agreement shall remain in effect for _____ years from the effective date.

5. RETURN OF MATERIALS: Upon request, the receiving party shall return or destroy all Confidential Information.`,
	},

	'sys-gen-02': {
		title: 'Service Agreement',
		fields: [
			{ name: 'proName', label: 'Provider Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Provider Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Provider Phone', type: 'text', section: 'pro' },
			{ name: 'clientName', label: 'Client Name', type: 'text', section: 'client' },
			{ name: 'clientAddress', label: 'Client Address', type: 'text', section: 'client' },
			{ name: 'startDate', label: 'Start Date', type: 'date', section: 'client' },
			{ name: 'bodyText', label: 'Service Terms', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into between the Provider and Client identified above.

1. SERVICES: Provider agrees to perform the following services:
_______________________________________________

2. COMPENSATION:
   Total Fee: $__________
   Payment Schedule: __________
   Payment Terms: Net _____ days

3. TERM: This Agreement begins on the start date above and continues for _____ months unless terminated by either party with _____ days written notice.

4. INDEPENDENT CONTRACTOR: Provider is an independent contractor and not an employee of Client.

5. INTELLECTUAL PROPERTY: Work product created under this Agreement shall be owned by [ ] Provider  [ ] Client upon full payment.

6. LIABILITY: Provider's total liability shall not exceed the total fees paid under this Agreement.

7. CONFIDENTIALITY: Both parties agree to maintain the confidentiality of proprietary information exchanged during the engagement.

8. TERMINATION: Either party may terminate this Agreement with _____ days written notice. Client shall pay for all services rendered through the termination date.`,
	},

	'sys-gen-03': {
		title: 'Invoice',
		fields: [
			{ name: 'proName', label: 'Your Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Your Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Your Phone', type: 'text', section: 'pro' },
			{ name: 'clientName', label: 'Bill To (Name)', type: 'text', section: 'client' },
			{ name: 'clientAddress', label: 'Bill To (Address)', type: 'text', section: 'client' },
			{ name: 'invoiceNumber', label: 'Invoice #', type: 'text', section: 'client' },
			{ name: 'invoiceDate', label: 'Invoice Date', type: 'date', section: 'client' },
			{ name: 'bodyText', label: 'Line Items & Notes', type: 'textarea', section: 'body' },
		],
		bodyTemplate: `ITEM DESCRIPTION                    QTY    RATE      AMOUNT
────────────────────────────────────────────────────────────




────────────────────────────────────────────────────────────
                                         Subtotal: $______
                                         Tax:      $______
                                         TOTAL:    $______

PAYMENT TERMS: Due within _____ days of invoice date.

PAYMENT METHODS:
- Check payable to: ___________________________
- Bank transfer: Contact for wire instructions
- Online payment: ___________________________

NOTES:
_______________________________________________

Thank you for your business.`,
	},
};

/** Set of doc IDs that have fillable templates */
export const TEMPLATE_DOC_IDS = new Set(Object.keys(TEMPLATE_DEFINITIONS));
