/**
 * Industry-aware UI terminology mapping.
 * DB tables/routes stay as "transactions"/"checklist_items" — only user-facing labels change.
 */

export interface Terms {
	transaction: string;
	transactions: string;
	item: string;
	items: string;
	checklistItems: string;
	request: string;
	requests: string;
	newTransaction: string;
	backToList: string;
	trackSubtitle: string;
	itemsProgress: string;
}

const TERMS: Record<string, Terms> = {
	contractors: {
		transaction: 'Project',
		transactions: 'Projects',
		item: 'Task',
		items: 'Tasks',
		checklistItems: 'Project Tasks',
		request: 'Submittal',
		requests: 'Submittals',
		newTransaction: 'New Project',
		backToList: 'Back to Projects',
		trackSubtitle: 'Track all your submittals and project tasks.',
		itemsProgress: 'tasks',
	},
	real_estate: {
		transaction: 'Transaction',
		transactions: 'Transactions',
		item: 'Item',
		items: 'Items',
		checklistItems: 'Checklist Items',
		request: 'Request',
		requests: 'Requests',
		newTransaction: 'New Transaction',
		backToList: 'Back to Transactions',
		trackSubtitle: 'Track all your document collection requests.',
		itemsProgress: 'items',
	},
};

export function getTerms(industry?: string | null): Terms {
	if (industry && TERMS[industry]) return TERMS[industry];
	return TERMS.real_estate;
}
