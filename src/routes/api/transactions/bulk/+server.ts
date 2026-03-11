import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactionsByIds, bulkUpdateTransactionStatus, deleteTransaction } from '$lib/server/db/transactions';
import { createAuditEvent } from '$lib/server/db/audit';

const MAX_BATCH_SIZE = 50;
const VALID_ACTIONS = ['remind', 'mark_in_review', 'mark_complete', 'cancel', 'revive', 'delete'] as const;
type BulkAction = typeof VALID_ACTIONS[number];

// Which source statuses are valid for each action
const ACTION_VALID_STATUSES: Record<BulkAction, string[]> = {
	remind: ['active'],
	mark_in_review: ['active'],
	mark_complete: ['in_review'],
	cancel: ['active', 'in_review'],
	revive: ['cancelled'],
	delete: ['cancelled']
};

// Target status for status-change actions
const ACTION_TARGET_STATUS: Partial<Record<BulkAction, string>> = {
	mark_in_review: 'in_review',
	mark_complete: 'completed',
	cancel: 'cancelled',
	revive: 'active'
};

export const POST: RequestHandler = async ({ request, locals, platform, url }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) {
		// Dev mode: return mock success
		return json({ success: true, processed: 0, skipped: 0 });
	}

	const body = await request.json();
	const { action, transactionIds } = body as { action: string; transactionIds: string[] };

	if (!action || !VALID_ACTIONS.includes(action as BulkAction)) {
		throw error(400, 'Invalid action');
	}

	if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
		throw error(400, 'No transactions selected');
	}

	if (transactionIds.length > MAX_BATCH_SIZE) {
		throw error(400, `Maximum ${MAX_BATCH_SIZE} transactions per batch`);
	}

	const bulkAction = action as BulkAction;
	const validStatuses = ACTION_VALID_STATUSES[bulkAction];

	// Fetch all transactions and verify ownership
	const transactions = await getTransactionsByIds(db, transactionIds, user.workspaceId);

	// Filter to only those with valid source status
	const eligible = transactions.filter(t => validStatuses.includes(t.status));
	const skipped = transactions.length - eligible.length;

	if (eligible.length === 0) {
		return json({ success: true, processed: 0, skipped: transactions.length });
	}

	let processed = 0;

	if (bulkAction === 'remind') {
		// Send reminders — parallel email sends
		const { generateMagicLink } = await import('$lib/server/magic-links');
		const { sendReminderEmail } = await import('$lib/server/email');
		const { sendReminderSms } = await import('$lib/server/sms');

		const appUrl = platform?.env?.APP_URL || url.origin;

		const results = await Promise.allSettled(
			eligible.map(async (txn) => {
				const token = await generateMagicLink(platform!.env, {
					transactionId: txn.id,
					clientEmail: txn.client_email,
					clientName: txn.client_name
				});
				const magicLinkUrl = `${appUrl}/c/${token}`;

				await sendReminderEmail(platform!.env, {
					to: txn.client_email,
					clientName: txn.client_name,
					proName: user.name,
					transactionTitle: txn.title,
					magicLinkUrl
				});

				// SMS if enabled
				if (txn.client_phone && txn.sms_enabled) {
					await sendReminderSms(platform!.env, {
						to: txn.client_phone,
						proName: user.name,
						transactionTitle: txn.title,
						magicLinkUrl
					});
				}

				// Update last_reminder_at
				await db.prepare("UPDATE transactions SET last_reminder_at = datetime('now') WHERE id = ?")
					.bind(txn.id).run();

				await createAuditEvent(db, {
					transactionId: txn.id,
					actorType: 'pro',
					actorId: user.id,
					actorName: user.name,
					action: 'reminder_sent',
					detail: `Bulk reminder sent to ${txn.client_email}`
				}, platform?.env ? { env: platform.env, workspaceId: user.workspaceId, context: platform.context } : undefined);
			})
		);

		processed = results.filter(r => r.status === 'fulfilled').length;
	} else if (bulkAction === 'delete') {
		// Delete cancelled transactions one by one (cascading deletes)
		const results = await Promise.allSettled(
			eligible.map(async (txn) => {
				await deleteTransaction(db, txn.id, user.workspaceId);
			})
		);
		processed = results.filter(r => r.status === 'fulfilled').length;
	} else {
		// Status change actions
		const targetStatus = ACTION_TARGET_STATUS[bulkAction]!;
		const eligibleIds = eligible.map(t => t.id);

		processed = await bulkUpdateTransactionStatus(db, eligibleIds, user.workspaceId, targetStatus);

		// Create audit events for each
		const auditPromises = eligible.map(txn =>
			createAuditEvent(db, {
				transactionId: txn.id,
				actorType: 'pro',
				actorId: user.id,
				actorName: user.name,
				action: 'status_changed',
				detail: `Bulk action: status changed to ${targetStatus}`
			}, platform?.env ? { env: platform.env, workspaceId: user.workspaceId, context: platform.context } : undefined)
		);
		await Promise.allSettled(auditPromises);
	}

	return json({ success: true, processed, skipped });
};
