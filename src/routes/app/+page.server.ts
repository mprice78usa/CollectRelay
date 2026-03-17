import { getTransactionCounts, getRecentTransactions, getPendingSalesData } from '$lib/server/db/transactions';
import { getRecentAuditEvents } from '$lib/server/db/audit';
import type { TransactionListItem, PendingSaleItem } from '$lib/server/db/transactions';
import type { AuditEventWithTransaction } from '$lib/server/db/audit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mode: return realistic mock data
		const mockTransactions: TransactionListItem[] = [
			{
				id: 'mock-txn-1', workspace_id: 'dev-workspace', template_id: 'mock-tpl-1',
				title: '123 Main St — Buyer Package', description: null,
				transaction_type: 'purchase', status: 'active',
				client_name: 'Sarah Johnson', client_email: 'sarah@example.com', client_phone: '555-0100',
				due_date: '2026-03-15', reminder_enabled: 1, reminder_interval_days: 2,
				created_by: 'dev-user', created_at: '2026-03-01T10:00:00Z', updated_at: '2026-03-05T14:30:00Z',
				sale_price: 450000, commission_rate: 3, commission_amount: 13500,
				completed_at: null, item_count: 5, completed_count: 2
			},
			{
				id: 'mock-txn-2', workspace_id: 'dev-workspace', template_id: 'mock-tpl-2',
				title: '456 Oak Ave — Pre-Approval', description: null,
				transaction_type: 'pre-approval', status: 'in_review',
				client_name: 'Michael Chen', client_email: 'michael@example.com', client_phone: '555-0200',
				due_date: '2026-03-10', reminder_enabled: 1, reminder_interval_days: 3,
				sale_price: 325000, commission_rate: 3, commission_amount: 9750,
				created_by: 'dev-user', created_at: '2026-02-28T09:00:00Z', updated_at: '2026-03-04T16:45:00Z',
				completed_at: null, item_count: 4, completed_count: 3
			},
			{
				id: 'mock-txn-3', workspace_id: 'dev-workspace', template_id: 'mock-tpl-1',
				title: '789 Elm Dr — Refinance Docs', description: null,
				transaction_type: 'refinance', status: 'active',
				client_name: 'Emily Rodriguez', client_email: 'emily@example.com', client_phone: null,
				due_date: '2026-03-20', reminder_enabled: 1, reminder_interval_days: 2,
				sale_price: 580000, commission_rate: 2.5, commission_amount: 14500,
				created_by: 'dev-user', created_at: '2026-03-03T11:00:00Z', updated_at: '2026-03-05T09:15:00Z',
				completed_at: null, item_count: 6, completed_count: 1
			},
			{
				id: 'mock-txn-4', workspace_id: 'dev-workspace', template_id: 'mock-tpl-2',
				title: '321 Pine Rd — Seller Docs', description: null,
				transaction_type: 'seller', status: 'completed',
				client_name: 'David Kim', client_email: 'david@example.com', client_phone: '555-0400',
				due_date: '2026-03-01', reminder_enabled: 0, reminder_interval_days: 2,
				sale_price: 390000, commission_rate: 3, commission_amount: 11700,
				created_by: 'dev-user', created_at: '2026-02-20T08:00:00Z', updated_at: '2026-03-01T12:00:00Z',
				completed_at: '2026-03-01T12:00:00Z', item_count: 3, completed_count: 3
			},
			{
				id: 'mock-txn-5', workspace_id: 'dev-workspace', template_id: 'mock-tpl-1',
				title: '555 Birch Ln — Buyer Package', description: null,
				transaction_type: 'purchase', status: 'active',
				client_name: 'Lisa Park', client_email: 'lisa@example.com', client_phone: '555-0500',
				due_date: '2026-03-25', reminder_enabled: 1, reminder_interval_days: 2,
				sale_price: 275000, commission_rate: 3, commission_amount: 8250,
				created_by: 'dev-user', created_at: '2026-03-04T15:00:00Z', updated_at: '2026-03-05T08:00:00Z',
				completed_at: null, item_count: 5, completed_count: 0
			}
		];

		const now = new Date();
		const mockActivity: AuditEventWithTransaction[] = [
			{
				id: 'ae-1', transaction_id: 'mock-txn-1', checklist_item_id: 'ci-1',
				actor_type: 'client', actor_id: null, actor_name: 'Sarah Johnson',
				action: 'file_uploaded', detail: 'Uploaded "drivers-license.pdf" (245.1 KB)',
				ip_address: null, user_agent: null,
				created_at: new Date(now.getTime() - 12 * 60000).toISOString(),
				transaction_title: '123 Main St — Buyer Package'
			},
			{
				id: 'ae-2', transaction_id: 'mock-txn-2', checklist_item_id: 'ci-2',
				actor_type: 'pro', actor_id: 'dev-user', actor_name: 'Dev User',
				action: 'item_accepted', detail: 'Item accepted',
				ip_address: null, user_agent: null,
				created_at: new Date(now.getTime() - 35 * 60000).toISOString(),
				transaction_title: '456 Oak Ave — Pre-Approval'
			},
			{
				id: 'ae-3', transaction_id: 'mock-txn-3', checklist_item_id: null,
				actor_type: 'pro', actor_id: 'dev-user', actor_name: 'Dev User',
				action: 'magic_link_sent', detail: 'Magic link sent to emily@example.com',
				ip_address: null, user_agent: null,
				created_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
				transaction_title: '789 Elm Dr — Refinance Docs'
			},
			{
				id: 'ae-4', transaction_id: 'mock-txn-1', checklist_item_id: 'ci-3',
				actor_type: 'client', actor_id: null, actor_name: 'Sarah Johnson',
				action: 'answer_submitted', detail: 'Answer submitted for "Confirm mailing address"',
				ip_address: null, user_agent: null,
				created_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
				transaction_title: '123 Main St — Buyer Package'
			},
			{
				id: 'ae-5', transaction_id: 'mock-txn-4', checklist_item_id: null,
				actor_type: 'pro', actor_id: 'dev-user', actor_name: 'Dev User',
				action: 'status_changed', detail: 'Status changed to completed',
				ip_address: null, user_agent: null,
				created_at: new Date(now.getTime() - 8 * 3600000).toISOString(),
				transaction_title: '321 Pine Rd — Seller Docs'
			},
			{
				id: 'ae-6', transaction_id: 'mock-txn-2', checklist_item_id: 'ci-4',
				actor_type: 'client', actor_id: null, actor_name: 'Michael Chen',
				action: 'file_uploaded', detail: 'Uploaded "bank-statement-feb.pdf" (180.0 KB)',
				ip_address: null, user_agent: null,
				created_at: new Date(now.getTime() - 12 * 3600000).toISOString(),
				transaction_title: '456 Oak Ave — Pre-Approval'
			},
			{
				id: 'ae-7', transaction_id: 'mock-txn-2', checklist_item_id: 'ci-5',
				actor_type: 'pro', actor_id: 'dev-user', actor_name: 'Dev User',
				action: 'item_rejected', detail: 'rejected with note: Please upload a clearer copy',
				ip_address: null, user_agent: null,
				created_at: new Date(now.getTime() - 24 * 3600000).toISOString(),
				transaction_title: '456 Oak Ave — Pre-Approval'
			},
			{
				id: 'ae-8', transaction_id: 'mock-txn-5', checklist_item_id: null,
				actor_type: 'pro', actor_id: 'dev-user', actor_name: 'Dev User',
				action: 'magic_link_sent', detail: 'Magic link sent to lisa@example.com',
				ip_address: null, user_agent: null,
				created_at: new Date(now.getTime() - 26 * 3600000).toISOString(),
				transaction_title: '555 Birch Ln — Buyer Package'
			}
		];

		const mockPendingSales: PendingSaleItem[] = [
			{ id: 'mock-txn-1', title: '123 Main St — Buyer Package', client_name: 'Sarah Johnson', status: 'active', sale_price: 450000, commission_amount: 13500, due_date: '2026-03-15', item_count: 5, completed_count: 2, updated_at: '2026-03-05T14:30:00Z' },
			{ id: 'mock-txn-2', title: '456 Oak Ave — Pre-Approval', client_name: 'Michael Chen', status: 'in_review', sale_price: 325000, commission_amount: 9750, due_date: '2026-03-10', item_count: 4, completed_count: 3, updated_at: '2026-03-04T16:45:00Z' },
			{ id: 'mock-txn-3', title: '789 Elm Dr — Refinance Docs', client_name: 'Emily Rodriguez', status: 'active', sale_price: 580000, commission_amount: 14500, due_date: '2026-03-20', item_count: 6, completed_count: 1, updated_at: '2026-03-05T09:15:00Z' },
			{ id: 'mock-txn-5', title: '555 Birch Ln — Buyer Package', client_name: 'Lisa Park', status: 'active', sale_price: 275000, commission_amount: 8250, due_date: '2026-03-25', item_count: 5, completed_count: 0, updated_at: '2026-03-05T08:00:00Z' }
		];

		const mockAssignable = mockTransactions
			.filter(t => ['active', 'in_review', 'draft'].includes(t.status))
			.map(t => ({ id: t.id, title: t.title, client_name: t.client_name }));

		return {
			counts: { active: 3, pending_review: 1, completed: 1, total: 5 },
			recentTransactions: mockTransactions,
			recentActivity: mockActivity,
			pipelineValue: 1630000,
			totalCommission: 46000,
			pendingSales: mockPendingSales,
			mortgageRates: { rate_30yr: 6.65, rate_15yr: 5.89, updated_at: new Date().toISOString() },
			assignableTransactions: mockAssignable
		};
	}

	const [counts, recentTransactions, recentActivity, salesData, ratesRow, assignableResult] = await Promise.all([
		getTransactionCounts(db, workspaceId),
		getRecentTransactions(db, workspaceId, 5),
		getRecentAuditEvents(db, workspaceId, 15),
		getPendingSalesData(db, workspaceId),
		db.prepare("SELECT rate_30yr, rate_15yr, updated_at FROM mortgage_rates WHERE id = 'current-conforming'").first<{ rate_30yr: number; rate_15yr: number; updated_at: string }>(),
		db.prepare("SELECT id, title, client_name FROM transactions WHERE workspace_id = ? AND status IN ('active', 'in_review', 'draft') ORDER BY updated_at DESC").bind(workspaceId).all<{ id: string; title: string; client_name: string }>()
	]);

	return {
		counts,
		recentTransactions,
		recentActivity,
		pipelineValue: salesData.totalPipelineValue,
		totalCommission: salesData.totalCommission,
		pendingSales: salesData.pendingSales,
		mortgageRates: ratesRow || null,
		assignableTransactions: assignableResult.results || []
	};
};
