import type { RequestHandler } from './$types';
import { getTransactionById } from '$lib/server/db/transactions';
import { getFilesForTransaction } from '$lib/server/db/files';
import { apiSuccess, apiError } from '$lib/server/api-response';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	const apiKey = locals.apiKey;
	if (!apiKey) return apiError(401, 'API key required');

	const db = platform?.env?.DB;
	if (!db) return apiError(503, 'Service unavailable');

	const transaction = await getTransactionById(db, params.id, apiKey.workspaceId);
	if (!transaction) return apiError(404, 'Transaction not found');

	const files = await getFilesForTransaction(db, params.id);

	// Sanitize output
	const data = {
		id: transaction.id,
		title: transaction.title,
		description: transaction.description,
		status: transaction.status,
		transactionType: transaction.transaction_type,
		clientName: transaction.client_name,
		clientEmail: transaction.client_email,
		clientPhone: transaction.client_phone,
		dueDate: transaction.due_date,
		salePrice: transaction.sale_price,
		commissionRate: transaction.commission_rate,
		commissionAmount: transaction.commission_amount,
		reminderEnabled: !!transaction.reminder_enabled,
		reminderIntervalDays: transaction.reminder_interval_days,
		smsEnabled: !!transaction.sms_enabled,
		createdAt: transaction.created_at,
		updatedAt: transaction.updated_at,
		completedAt: transaction.completed_at,
		lastReminderAt: transaction.last_reminder_at,
		items: transaction.items.map(item => ({
			id: item.id,
			name: item.name,
			description: item.description,
			itemType: item.item_type,
			required: !!item.required,
			sortOrder: item.sort_order,
			status: item.status,
			answer: item.answer,
			reviewedBy: item.reviewed_by,
			reviewedAt: item.reviewed_at,
			reviewNote: item.review_note,
			dueDate: item.due_date,
			files: files
				.filter(f => f.checklist_item_id === item.id)
				.map(f => ({
					id: f.id,
					filename: f.filename,
					mimeType: f.mime_type,
					fileSize: f.file_size,
					uploadedBy: f.uploaded_by,
					createdAt: f.created_at
				}))
		}))
	};

	return apiSuccess(data);
};
