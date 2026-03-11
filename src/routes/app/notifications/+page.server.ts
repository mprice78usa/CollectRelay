import type { PageServerLoad } from './$types';
import { getNotificationEvents, markNotificationsSeen } from '$lib/server/db/notifications';
import type { NotificationEvent } from '$lib/server/db/notifications';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	// Read optional filter from query params
	const transactionFilter = url.searchParams.get('transaction') || '';

	if (!db || !user?.workspaceId) {
		// Dev mode mock data
		const now = new Date();
		const mockEvents: NotificationEvent[] = [
			{
				id: '1', transaction_id: 'mock-txn-1', transaction_title: '123 Oak Street Purchase',
				actor_type: 'client', actor_name: 'Sarah Johnson',
				action: 'file_uploaded', detail: 'Uploaded "drivers_license.pdf" for Government-issued ID',
				created_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString()
			},
			{
				id: '2', transaction_id: 'mock-txn-1', transaction_title: '123 Oak Street Purchase',
				actor_type: 'client', actor_name: 'Sarah Johnson',
				action: 'item_submitted', detail: 'Submitted answer for "Confirm mailing address"',
				created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString()
			},
			{
				id: '3', transaction_id: 'mock-txn-2', transaction_title: '456 Maple Ave Refinance',
				actor_type: 'client', actor_name: 'Mike Chen',
				action: 'file_uploaded', detail: 'Uploaded "pay_stub_march.pdf" for Proof of income',
				created_at: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString()
			},
			{
				id: '4', transaction_id: 'mock-txn-1', transaction_title: '123 Oak Street Purchase',
				actor_type: 'pro', actor_name: 'Dev User',
				action: 'item_reviewed', detail: 'Accepted "Government-issued ID"',
				created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
			},
			{
				id: '5', transaction_id: 'mock-txn-3', transaction_title: '789 Pine Rd Listing',
				actor_type: 'client', actor_name: 'Emma Davis',
				action: 'comment_added', detail: 'Left a comment on "Property disclosure form"',
				created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
			},
			{
				id: '6', transaction_id: 'mock-txn-2', transaction_title: '456 Maple Ave Refinance',
				actor_type: 'pro', actor_name: 'Dev User',
				action: 'status_changed', detail: 'Transaction status changed to in_review',
				created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
			},
			{
				id: '7', transaction_id: 'mock-txn-1', transaction_title: '123 Oak Street Purchase',
				actor_type: 'client', actor_name: 'Sarah Johnson',
				action: 'comment_added', detail: 'Left a comment on "Bank statements (last 2 months)"',
				created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString()
			},
			{
				id: '8', transaction_id: 'mock-txn-3', transaction_title: '789 Pine Rd Listing',
				actor_type: 'pro', actor_name: 'Dev User',
				action: 'magic_link_sent', detail: 'Sent collection link to emma@example.com',
				created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
			}
		];

		// Build unique transactions list for filter dropdown
		const txnMap = new Map<string, string>();
		for (const e of mockEvents) {
			txnMap.set(e.transaction_id, e.transaction_title);
		}
		const transactions = Array.from(txnMap, ([id, title]) => ({ id, title }));

		// Apply transaction filter for dev mode
		const filtered = transactionFilter
			? mockEvents.filter(e => e.transaction_id === transactionFilter)
			: mockEvents;

		return { events: filtered, transactions, transactionFilter };
	}

	// Mark notifications as seen
	await markNotificationsSeen(db, user.id);

	// Load workspace transactions for filter dropdown
	const txnResult = await db
		.prepare(
			`SELECT id, title FROM transactions
			 WHERE workspace_id = ?
			 ORDER BY updated_at DESC
			 LIMIT 100`
		)
		.bind(user.workspaceId)
		.all<{ id: string; title: string }>();
	const transactions = txnResult.results;

	// Load events (with optional transaction filter)
	let events: NotificationEvent[];
	if (transactionFilter) {
		events = await getNotificationEventsForTransaction(db, user.workspaceId, transactionFilter, 100);
	} else {
		events = await getNotificationEvents(db, user.workspaceId, 100);
	}

	return { events, transactions, transactionFilter };
};

/** Get notification events filtered by a specific transaction */
async function getNotificationEventsForTransaction(
	db: D1Database,
	workspaceId: string,
	transactionId: string,
	limit = 100
): Promise<NotificationEvent[]> {
	const result = await db
		.prepare(
			`SELECT ae.id, ae.transaction_id, t.title as transaction_title,
				ae.actor_type, ae.actor_name, ae.action, ae.detail, ae.created_at
			 FROM audit_events ae
			 JOIN transactions t ON ae.transaction_id = t.id
			 WHERE t.workspace_id = ? AND ae.transaction_id = ?
			 ORDER BY ae.created_at DESC
			 LIMIT ?`
		)
		.bind(workspaceId, transactionId, limit)
		.all<NotificationEvent>();
	return result.results;
}
