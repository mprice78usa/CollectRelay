/** File record database operations */
import { generateId } from '$server/auth';

export interface DbFile {
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
	ai_summary: string | null;
	ai_summary_status: string;
}

export async function createFileRecord(
	db: D1Database,
	data: {
		checklistItemId: string;
		transactionId: string;
		uploadedByClient: boolean;
		filename: string;
		r2Key: string;
		fileSize: number;
		mimeType?: string;
	}
): Promise<string> {
	const id = generateId();

	// Get current max version for this checklist item
	const existing = await db
		.prepare('SELECT MAX(version) as max_version FROM files WHERE checklist_item_id = ?')
		.bind(data.checklistItemId)
		.first<{ max_version: number | null }>();

	const version = (existing?.max_version ?? 0) + 1;

	await db
		.prepare(
			`INSERT INTO files (id, checklist_item_id, transaction_id, uploaded_by_client, filename, r2_key, file_size, mime_type, version)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			data.checklistItemId,
			data.transactionId,
			data.uploadedByClient ? 1 : 0,
			data.filename,
			data.r2Key,
			data.fileSize,
			data.mimeType || null,
			version
		)
		.run();

	return id;
}

export async function getFilesForChecklistItem(
	db: D1Database,
	checklistItemId: string
): Promise<DbFile[]> {
	const result = await db
		.prepare('SELECT * FROM files WHERE checklist_item_id = ? ORDER BY version DESC')
		.bind(checklistItemId)
		.all<DbFile>();
	return result.results;
}

export async function getFilesForTransaction(
	db: D1Database,
	transactionId: string
): Promise<DbFile[]> {
	const result = await db
		.prepare('SELECT * FROM files WHERE transaction_id = ? ORDER BY created_at DESC')
		.bind(transactionId)
		.all<DbFile>();
	return result.results;
}

export async function getFileById(
	db: D1Database,
	fileId: string
): Promise<DbFile | null> {
	return db
		.prepare('SELECT * FROM files WHERE id = ?')
		.bind(fileId)
		.first<DbFile>();
}
