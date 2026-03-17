/** POST /api/text-note — Create a text note as a checklist item or document library entry */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const body = await request.json() as {
		destination: 'project' | 'library';
		transactionId?: string;
		title: string;
		content: string;
	};

	if (!body.title?.trim()) throw error(400, 'Title is required');

	if (body.destination === 'project') {
		if (!body.transactionId) throw error(400, 'Transaction ID is required');

		// Verify transaction belongs to workspace
		const txn = await db.prepare(
			'SELECT id FROM transactions WHERE id = ? AND workspace_id = ?'
		).bind(body.transactionId, user.workspaceId).first<{ id: string }>();

		if (!txn) throw error(404, 'Transaction not found');

		// Get max sort order
		const maxSort = await db.prepare(
			'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM checklist_items WHERE transaction_id = ?'
		).bind(body.transactionId).first<{ max_sort: number }>();

		const itemId = generateId();
		await db.prepare(
			`INSERT INTO checklist_items (id, transaction_id, name, description, item_type, required, sort_order, status)
			 VALUES (?, ?, ?, ?, 'document', 0, ?, 'pending')`
		).bind(itemId, body.transactionId, body.title.trim(), body.content?.trim() || null, (maxSort?.max_sort || 0) + 1).run();

		return json({ success: true, id: itemId, destination: 'project' });
	}

	if (body.destination === 'library') {
		const docId = generateId();
		await db.prepare(
			`INSERT INTO document_library (id, workspace_id, category, name, description, is_system, created_by)
			 VALUES (?, ?, 'custom', ?, ?, 0, ?)`
		).bind(docId, user.workspaceId, body.title.trim(), body.content?.trim() || null, user.id).run();

		return json({ success: true, id: docId, destination: 'library' });
	}

	throw error(400, 'Invalid destination');
};
