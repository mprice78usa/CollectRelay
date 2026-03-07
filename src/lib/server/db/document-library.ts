/** Document library database operations */
import { generateId } from '$server/auth';

export interface DbDocumentLibraryItem {
	id: string;
	workspace_id: string;
	category: string;
	name: string;
	description: string | null;
	filename: string | null;
	r2_key: string | null;
	file_size: number | null;
	mime_type: string | null;
	is_system: number;
	created_by: string;
	created_at: string;
}

export async function getDocumentLibrary(
	db: D1Database,
	workspaceId: string,
	category?: string
): Promise<DbDocumentLibraryItem[]> {
	// Get workspace docs + system docs, ordered by category then name
	let query = "SELECT * FROM document_library WHERE (workspace_id = ? OR workspace_id = 'SYSTEM')";
	const params: any[] = [workspaceId];
	if (category) {
		query += ' AND category = ?';
		params.push(category);
	}
	query += ' ORDER BY category, name';
	const result = await db.prepare(query).bind(...params).all<DbDocumentLibraryItem>();
	return result.results;
}

export async function addDocumentLibraryItem(
	db: D1Database,
	data: {
		workspaceId: string;
		category: string;
		name: string;
		description?: string;
		filename?: string;
		r2Key?: string;
		fileSize?: number;
		mimeType?: string;
		createdBy: string;
	}
): Promise<string> {
	const id = generateId();
	await db
		.prepare(
			`INSERT INTO document_library (id, workspace_id, category, name, description, filename, r2_key, file_size, mime_type, is_system, created_by)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)`
		)
		.bind(
			id,
			data.workspaceId,
			data.category,
			data.name,
			data.description || null,
			data.filename || null,
			data.r2Key || null,
			data.fileSize || null,
			data.mimeType || null,
			data.createdBy
		)
		.run();
	return id;
}

export async function updateDocumentLibraryFile(
	db: D1Database,
	itemId: string,
	workspaceId: string,
	data: { filename: string; r2Key: string; fileSize: number; mimeType: string }
): Promise<void> {
	await db
		.prepare(
			'UPDATE document_library SET filename = ?, r2_key = ?, file_size = ?, mime_type = ? WHERE id = ? AND workspace_id = ?'
		)
		.bind(data.filename, data.r2Key, data.fileSize, data.mimeType, itemId, workspaceId)
		.run();
}

export async function deleteDocumentLibraryItem(
	db: D1Database,
	itemId: string,
	workspaceId: string
): Promise<void> {
	// Only allow deleting non-system docs owned by the workspace
	await db
		.prepare('DELETE FROM document_library WHERE id = ? AND workspace_id = ? AND is_system = 0')
		.bind(itemId, workspaceId)
		.run();
}
