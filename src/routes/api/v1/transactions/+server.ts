import type { RequestHandler } from './$types';
import { getTransactionsForWorkspace, getTransactionCounts, createTransaction } from '$lib/server/db/transactions';
import { getTemplateById } from '$lib/server/db/templates';
import { apiSuccess, apiError } from '$lib/server/api-response';
import { createAuditEvent } from '$lib/server/db/audit';

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	const apiKey = locals.apiKey;
	if (!apiKey) return apiError(401, 'API key required');

	const db = platform?.env?.DB;
	if (!db) return apiError(503, 'Service unavailable');

	const status = url.searchParams.get('status') || undefined;
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
	const offset = parseInt(url.searchParams.get('offset') || '0');

	// Validate status filter
	const validStatuses = ['draft', 'active', 'in_review', 'completed', 'cancelled'];
	if (status && !validStatuses.includes(status)) {
		return apiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
	}

	const transactions = await getTransactionsForWorkspace(db, apiKey.workspaceId, {
		status
	});

	// Apply pagination
	const total = transactions.length;
	const paginated = transactions.slice(offset, offset + limit);

	// Sanitize output (remove internal fields)
	const data = paginated.map(t => ({
		id: t.id,
		title: t.title,
		description: t.description,
		status: t.status,
		transactionType: t.transaction_type,
		clientName: t.client_name,
		clientEmail: t.client_email,
		clientPhone: t.client_phone,
		dueDate: t.due_date,
		salePrice: t.sale_price,
		commissionRate: t.commission_rate,
		commissionAmount: t.commission_amount,
		itemCount: t.item_count,
		completedCount: t.completed_count,
		createdAt: t.created_at,
		updatedAt: t.updated_at,
		completedAt: t.completed_at
	}));

	return apiSuccess(data, { total, limit, offset });
};

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const apiKey = locals.apiKey;
	if (!apiKey) return apiError(401, 'API key required');

	const db = platform?.env?.DB;
	if (!db) return apiError(503, 'Service unavailable');

	let body: any;
	try {
		body = await request.json();
	} catch {
		return apiError(400, 'Invalid JSON body');
	}

	const { templateId, title, clientName, clientEmail, clientPhone, dueDate, description } = body;

	// Validate required fields
	if (!templateId) return apiError(400, 'templateId is required');
	if (!title) return apiError(400, 'title is required');
	if (!clientName) return apiError(400, 'clientName is required');
	if (!clientEmail) return apiError(400, 'clientEmail is required');

	// Validate email format
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
		return apiError(400, 'Invalid email format');
	}

	// Verify template belongs to workspace
	const template = await getTemplateById(db, templateId, apiKey.workspaceId);
	if (!template) return apiError(404, 'Template not found in your workspace');

	const transactionId = await createTransaction(db, {
		workspaceId: apiKey.workspaceId,
		templateId,
		title,
		description: description || undefined,
		clientName,
		clientEmail,
		clientPhone: clientPhone || undefined,
		dueDate: dueDate || undefined,
		createdBy: apiKey.id
	});

	await createAuditEvent(db, {
		transactionId,
		actorType: 'system',
		actorId: apiKey.id,
		actorName: 'API',
		action: 'transaction_created',
		detail: `Transaction created via API`
	});

	return apiSuccess({ id: transactionId, status: 'draft' });
};
