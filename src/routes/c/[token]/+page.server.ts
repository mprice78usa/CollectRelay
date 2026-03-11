import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getTransactionByIdForClient, updateChecklistItemAnswer, getTransactionWithCreatorEmail } from '$lib/server/db/transactions';
import { createAuditEvent } from '$lib/server/db/audit';
import { recordItemActivity, markTransactionSeen, getItemActivityMap, getLastSeen } from '$lib/server/db/activity';
import type { TransactionWithItems, DbChecklistItem } from '$lib/server/db/transactions';
import { getFilesForTransaction } from '$lib/server/db/files';
import type { DbFile } from '$lib/server/db/files';
import { getCommentsForTransaction, addComment } from '$lib/server/db/comments';
import type { DbComment } from '$lib/server/db/comments';
import { sanitizeTextInput } from '$lib/server/sanitize';
import { sendSubmissionNotification, sendCommentNotification } from '$lib/server/email';
import { getNotificationPrefs } from '$lib/server/db/users';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const session = locals.clientSession;
	if (!session) return { transaction: null, files: [], comments: [] };

	const db = platform?.env?.DB;

	if (!db || dev) {
		// Dev mode: return mock client-facing transaction
		const mockItems: DbChecklistItem[] = [
			{
				id: 'mock-ci-1', transaction_id: session.transactionId, name: 'Government-issued ID',
				description: 'Drivers license or passport', item_type: 'document', required: 1,
				sort_order: 0, status: 'accepted', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
			},
			{
				id: 'mock-ci-2', transaction_id: session.transactionId, name: 'Proof of income',
				description: 'Recent pay stubs or tax return', item_type: 'document', required: 1,
				sort_order: 1, status: 'rejected', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: 'Please upload a more recent pay stub (last 30 days).', signature_data: null
			},
			{
				id: 'mock-ci-3', transaction_id: session.transactionId, name: 'Confirm mailing address',
				description: 'Your current mailing address', item_type: 'question', required: 1,
				sort_order: 2, status: 'pending', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
},
			{
				id: 'mock-ci-4', transaction_id: session.transactionId, name: 'Pre-approval letter',
				description: 'From your lender', item_type: 'document', required: 1,
				sort_order: 3, status: 'pending', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
},
			{
				id: 'mock-ci-5', transaction_id: session.transactionId, name: 'Agree to disclosure terms',
				description: 'Acknowledge receipt of disclosure documents', item_type: 'checkbox', required: 1,
				sort_order: 4, status: 'pending', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
},
			{
				id: 'mock-ci-6', transaction_id: session.transactionId, name: 'Buyer signature',
				description: 'Sign to acknowledge the purchase agreement', item_type: 'signature', required: 1,
				sort_order: 5, status: 'pending', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
}
		];

		const mockTransaction: TransactionWithItems = {
			id: session.transactionId,
			workspace_id: 'dev-workspace',
			template_id: 'mock-tpl-1',
			title: '123 Main St — Buyer Package',
			description: null,
			transaction_type: 'real_estate',
			status: 'active',
			client_name: session.clientName,
			client_email: session.clientEmail,
			client_phone: null,
			due_date: '2026-03-15',
			reminder_enabled: 1,
			reminder_interval_days: 2,
			created_by: 'dev-user',
			created_at: '2026-03-01T10:00:00Z',
			updated_at: '2026-03-01T10:00:00Z',
			completed_at: null,
			items: mockItems
		};

		const now = new Date();
		const mockComments: DbComment[] = [
			{
				id: 'mc-1', transaction_id: session.transactionId, checklist_item_id: 'mock-ci-2',
				author_type: 'pro', author_id: 'dev-user', author_name: 'Dev User',
				content: 'Hi Sarah, can you upload a more recent pay stub? The one submitted is from 2 months ago.',
				created_at: new Date(now.getTime() - 3 * 3600000).toISOString()
			},
			{
				id: 'mc-2', transaction_id: session.transactionId, checklist_item_id: 'mock-ci-2',
				author_type: 'client', author_id: null, author_name: 'Sarah Johnson',
				content: 'Sure! I just got my latest one, uploading now.',
				created_at: new Date(now.getTime() - 2 * 3600000).toISOString()
			}
		];

		return { transaction: mockTransaction, files: [] as DbFile[], comments: mockComments, itemActivity: [] as any[], lastSeenAt: null as string | null };
	}

	const transaction = await getTransactionByIdForClient(db, session.transactionId);
	if (!transaction) return { transaction: null, files: [], comments: [], itemActivity: [], lastSeenAt: null };

	const [files, comments, itemActivity, lastSeenAt] = await Promise.all([
		getFilesForTransaction(db, session.transactionId),
		getCommentsForTransaction(db, session.transactionId),
		getItemActivityMap(db, session.transactionId),
		getLastSeen(db, session.transactionId, 'client', session.clientEmail)
	]);

	// Mark as seen (non-blocking)
	markTransactionSeen(db, session.transactionId, 'client', session.clientEmail).catch(() => {});

	return { transaction, files, comments, itemActivity, lastSeenAt };
};

export const actions: Actions = {
	submitAnswer: async ({ request, locals, platform, url }) => {
		const db = platform?.env?.DB;
		if (!db || !locals.clientSession) return fail(400, { error: 'Session invalid' });

		const formData = await request.formData();
		const itemId = formData.get('itemId') as string;
		const rawAnswer = formData.get('answer') as string;

		if (!itemId || !rawAnswer) {
			return fail(400, { error: 'Answer is required' });
		}

		const answer = sanitizeTextInput(rawAnswer);
		await updateChecklistItemAnswer(db, itemId, answer);

		// Get workspace for webhook dispatch
		const txnWs = await db
			.prepare('SELECT workspace_id FROM transactions WHERE id = ?')
			.bind(locals.clientSession.transactionId)
			.first<{ workspace_id: string }>();

		await createAuditEvent(db, {
			transactionId: locals.clientSession.transactionId,
			checklistItemId: itemId,
			actorType: 'client',
			actorName: locals.clientSession.clientName,
			action: 'answer_submitted',
			detail: answer.length > 100 ? answer.slice(0, 100) + '…' : answer
		}, txnWs && platform?.env ? { env: platform.env, workspaceId: txnWs.workspace_id, context: platform.context } : undefined);

		// Record activity for notification dots
		await recordItemActivity(db, itemId, locals.clientSession.transactionId, 'answer_submitted', 'client', locals.clientSession.clientName);

		// Notify pro when client submits an answer (non-blocking)
		if (platform?.env) {
			try {
				const txnInfo = await getTransactionWithCreatorEmail(db, locals.clientSession.transactionId);
				const item = await db
					.prepare('SELECT name FROM checklist_items WHERE id = ?')
					.bind(itemId)
					.first<{ name: string }>();
				if (txnInfo && item) {
					const prefs = await getNotificationPrefs(db, txnInfo.creatorId);
					if (!prefs || prefs.notify_submissions) {
						const appUrl = platform.env.APP_URL || url.origin;
						await sendSubmissionNotification(platform.env, {
							proEmail: txnInfo.creatorEmail,
							proName: txnInfo.creatorName,
							clientName: locals.clientSession.clientName,
							transactionTitle: txnInfo.transactionTitle,
							itemName: item.name,
							appUrl,
							transactionId: locals.clientSession.transactionId
						});
					}
				}
			} catch (err) {
				console.error('Failed to send submission notification:', err);
			}
		}

		return { success: true };
	},

	addComment: async ({ request, locals, platform, url }) => {
		const db = platform?.env?.DB;
		const session = locals.clientSession;
		if (!db || !session) return fail(400, { error: 'Session invalid' });

		const formData = await request.formData();
		const rawContent = (formData.get('content') as string)?.trim();
		const checklistItemId = (formData.get('checklistItemId') as string) || undefined;

		if (!rawContent) return fail(400, { error: 'Comment cannot be empty' });
		const content = sanitizeTextInput(rawContent);

		await addComment(db, {
			transactionId: session.transactionId,
			checklistItemId,
			authorType: 'client',
			authorName: session.clientName,
			content
		});

		// Get workspace for webhook dispatch
		const commentTxnWs = await db
			.prepare('SELECT workspace_id FROM transactions WHERE id = ?')
			.bind(session.transactionId)
			.first<{ workspace_id: string }>();

		await createAuditEvent(db, {
			transactionId: session.transactionId,
			checklistItemId,
			actorType: 'client',
			actorName: session.clientName,
			action: 'comment_added',
			detail: content.length > 100 ? content.slice(0, 100) + '...' : content
		}, commentTxnWs && platform?.env ? { env: platform.env, workspaceId: commentTxnWs.workspace_id, context: platform.context } : undefined);

		// Record activity for notification dots
		if (checklistItemId) {
			await recordItemActivity(db, checklistItemId, session.transactionId, 'comment_added', 'client', session.clientName);
		}

		// Notify pro when client adds a comment (non-blocking, respects notification prefs)
		if (platform?.env) {
			try {
				const txnInfo = await getTransactionWithCreatorEmail(db, session.transactionId);
				if (txnInfo) {
					const prefs = await getNotificationPrefs(db, txnInfo.creatorId);
					if (!prefs || prefs.notify_submissions) {
					let itemName: string | undefined;
					if (checklistItemId) {
						const item = await db
							.prepare('SELECT name FROM checklist_items WHERE id = ?')
							.bind(checklistItemId)
							.first<{ name: string }>();
						itemName = item?.name;
					}
					const appUrl = platform.env.APP_URL || url.origin;
					await sendCommentNotification(platform.env, {
						to: txnInfo.creatorEmail,
						authorName: session.clientName,
						authorType: 'client',
						transactionTitle: txnInfo.transactionTitle,
						itemName,
						comment: content,
						ctaUrl: `${appUrl}/app/transactions/${session.transactionId}`
					});
					}
				}
			} catch (err) {
				console.error('Failed to send comment notification:', err);
			}
		}

		return { success: true };
	}
};
