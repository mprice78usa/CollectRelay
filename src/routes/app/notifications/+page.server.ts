import type { PageServerLoad } from './$types';
import { getNotificationEvents, markNotificationsSeen } from '$lib/server/db/notifications';
import type { NotificationEvent } from '$lib/server/db/notifications';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

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
			}
		];
		return { events: mockEvents };
	}

	// Mark notifications as seen
	await markNotificationsSeen(db, user.id);

	// Load recent events
	const events = await getNotificationEvents(db, user.workspaceId, 50);

	return { events };
};
