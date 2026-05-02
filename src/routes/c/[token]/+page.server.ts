import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getTransactionByIdForClient, updateChecklistItemAnswer, getTransactionWithCreatorEmail } from '$lib/server/db/transactions';
import { createAuditEvent } from '$lib/server/db/audit';
import { recordItemActivity, markTransactionSeen, getItemActivityMap, getLastSeen } from '$lib/server/db/activity';
import type { TransactionWithItems, DbChecklistItem } from '$lib/server/db/transactions';
import { getFilesForTransaction } from '$lib/server/db/files';
import type { DbFile } from '$lib/server/db/files';
import { listClientVaultFiles } from '$lib/server/db/vault';
import { getCommentsForTransaction, addComment } from '$lib/server/db/comments';
import type { DbComment } from '$lib/server/db/comments';
import { sanitizeTextInput } from '$lib/server/sanitize';
import { sendSubmissionNotification, sendCommentNotification } from '$lib/server/email';
import { getNotificationPrefs } from '$lib/server/db/users';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const session = locals.clientSession;
	if (!session) return { transaction: null, files: [], comments: [] };

	const db = platform?.env?.DB;

	if (!db) {
		// No DB at all — return empty
		return { transaction: null, files: [] as DbFile[], comments: [] as DbComment[], itemActivity: [] as any[], lastSeenAt: null as string | null };
	}

	const transaction = await getTransactionByIdForClient(db, session.transactionId);
	if (!transaction) return { transaction: null, files: [], comments: [], itemActivity: [], lastSeenAt: null };

	const [files, comments, itemActivity, lastSeenAt, vaultFiles] = await Promise.all([
		getFilesForTransaction(db, session.transactionId),
		getCommentsForTransaction(db, session.transactionId),
		getItemActivityMap(db, session.transactionId),
		getLastSeen(db, session.transactionId, 'client', session.clientEmail),
		listClientVaultFiles(db, transaction.workspace_id, session.clientEmail, session.transactionId)
	]);

	// Mark as seen (non-blocking)
	markTransactionSeen(db, session.transactionId, 'client', session.clientEmail).catch(() => {});

	const clientVault = vaultFiles.map((f) => ({
		id: f.id,
		filename: f.filename,
		fileSize: f.file_size,
		mimeType: f.mime_type,
		version: f.version,
		createdAt: f.created_at,
		uploadedByClient: f.uploaded_by_client === 1,
		transaction: {
			id: f.transaction_id,
			title: f.transaction_title,
			status: f.transaction_status
		},
		checklistItem: { name: f.checklist_item_name }
	}));

	return { transaction, files, comments, itemActivity, lastSeenAt, clientVault };
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
