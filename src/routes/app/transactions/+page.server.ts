import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getTransactionsForWorkspace, updateTransaction, deleteTransaction } from '$lib/server/db/transactions';
import type { TransactionListItem } from '$lib/server/db/transactions';
import { getUnseenCountsForTransactions } from '$lib/server/db/activity';
import { createAuditEvent } from '$lib/server/db/audit';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;
	const statusFilter = url.searchParams.get('status') || undefined;

	if (!db || !workspaceId) {
		// Dev mode: return mock transactions
		const mockTransactions: TransactionListItem[] = [
			{
				id: 'mock-txn-1',
				workspace_id: 'dev-workspace',
				template_id: 'mock-template-1',
				title: '123 Main St — Buyer Package',
				description: null,
				transaction_type: 'real_estate',
				status: 'active',
				client_name: 'Sarah Johnson',
				client_email: 'sarah@example.com',
				client_phone: null,
				due_date: '2026-03-15',
				reminder_enabled: 1,
				reminder_interval_days: 2,
				created_by: 'dev-user',
				created_at: '2026-03-01T10:00:00Z',
				updated_at: '2026-03-01T10:00:00Z',
				completed_at: null,
				item_count: 7,
				completed_count: 3
			},
			{
				id: 'mock-txn-2',
				workspace_id: 'dev-workspace',
				template_id: 'mock-template-2',
				title: '456 Oak Ave — Seller Docs',
				description: null,
				transaction_type: 'real_estate',
				status: 'in_review',
				client_name: 'Mike Chen',
				client_email: 'mike@example.com',
				client_phone: '555-0102',
				due_date: '2026-03-10',
				reminder_enabled: 1,
				reminder_interval_days: 2,
				created_by: 'dev-user',
				created_at: '2026-02-25T14:00:00Z',
				updated_at: '2026-03-03T09:00:00Z',
				completed_at: null,
				item_count: 5,
				completed_count: 5
			},
			{
				id: 'mock-txn-3',
				workspace_id: 'dev-workspace',
				template_id: 'mock-template-1',
				title: '789 Pine Rd — Pre-Approval',
				description: null,
				transaction_type: 'real_estate',
				status: 'completed',
				client_name: 'Lisa Park',
				client_email: 'lisa@example.com',
				client_phone: null,
				due_date: null,
				reminder_enabled: 1,
				reminder_interval_days: 2,
				created_by: 'dev-user',
				created_at: '2026-02-15T08:00:00Z',
				updated_at: '2026-02-28T16:00:00Z',
				completed_at: '2026-02-28T16:00:00Z',
				item_count: 4,
				completed_count: 4
			},
			{
				id: 'mock-txn-4',
				workspace_id: 'dev-workspace',
				template_id: 'mock-template-1',
				title: '321 Elm St — Cancelled Deal',
				description: null,
				transaction_type: 'real_estate',
				status: 'cancelled',
				client_name: 'Tom Wilson',
				client_email: 'tom@example.com',
				client_phone: null,
				due_date: null,
				reminder_enabled: 0,
				reminder_interval_days: 2,
				created_by: 'dev-user',
				created_at: '2026-02-10T08:00:00Z',
				updated_at: '2026-02-20T12:00:00Z',
				completed_at: null,
				item_count: 3,
				completed_count: 1
			}
		];

		const filtered = statusFilter
			? mockTransactions.filter((t) => t.status === statusFilter)
			: mockTransactions.filter((t) => t.status !== 'cancelled');

		return { transactions: filtered, statusFilter: statusFilter || 'all', unseenCounts: {} as Record<string, number> };
	}

	const transactions = await getTransactionsForWorkspace(db, workspaceId, {
		status: statusFilter,
		excludeStatus: statusFilter ? undefined : 'cancelled'
	});

	// Get unseen activity counts for all transactions
	const userId = locals.user!.id;
	const txnIds = transactions.map((t) => t.id);
	const unseenMap = await getUnseenCountsForTransactions(db, txnIds, 'pro', userId);
	const unseenCounts: Record<string, number> = {};
	for (const [id, count] of unseenMap) {
		unseenCounts[id] = count;
	}

	return { transactions, statusFilter: statusFilter || 'all', unseenCounts };
};

export const actions: Actions = {
	revive: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const transactionId = formData.get('transactionId') as string;
		if (!transactionId) return fail(400, { error: 'Transaction ID required' });

		await updateTransaction(db, transactionId, user.workspaceId, { status: 'active' });

		await createAuditEvent(db, {
			transactionId,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'status_changed',
			detail: 'Transaction revived — status changed to active'
		});

		return { success: true };
	},

	delete: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const transactionId = formData.get('transactionId') as string;
		if (!transactionId) return fail(400, { error: 'Transaction ID required' });

		const deleted = await deleteTransaction(db, transactionId, user.workspaceId);
		if (!deleted) {
			return fail(400, { error: 'Only cancelled transactions can be permanently deleted' });
		}

		return { success: true };
	}
};
