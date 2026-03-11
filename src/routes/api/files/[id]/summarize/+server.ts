import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileById } from '$lib/server/db/files';
import { summarizeFile, isSummarizableFile } from '$lib/server/ai-summary';

export const POST: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	const ai = platform?.env?.AI;

	if (!db || !ai) {
		throw error(503, 'Service not available');
	}

	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const file = await getFileById(db, params.id);
	if (!file) {
		throw error(404, 'File not found');
	}

	// Verify file belongs to user's workspace
	const txn = await db
		.prepare('SELECT workspace_id FROM transactions WHERE id = ?')
		.bind(file.transaction_id)
		.first<{ workspace_id: string }>();

	if (!txn || txn.workspace_id !== locals.user.workspaceId) {
		throw error(403, 'Access denied');
	}

	if (!file.mime_type || !isSummarizableFile(file.mime_type)) {
		return json({ summary: null, status: 'skipped' });
	}

	await summarizeFile(platform.env, db, file.id, file.r2_key, file.mime_type);

	// Fetch updated record
	const updated = await getFileById(db, file.id);

	return json({
		summary: updated?.ai_summary || null,
		status: updated?.ai_summary_status || 'failed'
	});
};
