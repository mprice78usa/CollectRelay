/** Transaction database operations */
import { generateId } from '$server/auth';

// --- Types ---

export interface DbTransaction {
	id: string;
	workspace_id: string;
	template_id: string | null;
	title: string;
	description: string | null;
	transaction_type: string;
	status: string;
	client_name: string;
	client_email: string;
	client_phone: string | null;
	due_date: string | null;
	reminder_enabled: number;
	reminder_interval_days: number;
	sale_price: number | null;
	commission_rate: number | null;
	commission_amount: number | null;
	created_by: string;
	created_at: string;
	updated_at: string;
	completed_at: string | null;
	last_reminder_at: string | null;
}

export interface DbCustomField {
	id: string;
	transaction_id: string;
	field_name: string;
	field_value: string;
	sort_order: number;
}

export interface DbChecklistItem {
	id: string;
	transaction_id: string;
	name: string;
	description: string | null;
	item_type: string;
	required: number;
	sort_order: number;
	status: string;
	allowed_file_types: string | null;
	max_file_size: number | null;
	example_text: string | null;
	due_date: string | null;
	answer: string | null;
	reviewed_by: string | null;
	reviewed_at: string | null;
	review_note: string | null;
}

export interface TransactionWithItems extends DbTransaction {
	items: DbChecklistItem[];
}

export interface TransactionListItem extends DbTransaction {
	item_count: number;
	completed_count: number;
}

export interface TransactionCounts {
	active: number;
	pending_review: number;
	completed: number;
	total: number;
}

// --- Queries ---

export async function getTransactionCounts(
	db: D1Database,
	workspaceId: string
): Promise<TransactionCounts> {
	const result = await db
		.prepare(
			`SELECT
				COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active,
				COALESCE(SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END), 0) as pending_review,
				COALESCE(SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END), 0) as completed,
				COUNT(*) as total
			 FROM transactions WHERE workspace_id = ?`
		)
		.bind(workspaceId)
		.first<TransactionCounts>();

	return result ?? { active: 0, pending_review: 0, completed: 0, total: 0 };
}

export async function getTransactionsForWorkspace(
	db: D1Database,
	workspaceId: string,
	filters?: { status?: string; excludeStatus?: string }
): Promise<TransactionListItem[]> {
	let query = `
		SELECT t.*,
			(SELECT COUNT(*) FROM checklist_items WHERE transaction_id = t.id) as item_count,
			(SELECT COUNT(*) FROM checklist_items WHERE transaction_id = t.id AND status IN ('accepted', 'waived')) as completed_count
		FROM transactions t
		WHERE t.workspace_id = ?`;

	const values: string[] = [workspaceId];

	if (filters?.status) {
		query += ' AND t.status = ?';
		values.push(filters.status);
	}

	if (filters?.excludeStatus) {
		query += ' AND t.status != ?';
		values.push(filters.excludeStatus);
	}

	query += ' ORDER BY t.created_at DESC';

	const result = await db.prepare(query).bind(...values).all<TransactionListItem>();
	return result.results;
}

export async function getTransactionById(
	db: D1Database,
	transactionId: string,
	workspaceId: string
): Promise<TransactionWithItems | null> {
	const transaction = await db
		.prepare('SELECT * FROM transactions WHERE id = ? AND workspace_id = ?')
		.bind(transactionId, workspaceId)
		.first<DbTransaction>();

	if (!transaction) return null;

	const items = await db
		.prepare('SELECT * FROM checklist_items WHERE transaction_id = ? ORDER BY sort_order')
		.bind(transactionId)
		.all<DbChecklistItem>();

	return { ...transaction, items: items.results };
}

export async function getTransactionByIdForClient(
	db: D1Database,
	transactionId: string
): Promise<TransactionWithItems | null> {
	const transaction = await db
		.prepare('SELECT * FROM transactions WHERE id = ?')
		.bind(transactionId)
		.first<DbTransaction>();

	if (!transaction) return null;

	const items = await db
		.prepare('SELECT * FROM checklist_items WHERE transaction_id = ? ORDER BY sort_order')
		.bind(transactionId)
		.all<DbChecklistItem>();

	return { ...transaction, items: items.results };
}

export async function createTransaction(
	db: D1Database,
	data: {
		workspaceId: string;
		templateId: string;
		title: string;
		description?: string;
		clientName: string;
		clientEmail: string;
		clientPhone?: string;
		dueDate?: string;
		salePrice?: number;
		commissionRate?: number;
		commissionAmount?: number;
		createdBy: string;
	}
): Promise<string> {
	const transactionId = generateId();

	// Fetch template items to clone
	const templateItems = await db
		.prepare('SELECT * FROM template_items WHERE template_id = ? ORDER BY sort_order')
		.bind(data.templateId)
		.all<{
			id: string;
			name: string;
			description: string | null;
			item_type: string;
			required: number;
			sort_order: number;
			allowed_file_types: string | null;
			max_file_size: number | null;
			example_text: string | null;
		}>();

	// Get the template to grab its category for transaction_type
	const template = await db
		.prepare('SELECT category FROM templates WHERE id = ?')
		.bind(data.templateId)
		.first<{ category: string }>();

	const statements: D1PreparedStatement[] = [];

	// Insert transaction
	statements.push(
		db
			.prepare(
				`INSERT INTO transactions (id, workspace_id, template_id, title, description, transaction_type, status, client_name, client_email, client_phone, due_date, sale_price, commission_rate, commission_amount, created_by)
				 VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`
			)
			.bind(
				transactionId,
				data.workspaceId,
				data.templateId,
				data.title,
				data.description || null,
				template?.category || 'custom',
				data.clientName,
				data.clientEmail,
				data.clientPhone || null,
				data.dueDate || null,
				data.salePrice ?? null,
				data.commissionRate ?? null,
				data.commissionAmount ?? null,
				data.createdBy
			)
	);

	// Clone template items into checklist_items
	for (const item of templateItems.results) {
		statements.push(
			db
				.prepare(
					`INSERT INTO checklist_items (id, transaction_id, name, description, item_type, required, sort_order, allowed_file_types, max_file_size, example_text)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					generateId(),
					transactionId,
					item.name,
					item.description,
					item.item_type,
					item.required,
					item.sort_order,
					item.allowed_file_types,
					item.max_file_size,
					item.example_text
				)
		);
	}

	await db.batch(statements);
	return transactionId;
}

export async function updateTransaction(
	db: D1Database,
	transactionId: string,
	workspaceId: string,
	data: { status?: string; title?: string; description?: string; dueDate?: string }
): Promise<void> {
	const sets: string[] = [];
	const values: (string | null)[] = [];

	if (data.status !== undefined) { sets.push('status = ?'); values.push(data.status); }
	if (data.title !== undefined) { sets.push('title = ?'); values.push(data.title); }
	if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
	if (data.dueDate !== undefined) { sets.push('due_date = ?'); values.push(data.dueDate); }

	if (sets.length === 0) return;

	// Set completed_at when marking as completed
	if (data.status === 'completed') {
		sets.push("completed_at = datetime('now')");
	}

	sets.push("updated_at = datetime('now')");
	values.push(transactionId, workspaceId);

	await db
		.prepare(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`)
		.bind(...values)
		.run();
}

export async function updateChecklistItemStatus(
	db: D1Database,
	itemId: string,
	data: { status: string; reviewedBy?: string; reviewNote?: string }
): Promise<void> {
	const sets = ['status = ?'];
	const values: (string | null)[] = [data.status];

	if (data.reviewedBy) {
		sets.push('reviewed_by = ?');
		values.push(data.reviewedBy);
		sets.push("reviewed_at = datetime('now')");
	}

	if (data.reviewNote !== undefined) {
		sets.push('review_note = ?');
		values.push(data.reviewNote);
	}

	values.push(itemId);
	await db.prepare(`UPDATE checklist_items SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
}

export async function getRecentTransactions(
	db: D1Database,
	workspaceId: string,
	limit = 5
): Promise<TransactionListItem[]> {
	const result = await db
		.prepare(
			`SELECT t.*,
				(SELECT COUNT(*) FROM checklist_items WHERE transaction_id = t.id) as item_count,
				(SELECT COUNT(*) FROM checklist_items WHERE transaction_id = t.id AND status IN ('accepted', 'waived')) as completed_count
			 FROM transactions t
			 WHERE t.workspace_id = ?
			 ORDER BY t.updated_at DESC
			 LIMIT ?`
		)
		.bind(workspaceId, limit)
		.all<TransactionListItem>();
	return result.results;
}

export async function updateChecklistItemAnswer(
	db: D1Database,
	itemId: string,
	answer: string
): Promise<void> {
	await db
		.prepare("UPDATE checklist_items SET answer = ?, status = 'submitted' WHERE id = ?")
		.bind(answer, itemId)
		.run();
}

// --- Creator Info (for notifications) ---

export interface TransactionCreatorInfo {
	transactionId: string;
	transactionTitle: string;
	creatorEmail: string;
	creatorName: string;
}

// --- Deal Details ---

export async function updateDealDetails(
	db: D1Database,
	transactionId: string,
	workspaceId: string,
	data: { salePrice?: number | null; commissionRate?: number | null; commissionAmount?: number | null }
): Promise<void> {
	await db
		.prepare(
			`UPDATE transactions SET sale_price = ?, commission_rate = ?, commission_amount = ?, updated_at = datetime('now')
			 WHERE id = ? AND workspace_id = ?`
		)
		.bind(
			data.salePrice ?? null,
			data.commissionRate ?? null,
			data.commissionAmount ?? null,
			transactionId,
			workspaceId
		)
		.run();
}

// --- Custom Fields ---

export async function getTransactionCustomFields(
	db: D1Database,
	transactionId: string
): Promise<DbCustomField[]> {
	const result = await db
		.prepare('SELECT * FROM transaction_custom_fields WHERE transaction_id = ? ORDER BY sort_order')
		.bind(transactionId)
		.all<DbCustomField>();
	return result.results;
}

export async function setTransactionCustomField(
	db: D1Database,
	transactionId: string,
	fieldName: string,
	fieldValue: string,
	sortOrder = 0
): Promise<string> {
	const id = generateId();
	await db
		.prepare(
			`INSERT INTO transaction_custom_fields (id, transaction_id, field_name, field_value, sort_order)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(id, transactionId, fieldName, fieldValue, sortOrder)
		.run();
	return id;
}

export async function deleteTransactionCustomField(
	db: D1Database,
	fieldId: string,
	transactionId: string
): Promise<void> {
	await db
		.prepare('DELETE FROM transaction_custom_fields WHERE id = ? AND transaction_id = ?')
		.bind(fieldId, transactionId)
		.run();
}

// --- Pipeline Queries ---

export interface PendingSaleItem {
	id: string;
	title: string;
	client_name: string;
	status: string;
	sale_price: number | null;
	commission_amount: number | null;
	due_date: string | null;
	item_count: number;
	completed_count: number;
	updated_at: string;
}

export async function getPendingSalesData(
	db: D1Database,
	workspaceId: string
): Promise<{ totalPipelineValue: number; totalCommission: number; pendingSales: PendingSaleItem[] }> {
	const result = await db
		.prepare(
			`SELECT t.id, t.title, t.client_name, t.status, t.sale_price, t.commission_amount, t.due_date, t.updated_at,
				(SELECT COUNT(*) FROM checklist_items WHERE transaction_id = t.id) as item_count,
				(SELECT COUNT(*) FROM checklist_items WHERE transaction_id = t.id AND status IN ('accepted', 'waived')) as completed_count
			 FROM transactions t
			 WHERE t.workspace_id = ? AND t.status IN ('active', 'in_review')
			 ORDER BY t.created_at DESC`
		)
		.bind(workspaceId)
		.all<PendingSaleItem>();

	let totalPipelineValue = 0;
	let totalCommission = 0;
	for (const row of result.results) {
		if (row.sale_price) totalPipelineValue += row.sale_price;
		if (row.commission_amount) totalCommission += row.commission_amount;
	}

	return { totalPipelineValue, totalCommission, pendingSales: result.results };
}

// --- Creator Info (for notifications) ---

export async function getTransactionWithCreatorEmail(
	db: D1Database,
	transactionId: string
): Promise<TransactionCreatorInfo | null> {
	const result = await db
		.prepare(
			`SELECT t.id as transactionId, t.title as transactionTitle, u.email as creatorEmail, u.name as creatorName
			 FROM transactions t
			 JOIN users u ON t.created_by = u.id
			 WHERE t.id = ?`
		)
		.bind(transactionId)
		.first<TransactionCreatorInfo>();

	return result ?? null;
}

// --- Delete Transaction (cancelled only) ---

export async function deleteTransaction(
	db: D1Database,
	transactionId: string,
	workspaceId: string
): Promise<boolean> {
	// Only allow deleting cancelled transactions
	const txn = await db
		.prepare('SELECT status FROM transactions WHERE id = ? AND workspace_id = ?')
		.bind(transactionId, workspaceId)
		.first<{ status: string }>();

	if (!txn || txn.status !== 'cancelled') return false;

	// Delete related data then the transaction
	await db.batch([
		db.prepare('DELETE FROM transaction_custom_fields WHERE transaction_id = ?').bind(transactionId),
		db.prepare('DELETE FROM transaction_collaborators WHERE transaction_id = ?').bind(transactionId),
		db.prepare('DELETE FROM comments WHERE transaction_id = ?').bind(transactionId),
		db.prepare('DELETE FROM audit_events WHERE transaction_id = ?').bind(transactionId),
		db.prepare('DELETE FROM files WHERE transaction_id = ?').bind(transactionId),
		db.prepare('DELETE FROM item_activity WHERE transaction_id = ?').bind(transactionId),
		db.prepare('DELETE FROM activity_seen WHERE transaction_id = ?').bind(transactionId),
		db.prepare('DELETE FROM checklist_items WHERE transaction_id = ?').bind(transactionId),
		db.prepare('DELETE FROM transactions WHERE id = ? AND workspace_id = ?').bind(transactionId, workspaceId)
	]);

	return true;
}
