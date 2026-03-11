import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';
import type { TransactionWithItems, DbChecklistItem } from '$lib/server/db/transactions';
import type { DbMilestone } from '$lib/server/db/milestones';

export const load: PageServerLoad = async ({ parent, platform }) => {
	const { partnerSession } = await parent();
	if (!partnerSession) return { transaction: null, milestones: [] };

	if (dev) {
		// Dev mode mock
		const now = new Date();
		const mockItems: DbChecklistItem[] = [
			{
				id: 'ci-1', transaction_id: 'mock-txn-1', name: 'Government-issued ID',
				description: 'Drivers license or passport', item_type: 'document', required: 1,
				sort_order: 0, status: 'accepted', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: 'dev-user', reviewed_at: '2026-03-02', review_note: null,
				signature_data: null
			},
			{
				id: 'ci-2', transaction_id: 'mock-txn-1', name: 'Proof of income',
				description: null, item_type: 'document', required: 1,
				sort_order: 1, status: 'submitted', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null,
				signature_data: null
			},
			{
				id: 'ci-3', transaction_id: 'mock-txn-1', name: 'Pre-approval letter',
				description: null, item_type: 'document', required: 1,
				sort_order: 2, status: 'pending', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null,
				signature_data: null
			}
		];

		const mockMilestones: DbMilestone[] = [
			{ id: 'ms-1', transaction_id: 'mock-txn-1', milestone_type: 'contract_date', label: 'Contract Date', date: '2026-03-01', completed: 1, sort_order: 0, created_at: '2026-03-01' },
			{ id: 'ms-2', transaction_id: 'mock-txn-1', milestone_type: 'inspection', label: 'Inspection Deadline', date: '2026-03-15', completed: 1, sort_order: 1, created_at: '2026-03-01' },
			{ id: 'ms-3', transaction_id: 'mock-txn-1', milestone_type: 'closing', label: 'Closing', date: '2026-05-01', completed: 0, sort_order: 6, created_at: '2026-03-01' }
		];

		return {
			transaction: {
				id: 'mock-txn-1',
				title: '123 Oak Street Purchase',
				status: 'active',
				client_name: 'Sarah Johnson',
				due_date: '2026-05-01',
				items: mockItems
			} as Partial<TransactionWithItems>,
			milestones: mockMilestones
		};
	}

	const db = platform?.env?.DB;
	if (!db) return { transaction: null, milestones: [] };

	const { getTransactionByIdForClient } = await import('$lib/server/db/transactions');
	const { getMilestonesForTransaction } = await import('$lib/server/db/milestones');

	const [transaction, milestones] = await Promise.all([
		getTransactionByIdForClient(db, partnerSession.transactionId),
		getMilestonesForTransaction(db, partnerSession.transactionId)
	]);

	if (!transaction) return { transaction: null, milestones: [] };

	// Return filtered transaction data (no financials)
	return {
		transaction: {
			id: transaction.id,
			title: transaction.title,
			status: transaction.status,
			client_name: transaction.client_name,
			due_date: transaction.due_date,
			items: transaction.items.map(item => ({
				id: item.id,
				name: item.name,
				description: item.description,
				item_type: item.item_type,
				required: item.required,
				sort_order: item.sort_order,
				status: item.status
			}))
		},
		milestones
	};
};
