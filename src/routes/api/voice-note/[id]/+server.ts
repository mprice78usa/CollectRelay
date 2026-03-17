/** GET /api/voice-note/[id] — Poll voice note processing status */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const note = await db.prepare(
		`SELECT vn.id, vn.transcript, vn.transcript_status, vn.ai_actions, vn.ai_status,
		        vn.duration_seconds, vn.is_relayed, vn.created_at
		 FROM voice_notes vn
		 JOIN transactions t ON vn.transaction_id = t.id
		 WHERE vn.id = ? AND t.workspace_id = ?`
	).bind(params.id, user.workspaceId).first<{
		id: string;
		transcript: string | null;
		transcript_status: string;
		ai_actions: string | null;
		ai_status: string;
		duration_seconds: number | null;
		is_relayed: number;
		created_at: string;
	}>();

	if (!note) throw error(404, 'Voice note not found');

	// Determine overall status
	let status: string;
	if (note.transcript_status === 'failed' || note.ai_status === 'failed') {
		status = 'failed';
	} else if (note.ai_status === 'completed') {
		status = 'completed';
	} else {
		status = 'processing';
	}

	return json({
		id: note.id,
		status,
		transcript: note.transcript,
		transcript_status: note.transcript_status,
		actions: note.ai_actions ? JSON.parse(note.ai_actions) : null,
		ai_status: note.ai_status,
		duration_seconds: note.duration_seconds,
		is_relayed: note.is_relayed === 1,
		created_at: note.created_at,
	});
};
