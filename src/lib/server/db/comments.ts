/** Comment database operations */
import { generateId } from '$server/auth';

export interface DbComment {
	id: string;
	transaction_id: string;
	checklist_item_id: string | null;
	author_type: string; // 'pro' | 'client'
	author_id: string | null;
	author_name: string;
	content: string;
	created_at: string;
}

export async function getCommentsForTransaction(
	db: D1Database,
	transactionId: string
): Promise<DbComment[]> {
	const result = await db
		.prepare('SELECT * FROM comments WHERE transaction_id = ? ORDER BY created_at ASC')
		.bind(transactionId)
		.all<DbComment>();
	return result.results;
}

export async function getCommentsForItem(
	db: D1Database,
	checklistItemId: string
): Promise<DbComment[]> {
	const result = await db
		.prepare('SELECT * FROM comments WHERE checklist_item_id = ? ORDER BY created_at ASC')
		.bind(checklistItemId)
		.all<DbComment>();
	return result.results;
}

export async function addComment(
	db: D1Database,
	data: {
		transactionId: string;
		checklistItemId?: string;
		authorType: 'pro' | 'client';
		authorId?: string;
		authorName: string;
		content: string;
	}
): Promise<string> {
	const id = generateId();
	await db
		.prepare(
			`INSERT INTO comments (id, transaction_id, checklist_item_id, author_type, author_id, author_name, content)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			data.transactionId,
			data.checklistItemId || null,
			data.authorType,
			data.authorId || null,
			data.authorName,
			data.content
		)
		.run();
	return id;
}
