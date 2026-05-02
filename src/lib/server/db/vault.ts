/** Vault: unified document archive queries (workspace + client scoped views) */

export interface VaultFile {
	id: string;
	checklist_item_id: string;
	transaction_id: string;
	uploaded_by_client: number;
	filename: string;
	r2_key: string;
	file_size: number;
	mime_type: string | null;
	version: number;
	created_at: string;
	transaction_title: string;
	transaction_status: string;
	transaction_client_name: string;
	transaction_client_email: string;
	checklist_item_name: string | null;
}

export interface VaultFilters {
	transactionId?: string;
	clientEmail?: string;
	dateFrom?: string;
	dateTo?: string;
	mimePrefix?: string;
	source?: 'pro' | 'client';
}

export interface VaultCursor {
	createdAt: string;
	id: string;
}

export interface VaultPage {
	files: VaultFile[];
	nextCursor: VaultCursor | null;
}

const SELECT_COLUMNS = `
	f.id, f.checklist_item_id, f.transaction_id, f.uploaded_by_client,
	f.filename, f.r2_key, f.file_size, f.mime_type, f.version, f.created_at,
	t.title as transaction_title,
	t.status as transaction_status,
	t.client_name as transaction_client_name,
	t.client_email as transaction_client_email,
	ci.name as checklist_item_name
`;

export async function listVaultFiles(
	db: D1Database,
	workspaceId: string,
	filters: VaultFilters,
	cursor: VaultCursor | null,
	limit = 50
): Promise<VaultPage> {
	const where: string[] = ['t.workspace_id = ?'];
	const binds: unknown[] = [workspaceId];

	if (filters.transactionId) {
		where.push('t.id = ?');
		binds.push(filters.transactionId);
	}
	if (filters.clientEmail) {
		where.push('LOWER(t.client_email) = LOWER(?)');
		binds.push(filters.clientEmail);
	}
	if (filters.dateFrom) {
		where.push('f.created_at >= ?');
		binds.push(filters.dateFrom);
	}
	if (filters.dateTo) {
		where.push('f.created_at <= ?');
		binds.push(filters.dateTo);
	}
	if (filters.mimePrefix) {
		where.push('f.mime_type LIKE ?');
		binds.push(filters.mimePrefix + '%');
	}
	if (filters.source === 'pro') {
		where.push('f.uploaded_by_client = 0');
	} else if (filters.source === 'client') {
		where.push('f.uploaded_by_client = 1');
	}

	if (cursor) {
		where.push('(f.created_at < ? OR (f.created_at = ? AND f.id < ?))');
		binds.push(cursor.createdAt, cursor.createdAt, cursor.id);
	}

	const sql = `
		SELECT ${SELECT_COLUMNS}
		FROM files f
		INNER JOIN transactions t ON f.transaction_id = t.id
		LEFT JOIN checklist_items ci ON f.checklist_item_id = ci.id
		WHERE ${where.join(' AND ')}
		ORDER BY f.created_at DESC, f.id DESC
		LIMIT ?
	`;
	binds.push(limit + 1);

	const result = await db.prepare(sql).bind(...binds).all<VaultFile>();
	const rows = result.results;

	let nextCursor: VaultCursor | null = null;
	if (rows.length > limit) {
		const last = rows[limit - 1];
		rows.length = limit;
		nextCursor = { createdAt: last.created_at, id: last.id };
	}

	return { files: rows, nextCursor };
}

export async function listClientVaultFiles(
	db: D1Database,
	workspaceId: string,
	clientEmail: string,
	excludeTransactionId: string
): Promise<VaultFile[]> {
	const sql = `
		SELECT ${SELECT_COLUMNS}
		FROM files f
		INNER JOIN transactions t ON f.transaction_id = t.id
		LEFT JOIN checklist_items ci ON f.checklist_item_id = ci.id
		WHERE t.workspace_id = ?
		  AND LOWER(t.client_email) = LOWER(?)
		  AND t.id != ?
		ORDER BY f.created_at DESC, f.id DESC
		LIMIT 200
	`;
	const result = await db
		.prepare(sql)
		.bind(workspaceId, clientEmail, excludeTransactionId)
		.all<VaultFile>();
	return result.results;
}

export async function getVaultFilesByIds(
	db: D1Database,
	workspaceId: string,
	fileIds: string[]
): Promise<VaultFile[]> {
	if (fileIds.length === 0) return [];
	const placeholders = fileIds.map(() => '?').join(',');
	const sql = `
		SELECT ${SELECT_COLUMNS}
		FROM files f
		INNER JOIN transactions t ON f.transaction_id = t.id
		LEFT JOIN checklist_items ci ON f.checklist_item_id = ci.id
		WHERE t.workspace_id = ? AND f.id IN (${placeholders})
	`;
	const result = await db
		.prepare(sql)
		.bind(workspaceId, ...fileIds)
		.all<VaultFile>();
	return result.results;
}

export interface VaultStats {
	total_files: number;
	total_size: number;
	pro_count: number;
	client_count: number;
}

export async function getVaultStats(db: D1Database, workspaceId: string): Promise<VaultStats> {
	const sql = `
		SELECT
			COUNT(*) as total_files,
			COALESCE(SUM(f.file_size), 0) as total_size,
			COALESCE(SUM(CASE WHEN f.uploaded_by_client = 0 THEN 1 ELSE 0 END), 0) as pro_count,
			COALESCE(SUM(CASE WHEN f.uploaded_by_client = 1 THEN 1 ELSE 0 END), 0) as client_count
		FROM files f
		INNER JOIN transactions t ON f.transaction_id = t.id
		WHERE t.workspace_id = ?
	`;
	const row = await db.prepare(sql).bind(workspaceId).first<VaultStats>();
	return row ?? { total_files: 0, total_size: 0, pro_count: 0, client_count: 0 };
}
