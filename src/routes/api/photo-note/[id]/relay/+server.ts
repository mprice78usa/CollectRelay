/** POST /api/photo-note/[id]/relay — Confirm and create tasks from AI photo analysis */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { recordItemActivity } from '$lib/server/db/activity';

export const POST: RequestHandler = async ({ params, request, platform, locals }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const body = await request.json() as {
		actions: Array<{ task: string; priority?: string }>;
		summary?: string;
	};

	if (!body.actions || !Array.isArray(body.actions) || body.actions.length === 0) {
		throw error(400, 'No actions provided');
	}

	// Verify photo note belongs to user's workspace
	const note = await db.prepare(
		`SELECT pn.id, pn.transaction_id, pn.ai_status, pn.is_relayed, pn.ai_actions
		 FROM photo_notes pn
		 JOIN transactions t ON pn.transaction_id = t.id
		 WHERE pn.id = ? AND t.workspace_id = ?`
	).bind(params.id, user.workspaceId).first<{
		id: string;
		transaction_id: string;
		ai_status: string;
		is_relayed: number;
		ai_actions: string | null;
	}>();

	if (!note) throw error(404, 'Photo note not found');

	// If summary was edited, update ai_actions JSON
	if (body.summary !== undefined && note.ai_actions) {
		try {
			const existing = JSON.parse(note.ai_actions);
			existing.summary = body.summary;
			await db.prepare('UPDATE photo_notes SET ai_actions = ? WHERE id = ?')
				.bind(JSON.stringify(existing), note.id).run();
		} catch {
			// Non-critical
		}
	}

	// Get the current max sort_order
	const maxSort = await db.prepare(
		'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM checklist_items WHERE transaction_id = ?'
	).bind(note.transaction_id).first<{ max_sort: number }>();

	let sortOrder = (maxSort?.max_sort || 0) + 1;

	// Create checklist items for each confirmed action with photo_note_id link
	const statements: D1PreparedStatement[] = [];
	const itemIds: string[] = [];

	for (const action of body.actions) {
		const itemId = generateId();
		itemIds.push(itemId);

		statements.push(
			db.prepare(
				`INSERT INTO checklist_items (id, transaction_id, name, description, item_type, required, sort_order, status, photo_note_id)
				 VALUES (?, ?, ?, ?, 'document', 1, ?, 'pending', ?)`
			).bind(itemId, note.transaction_id, action.task, action.priority ? `Priority: ${action.priority}` : null, sortOrder++, note.id)
		);
	}

	// Mark photo note as relayed
	statements.push(
		db.prepare('UPDATE photo_notes SET is_relayed = 1 WHERE id = ?').bind(note.id)
	);

	await db.batch(statements);

	// Record activity
	try {
		await recordItemActivity(db, {
			transactionId: note.transaction_id,
			checklistItemId: itemIds[0],
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'status_changed',
			detail: `Photo analysis relayed: ${body.actions.length} task${body.actions.length === 1 ? '' : 's'} added`
		});
	} catch {
		// Non-critical
	}

	return json({ success: true, items_created: body.actions.length });
};
