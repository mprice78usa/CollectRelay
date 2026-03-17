/** POST /api/site-audit — Start a safety/compliance audit on a photo */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { processAudit } from '$lib/server/audit-processing';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db) throw error(503, 'Database not available');
	if (!user?.workspaceId) throw error(401, 'Unauthorized');

	const body = await request.json() as {
		photoNoteId: string;
		transactionId: string;
	};

	if (!body.photoNoteId || !body.transactionId) {
		throw error(400, 'Missing photoNoteId or transactionId');
	}

	// Verify photo note exists and belongs to workspace
	const note = await db.prepare(
		`SELECT pn.id, pn.r2_key, t.title as project_title
		 FROM photo_notes pn
		 JOIN transactions t ON pn.transaction_id = t.id
		 WHERE pn.id = ? AND pn.transaction_id = ? AND t.workspace_id = ?`
	).bind(body.photoNoteId, body.transactionId, user.workspaceId).first<{
		id: string;
		r2_key: string;
		project_title: string;
	}>();

	if (!note) throw error(404, 'Photo note not found');

	const auditId = generateId();

	await db.prepare(
		`INSERT INTO site_audits (id, photo_note_id, transaction_id, created_by, workspace_id, ai_status)
		 VALUES (?, ?, ?, ?, ?, 'pending')`
	).bind(auditId, body.photoNoteId, body.transactionId, user.id, user.workspaceId).run();

	// Process in background
	platform?.context?.waitUntil(
		processAudit(platform.env, db, auditId, note.id, note.r2_key, note.project_title, user.workspaceId)
			.catch((err) => console.error('Audit processing failed:', err))
	);

	return json({ id: auditId, status: 'processing' });
};
