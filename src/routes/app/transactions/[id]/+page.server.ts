import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { getTransactionById, updateTransaction, updateChecklistItemStatus, getTransactionCustomFields, updateDealDetails, setTransactionCustomField, deleteTransactionCustomField } from '$lib/server/db/transactions';
import type { TransactionWithItems, DbChecklistItem, DbCustomField } from '$lib/server/db/transactions';
import { getFilesForTransaction } from '$lib/server/db/files';
import type { DbFile } from '$lib/server/db/files';
import { createAuditEvent } from '$lib/server/db/audit';
import { recordItemActivity, markTransactionSeen, getItemActivityMap, getLastSeen } from '$lib/server/db/activity';
import { getCommentsForTransaction, addComment } from '$lib/server/db/comments';
import type { DbComment } from '$lib/server/db/comments';
import { getCollaboratorsForTransaction, addCollaborator, removeCollaborator } from '$lib/server/db/collaborators';
import { sanitizeTextInput } from '$lib/server/sanitize';
import { generateId } from '$lib/server/auth';
import { getMilestonesForTransaction, createMilestone, updateMilestone, deleteMilestone, seedDefaultMilestones } from '$lib/server/db/milestones';
import type { DbMilestone } from '$lib/server/db/milestones';
import { getPartnerLinksForTransaction, createPartnerLink, revokePartnerLink } from '$lib/server/db/partner-links';
import type { DbPartnerLink } from '$lib/server/db/partner-links';
import { getDocumentLibrary } from '$lib/server/db/document-library';
import type { DbDocumentLibraryItem } from '$lib/server/db/document-library';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mode: return mock transaction
		const mockItems: DbChecklistItem[] = [
			{
				id: 'mock-ci-1', transaction_id: params.id, name: 'Government-issued ID',
				description: 'Drivers license or passport', item_type: 'document', required: 1,
				sort_order: 0, status: 'accepted', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: 'dev-user', reviewed_at: '2026-03-02', review_note: null, signature_data: null
			},
			{
				id: 'mock-ci-2', transaction_id: params.id, name: 'Proof of income',
				description: 'Recent pay stubs or tax return', item_type: 'document', required: 1,
				sort_order: 1, status: 'submitted', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
			},
			{
				id: 'mock-ci-3', transaction_id: params.id, name: 'Confirm mailing address',
				description: 'Your current mailing address', item_type: 'question', required: 1,
				sort_order: 2, status: 'submitted', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: '123 Main St, Suite 4, New York, NY 10001',
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
			},
			{
				id: 'mock-ci-4', transaction_id: params.id, name: 'Pre-approval letter',
				description: 'From your lender', item_type: 'document', required: 1,
				sort_order: 3, status: 'pending', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
			},
			{
				id: 'mock-ci-5', transaction_id: params.id, name: 'Agree to terms',
				description: 'Acknowledge receipt of disclosure', item_type: 'checkbox', required: 1,
				sort_order: 4, status: 'pending', allowed_file_types: null, max_file_size: null,
				example_text: null, due_date: null, answer: null,
				reviewed_by: null, reviewed_at: null, review_note: null, signature_data: null
			}
		];

		const mockTransaction: TransactionWithItems = {
			id: params.id,
			workspace_id: 'dev-workspace',
			template_id: 'mock-tpl-1',
			title: '123 Main St — Buyer Package',
			description: null,
			transaction_type: 'real_estate',
			status: 'active',
			client_name: 'Sarah Johnson',
			client_email: 'sarah@example.com',
			client_phone: '555-0100',
			due_date: '2026-03-15',
			reminder_enabled: 1,
			reminder_interval_days: 2,
			sale_price: 450000,
			commission_rate: 3,
			commission_amount: 13500,
			created_by: 'dev-user',
			created_at: '2026-03-01T10:00:00Z',
			updated_at: '2026-03-01T10:00:00Z',
			completed_at: null,
			items: mockItems
		};

		const mockFiles: DbFile[] = [
			{
				id: 'mock-file-1', checklist_item_id: 'mock-ci-1', transaction_id: params.id,
				uploaded_by_client: 1, filename: 'drivers-license.pdf', r2_key: 'mock/key',
				file_size: 245000, mime_type: 'application/pdf', version: 1,
				created_at: '2026-03-02T09:00:00Z',
				ai_summary: 'California driver\'s license for Sarah Johnson, issued 2024, expires 2030.',
				ai_summary_status: 'completed'
			},
			{
				id: 'mock-file-2', checklist_item_id: 'mock-ci-2', transaction_id: params.id,
				uploaded_by_client: 1, filename: 'paystub-feb-2026.pdf', r2_key: 'mock/key2',
				file_size: 180000, mime_type: 'application/pdf', version: 1,
				created_at: '2026-03-03T14:00:00Z',
				ai_summary: null,
				ai_summary_status: 'processing'
			}
		];

		const now = new Date();
		const mockComments: DbComment[] = [
			{
				id: 'mc-1', transaction_id: params.id, checklist_item_id: 'mock-ci-2',
				author_type: 'pro', author_id: 'dev-user', author_name: 'Dev User',
				content: 'Hi Sarah, can you upload a more recent pay stub? The one submitted is from 2 months ago.',
				created_at: new Date(now.getTime() - 3 * 3600000).toISOString()
			},
			{
				id: 'mc-2', transaction_id: params.id, checklist_item_id: 'mock-ci-2',
				author_type: 'client', author_id: null, author_name: 'Sarah Johnson',
				content: 'Sure! I just got my latest one, uploading now.',
				created_at: new Date(now.getTime() - 2 * 3600000).toISOString()
			},
			{
				id: 'mc-3', transaction_id: params.id, checklist_item_id: 'mock-ci-3',
				author_type: 'pro', author_id: 'dev-user', author_name: 'Dev User',
				content: 'Thanks for the address. Just confirming — is this a house or apartment?',
				created_at: new Date(now.getTime() - 1 * 3600000).toISOString()
			}
		];

		const mockCustomFields: DbCustomField[] = [
			{ id: 'cf-1', transaction_id: params.id, field_name: 'Escrow Company', field_value: 'ABC Title Co.', sort_order: 0 },
			{ id: 'cf-2', transaction_id: params.id, field_name: 'Loan Officer', field_value: 'Mike Chen', sort_order: 1 }
		];

		const mockMilestones: DbMilestone[] = [
			{ id: 'ms-1', transaction_id: params.id, milestone_type: 'contract_date', label: 'Contract Date', date: '2026-03-01', completed: 1, sort_order: 0, created_at: '2026-03-01' },
			{ id: 'ms-2', transaction_id: params.id, milestone_type: 'inspection', label: 'Inspection Deadline', date: '2026-03-15', completed: 1, sort_order: 1, created_at: '2026-03-01' },
			{ id: 'ms-3', transaction_id: params.id, milestone_type: 'appraisal', label: 'Appraisal Due', date: '2026-03-22', completed: 0, sort_order: 2, created_at: '2026-03-01' },
			{ id: 'ms-4', transaction_id: params.id, milestone_type: 'closing', label: 'Closing', date: '2026-05-01', completed: 0, sort_order: 6, created_at: '2026-03-01' }
		];
		return { transaction: mockTransaction, files: mockFiles, comments: mockComments, customFields: mockCustomFields, collaborators: [] as any[], itemActivity: [] as any[], lastSeenAt: null as string | null, milestones: mockMilestones, partnerLinks: [] as DbPartnerLink[], libraryDocs: [] as DbDocumentLibraryItem[], voiceNotes: [] as any[], photoNotes: [] as any[] };
	}

	const transaction = await getTransactionById(db, params.id, workspaceId);
	if (!transaction) {
		throw error(404, 'Transaction not found');
	}

	// Load data + activity info in parallel
	const userId = locals.user!.id;
	const [files, comments, customFields, collaborators, itemActivity, lastSeenAt, milestones, partnerLinks, voiceNotesResult, photoNotesResult] = await Promise.all([
		getFilesForTransaction(db, params.id),
		getCommentsForTransaction(db, params.id),
		getTransactionCustomFields(db, params.id),
		getCollaboratorsForTransaction(db, params.id),
		getItemActivityMap(db, params.id),
		getLastSeen(db, params.id, 'pro', userId),
		getMilestonesForTransaction(db, params.id),
		getPartnerLinksForTransaction(db, params.id),
		db.prepare('SELECT id, duration_seconds, transcript, transcript_status, ai_actions, ai_status, is_relayed, created_at FROM voice_notes WHERE transaction_id = ? ORDER BY created_at DESC')
			.bind(params.id).all(),
		db.prepare('SELECT id, r2_key, filename, mime_type, title, notes, ai_description, ai_actions, ai_status, is_relayed, created_at FROM photo_notes WHERE transaction_id = ? ORDER BY created_at DESC')
			.bind(params.id).all()
	]);
	const voiceNotes = voiceNotesResult.results || [];
	const photoNotes = photoNotesResult.results || [];

	// Mark as seen (non-blocking)
	markTransactionSeen(db, params.id, 'pro', userId).catch(() => {});

	// Load document library docs with files for "Attach from Library"
	const ws = await db
		.prepare('SELECT industry FROM workspaces WHERE id = ?')
		.bind(workspaceId)
		.first<{ industry: string }>();
	const industry = ws?.industry || 'real_estate';
	const allLibraryDocs = await getDocumentLibrary(db, workspaceId, undefined, industry);
	const libraryDocs = allLibraryDocs.filter(d => d.r2_key && d.filename);

	return { transaction, files, comments, customFields, collaborators, itemActivity, lastSeenAt, milestones, partnerLinks, libraryDocs, voiceNotes, photoNotes };
};

export const actions: Actions = {
	updateStatus: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const status = formData.get('status') as string;

		if (!['active', 'in_review', 'completed', 'cancelled'].includes(status)) {
			return fail(400, { error: 'Invalid status' });
		}

		await updateTransaction(db, params.id, user.workspaceId, { status });

		await createAuditEvent(db, {
			transactionId: params.id,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'status_changed',
			detail: `Status changed to ${status}`
		}, platform?.env ? { env: platform.env, workspaceId: user.workspaceId, context: platform.context } : undefined);

		return { success: true };
	},

	sendLink: async ({ params, locals, platform, url }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const transaction = await getTransactionById(db, params.id, user.workspaceId);
		if (!transaction) return fail(404, { error: 'Transaction not found' });

		// Generate magic link
		const { generateMagicLink } = await import('$lib/server/magic-links');
		const token = await generateMagicLink(platform!.env, {
			transactionId: params.id,
			clientEmail: transaction.client_email,
			clientName: transaction.client_name
		});

		const appUrl = platform?.env?.APP_URL || url.origin;
		const magicLinkUrl = `${appUrl}/c/${token}`;

		// Get workspace industry for terminology
		const ws = await db.prepare('SELECT industry FROM workspaces WHERE id = ?')
			.bind(user.workspaceId).first<{ industry: string }>();

		// Send email
		const { sendMagicLinkEmail } = await import('$lib/server/email');
		await sendMagicLinkEmail(platform!.env, {
			to: transaction.client_email,
			clientName: transaction.client_name,
			proName: user.name,
			transactionTitle: transaction.title,
			magicLinkUrl,
			industry: ws?.industry
		});

		// Send SMS if enabled and client has phone number
		if (transaction.client_phone && transaction.sms_enabled) {
			const { sendMagicLinkSms } = await import('$lib/server/sms');
			await sendMagicLinkSms(platform!.env, {
				to: transaction.client_phone,
				proName: user.name,
				transactionTitle: transaction.title,
				magicLinkUrl
			});
		}

		// Mark as active if draft
		if (transaction.status === 'draft') {
			await updateTransaction(db, params.id, user.workspaceId, { status: 'active' });
		}

		await createAuditEvent(db, {
			transactionId: params.id,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'magic_link_sent',
			detail: `Magic link sent to ${transaction.client_email}`
		}, platform?.env ? { env: platform.env, workspaceId: user.workspaceId, context: platform.context } : undefined);

		return { success: true, magicLink: magicLinkUrl };
	},

	reviewItem: async ({ request, params, locals, platform, url }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const itemId = formData.get('itemId') as string;
		const action = formData.get('action') as string;
		const rawReviewNote = (formData.get('reviewNote') as string) || undefined;
		const reviewNote = rawReviewNote ? sanitizeTextInput(rawReviewNote, 2000) : undefined;

		if (!itemId || !['accept', 'reject', 'waive'].includes(action)) {
			return fail(400, { error: 'Invalid review action' });
		}

		const statusMap: Record<string, string> = {
			accept: 'accepted',
			reject: 'rejected',
			waive: 'waived'
		};

		await updateChecklistItemStatus(db, itemId, {
			status: statusMap[action],
			reviewedBy: user.id,
			reviewNote
		});

		await createAuditEvent(db, {
			transactionId: params.id,
			checklistItemId: itemId,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: `item_${action}ed`,
			detail: reviewNote ? `${action}ed with note: ${reviewNote}` : `Item ${action}ed`
		}, platform?.env ? { env: platform.env, workspaceId: user.workspaceId, context: platform.context } : undefined);

		// Record activity for notification dots
		await recordItemActivity(db, itemId, params.id, 'item_reviewed', 'pro', user.name);

		// Send review notification to client with magic link
		try {
			const transaction = await getTransactionById(db, params.id, user.workspaceId);
			if (transaction && platform?.env) {
				const item = transaction.items.find((i) => i.id === itemId);

				// Generate magic link for client CTA
				let magicLinkUrl: string | undefined;
				if (platform.env.MAGIC_LINKS) {
					const { generateMagicLink } = await import('$lib/server/magic-links');
					const token = await generateMagicLink(platform.env, {
						transactionId: params.id,
						clientEmail: transaction.client_email,
						clientName: transaction.client_name
					});
					const appUrl = platform.env.APP_URL || url.origin;
					magicLinkUrl = `${appUrl}/c/${token}`;
				}

				const { sendReviewNotification } = await import('$lib/server/email');
				await sendReviewNotification(platform.env, {
					clientEmail: transaction.client_email,
					proName: user.name,
					transactionTitle: transaction.title,
					itemName: item?.name || 'Item',
					action: statusMap[action],
					reviewNote,
					magicLinkUrl
				});

				// Push notification (fire-and-forget)
				if (platform.env.VAPID_PUBLIC_KEY && platform.env.VAPID_PRIVATE_KEY) {
					const { pushNotifyTransaction } = await import('$lib/server/push-notify');
					const pushPromise = pushNotifyTransaction(db, params.id, {
						title: 'Item Reviewed',
						body: `${item?.name || 'An item'} was ${statusMap[action]}`,
						url: magicLinkUrl || `/c/${params.id}`
					}, platform.env.VAPID_PUBLIC_KEY, platform.env.VAPID_PRIVATE_KEY);
					if (platform.context) {
						platform.context.waitUntil(pushPromise);
					}
				}
			}
		} catch {
			// Non-critical — don't fail the review
		}

		return { success: true };
	},

	addComment: async ({ request, params, locals, platform, url }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const rawContent = (formData.get('content') as string)?.trim();
		const checklistItemId = (formData.get('checklistItemId') as string) || undefined;

		if (!rawContent) return fail(400, { error: 'Comment cannot be empty' });
		const content = sanitizeTextInput(rawContent);

		await addComment(db, {
			transactionId: params.id,
			checklistItemId,
			authorType: 'pro',
			authorId: user.id,
			authorName: user.name,
			content
		});

		await createAuditEvent(db, {
			transactionId: params.id,
			checklistItemId,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'comment_added',
			detail: content.length > 100 ? content.slice(0, 100) + '...' : content
		}, platform?.env ? { env: platform.env, workspaceId: user.workspaceId, context: platform.context } : undefined);

		// Record activity for notification dots
		if (checklistItemId) {
			await recordItemActivity(db, checklistItemId, params.id, 'comment_added', 'pro', user.name);
		}

		// Send comment notification to client with magic link
		try {
			const transaction = await getTransactionById(db, params.id, user.workspaceId);
			if (transaction && platform?.env) {
				const item = checklistItemId ? transaction.items.find((i) => i.id === checklistItemId) : null;

				// Generate magic link for client CTA
				let ctaUrl: string | undefined;
				if (platform.env.MAGIC_LINKS) {
					const { generateMagicLink } = await import('$lib/server/magic-links');
					const token = await generateMagicLink(platform.env, {
						transactionId: params.id,
						clientEmail: transaction.client_email,
						clientName: transaction.client_name
					});
					const appUrl = platform.env.APP_URL || url.origin;
					ctaUrl = `${appUrl}/c/${token}`;
				}

				const { sendCommentNotification } = await import('$lib/server/email');
				await sendCommentNotification(platform.env, {
					to: transaction.client_email,
					authorName: user.name,
					authorType: 'pro',
					transactionTitle: transaction.title,
					itemName: item?.name,
					comment: content,
					ctaUrl
				});

				// Push notification (fire-and-forget)
				if (platform.env.VAPID_PUBLIC_KEY && platform.env.VAPID_PRIVATE_KEY) {
					const { pushNotifyTransaction } = await import('$lib/server/push-notify');
					const pushPromise = pushNotifyTransaction(db, params.id, {
						title: 'New Comment',
						body: `${user.name} left a comment`,
						url: ctaUrl || `/c/${params.id}`
					}, platform.env.VAPID_PUBLIC_KEY, platform.env.VAPID_PRIVATE_KEY);
					if (platform.context) {
						platform.context.waitUntil(pushPromise);
					}
				}
			}
		} catch {
			// Non-critical
		}

		return { success: true };
	},

	updateDealDetails: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const salePriceStr = formData.get('salePrice') as string;
		const commissionRateStr = formData.get('commissionRate') as string;
		const commissionAmountStr = formData.get('commissionAmount') as string;

		await updateDealDetails(db, params.id, user.workspaceId, {
			salePrice: salePriceStr ? parseFloat(salePriceStr) : null,
			commissionRate: commissionRateStr ? parseFloat(commissionRateStr) : null,
			commissionAmount: commissionAmountStr ? parseFloat(commissionAmountStr) : null
		});

		await createAuditEvent(db, {
			transactionId: params.id,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'deal_details_updated',
			detail: 'Updated deal details'
		});

		return { success: true };
	},

	addCustomField: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		// Verify transaction belongs to workspace
		const transaction = await getTransactionById(db, params.id, user.workspaceId);
		if (!transaction) return fail(404, { error: 'Transaction not found' });

		const formData = await request.formData();
		const rawName = (formData.get('fieldName') as string)?.trim();
		const rawValue = (formData.get('fieldValue') as string)?.trim();

		if (!rawName || !rawValue) return fail(400, { error: 'Field name and value are required' });

		const fieldName = sanitizeTextInput(rawName, 200);
		const fieldValue = sanitizeTextInput(rawValue, 1000);

		await setTransactionCustomField(db, params.id, fieldName, fieldValue);

		return { success: true };
	},

	removeCustomField: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const fieldId = formData.get('fieldId') as string;
		if (!fieldId) return fail(400, { error: 'Field ID required' });

		await deleteTransactionCustomField(db, fieldId, params.id);

		return { success: true };
	},

	addItem: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		// Verify transaction exists and belongs to workspace
		const transaction = await getTransactionById(db, params.id, user.workspaceId);
		if (!transaction) return fail(404, { error: 'Transaction not found' });

		// Don't allow adding items to completed/cancelled transactions
		if (['completed', 'cancelled'].includes(transaction.status)) {
			return fail(400, { error: 'Cannot add items to a completed or cancelled transaction' });
		}

		const formData = await request.formData();
		const rawName = (formData.get('name') as string)?.trim();
		const rawDescription = (formData.get('description') as string)?.trim() || null;
		const itemType = formData.get('itemType') as string;
		const required = formData.get('required') === 'true' ? 1 : 0;

		if (!rawName) return fail(400, { error: 'Item name is required' });
		if (!['document', 'question', 'checkbox', 'signature'].includes(itemType)) {
			return fail(400, { error: 'Invalid item type' });
		}

		const name = sanitizeTextInput(rawName, 200);
		const description = rawDescription ? sanitizeTextInput(rawDescription, 1000) : null;

		// Get next sort_order
		const maxOrder = await db
			.prepare('SELECT MAX(sort_order) as max_order FROM checklist_items WHERE transaction_id = ?')
			.bind(params.id)
			.first<{ max_order: number | null }>();
		const sortOrder = (maxOrder?.max_order ?? -1) + 1;

		const itemId = generateId();
		await db
			.prepare(
				`INSERT INTO checklist_items (id, transaction_id, name, description, item_type, required, sort_order, status)
				 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
			)
			.bind(itemId, params.id, name, description, itemType, required, sortOrder)
			.run();

		await createAuditEvent(db, {
			transactionId: params.id,
			checklistItemId: itemId,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'item_added',
			detail: `Added "${name}" (${itemType})`
		});

		// Record activity for notification dots
		await recordItemActivity(db, itemId, params.id, 'item_added', 'pro', user.name);

		return { success: true };
	},

	inviteCollaborator: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const email = (formData.get('email') as string)?.trim().toLowerCase();
		const role = (formData.get('role') as string) || 'viewer';

		if (!email) return fail(400, { error: 'Email is required' });
		if (!['viewer', 'commenter', 'reviewer'].includes(role)) {
			return fail(400, { error: 'Invalid role' });
		}

		// Look up user by email
		const { getUserByEmail } = await import('$lib/server/db/users');
		const targetUser = await getUserByEmail(db, email);
		if (!targetUser) {
			return fail(400, { error: 'No CollectRelay account found with that email. They must sign up first.' });
		}

		// Can't invite yourself
		if (targetUser.id === user.id) {
			return fail(400, { error: 'You cannot invite yourself' });
		}

		try {
			await addCollaborator(db, {
				transactionId: params.id,
				userId: targetUser.id,
				role,
				invitedBy: user.id
			});
		} catch (err: any) {
			if (err?.message?.includes('UNIQUE')) {
				return fail(400, { error: 'This user is already a collaborator' });
			}
			throw err;
		}

		await createAuditEvent(db, {
			transactionId: params.id,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'collaborator_invited',
			detail: `Invited ${targetUser.name} (${email}) as ${role}`
		});

		return { success: true };
	},

	removeCollaborator: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const collaboratorId = formData.get('collaboratorId') as string;
		if (!collaboratorId) return fail(400, { error: 'Collaborator ID required' });

		await removeCollaborator(db, collaboratorId, params.id);
		return { success: true };
	},

	nudge: async ({ params, locals, platform, url }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const transaction = await getTransactionById(db, params.id, user.workspaceId);
		if (!transaction) return fail(404, { error: 'Transaction not found' });
		if (transaction.status !== 'active') return fail(400, { error: 'Can only nudge active transactions' });

		// Generate fresh magic link
		const { generateMagicLink } = await import('$lib/server/magic-links');
		const token = await generateMagicLink(platform!.env, {
			transactionId: params.id,
			clientEmail: transaction.client_email,
			clientName: transaction.client_name
		});
		const appUrl = platform?.env?.APP_URL || url.origin;
		const magicLinkUrl = `${appUrl}/c/${token}`;

		// Send reminder email
		const { sendReminderEmail } = await import('$lib/server/email');
		await sendReminderEmail(platform!.env, {
			to: transaction.client_email,
			clientName: transaction.client_name,
			proName: user.name,
			transactionTitle: transaction.title,
			magicLinkUrl
		});

		// Send reminder SMS if enabled and client has phone number
		if (transaction.client_phone && transaction.sms_enabled) {
			const { sendReminderSms } = await import('$lib/server/sms');
			await sendReminderSms(platform!.env, {
				to: transaction.client_phone,
				proName: user.name,
				transactionTitle: transaction.title,
				magicLinkUrl
			});
		}

		// Update last_reminder_at
		await db.prepare("UPDATE transactions SET last_reminder_at = datetime('now') WHERE id = ?")
			.bind(params.id).run();

		await createAuditEvent(db, {
			transactionId: params.id,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'reminder_sent',
			detail: `Manual reminder sent to ${transaction.client_email}`
		}, platform?.env ? { env: platform.env, workspaceId: user.workspaceId, context: platform.context } : undefined);

		// Push notification (fire-and-forget)
		try {
			if (platform?.env?.VAPID_PUBLIC_KEY && platform?.env?.VAPID_PRIVATE_KEY) {
				const { pushNotifyTransaction } = await import('$lib/server/push-notify');
				const pushPromise = pushNotifyTransaction(db, params.id, {
					title: 'Reminder',
					body: 'You have pending items to complete',
					url: magicLinkUrl
				}, platform.env.VAPID_PUBLIC_KEY, platform.env.VAPID_PRIVATE_KEY);
				if (platform.context) {
					platform.context.waitUntil(pushPromise);
				}
			}
		} catch {
			// Non-critical
		}

		return { success: true, nudgeSent: true };
	},

	addMilestone: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const label = sanitizeTextInput(formData.get('label') as string, 200);
		const date = formData.get('date') as string || undefined;
		const milestoneType = (formData.get('milestoneType') as string) || 'custom';

		if (!label) return fail(400, { error: 'Label is required' });

		await createMilestone(db, {
			transactionId: params.id,
			milestoneType,
			label,
			date
		});

		return { success: true };
	},

	updateMilestone: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const milestoneId = formData.get('milestoneId') as string;
		const label = formData.has('label') ? sanitizeTextInput(formData.get('label') as string, 200) : undefined;
		const date = formData.has('date') ? (formData.get('date') as string || null) : undefined;
		const completed = formData.has('completed') ? parseInt(formData.get('completed') as string) : undefined;

		if (!milestoneId) return fail(400, { error: 'Milestone ID required' });

		await updateMilestone(db, milestoneId, params.id, { label, date, completed });
		return { success: true };
	},

	removeMilestone: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const milestoneId = formData.get('milestoneId') as string;
		if (!milestoneId) return fail(400, { error: 'Milestone ID required' });

		await deleteMilestone(db, milestoneId, params.id);
		return { success: true };
	},

	seedMilestones: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const contractDate = formData.get('contractDate') as string;
		if (!contractDate) return fail(400, { error: 'Contract date is required' });

		await seedDefaultMilestones(db, params.id, contractDate);
		return { success: true };
	},

	invitePartner: async ({ request, params, locals, platform, url }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const partnerName = sanitizeTextInput(formData.get('partnerName') as string, 200);
		const partnerEmail = (formData.get('partnerEmail') as string)?.trim().toLowerCase();
		const partnerType = (formData.get('partnerType') as string) || 'other';

		if (!partnerName || !partnerEmail) return fail(400, { error: 'Name and email are required' });

		const token = generateId();
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

		await createPartnerLink(db, {
			transactionId: params.id,
			partnerType,
			partnerName,
			partnerEmail,
			createdBy: user.id,
			token,
			expiresAt
		});

		const transaction = await getTransactionById(db, params.id, user.workspaceId);

		// Send partner invite email
		const appUrl = platform?.env?.APP_URL || url.origin;
		const portalUrl = `${appUrl}/p/${token}`;
		const { sendPartnerInviteEmail } = await import('$lib/server/email');
		await sendPartnerInviteEmail(platform!.env, {
			to: partnerEmail,
			partnerName,
			proName: user.name,
			transactionTitle: transaction?.title || 'Transaction',
			partnerType,
			portalUrl
		});

		await createAuditEvent(db, {
			transactionId: params.id,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'partner_invited',
			detail: `Invited ${partnerName} (${partnerEmail}) as ${partnerType}`
		});

		return { success: true };
	},

	revokePartnerLink: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const linkId = formData.get('linkId') as string;
		if (!linkId) return fail(400, { error: 'Link ID required' });

		await revokePartnerLink(db, linkId, params.id);
		return { success: true };
	},

	toggleSms: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const enabled = parseInt(formData.get('enabled') as string);

		await updateTransaction(db, params.id, user.workspaceId, { smsEnabled: enabled });
		return { success: true };
	},

	updateClient: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const clientName = sanitizeTextInput(formData.get('clientName') as string, 200);
		const clientEmail = (formData.get('clientEmail') as string)?.trim().toLowerCase();
		const clientPhone = (formData.get('clientPhone') as string)?.trim() || null;

		if (!clientName || !clientEmail) return fail(400, { error: 'Name and email are required' });

		await updateTransaction(db, params.id, user.workspaceId, {
			clientName,
			clientEmail,
			clientPhone
		});

		await createAuditEvent(db, {
			transactionId: params.id,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'client_updated',
			detail: `Updated client info: ${clientName} (${clientEmail})`
		});

		return { success: true };
	},

	acceptAllSubmitted: async ({ params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const transaction = await getTransactionById(db, params.id, user.workspaceId);
		if (!transaction) return fail(404, { error: 'Transaction not found' });

		const submittedItems = transaction.items.filter(i => i.status === 'submitted');
		if (submittedItems.length === 0) return fail(400, { error: 'No submitted items to accept' });

		// Batch update all submitted items to accepted
		const statements = submittedItems.map(item =>
			db.prepare(
				"UPDATE checklist_items SET status = 'accepted', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?"
			).bind(user.id, item.id)
		);
		await db.batch(statements);

		// Create audit events and record activity for each
		for (const item of submittedItems) {
			await createAuditEvent(db, {
				transactionId: params.id,
				checklistItemId: item.id,
				actorType: 'pro',
				actorId: user.id,
				actorName: user.name,
				action: 'item_accepted',
				detail: `Bulk accepted: ${item.name}`
			});
			await recordItemActivity(db, item.id, params.id, 'item_reviewed', 'pro', user.name);
		}

		return { success: true, acceptedCount: submittedItems.length };
	},
};
