/** GET /api/photo-note/[id] — Poll photo note AI analysis status */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const note = await db.prepare(
		`SELECT pn.id, pn.title, pn.notes, pn.ai_description, pn.ai_actions, pn.ai_status,
		        pn.r2_key, pn.filename, pn.is_relayed, pn.created_at
		 FROM photo_notes pn
		 JOIN transactions t ON pn.transaction_id = t.id
		 WHERE pn.id = ? AND t.workspace_id = ?`
	).bind(params.id, user.workspaceId).first<{
		id: string;
		title: string | null;
		notes: string | null;
		ai_description: string | null;
		ai_actions: string | null;
		ai_status: string;
		r2_key: string;
		filename: string;
		is_relayed: number;
		created_at: string;
	}>();

	if (!note) throw error(404, 'Photo note not found');

	// Determine overall status
	let status: string;
	if (note.ai_status === 'failed') {
		status = 'failed';
	} else if (note.ai_status === 'completed') {
		status = 'completed';
	} else {
		status = 'processing';
	}

	return json({
		id: note.id,
		status,
		title: note.title,
		notes: note.notes,
		ai_description: note.ai_description,
		actions: note.ai_actions ? JSON.parse(note.ai_actions) : null,
		ai_status: note.ai_status,
		r2_key: note.r2_key,
		filename: note.filename,
		is_relayed: note.is_relayed === 1,
		created_at: note.created_at,
	});
};
