import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getFileById } from '$lib/server/db/files';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;

	if (!db || !bucket) {
		throw error(503, 'Storage not available');
	}

	// Auth: Pro user or client session
	if (!locals.user && !locals.clientSession) {
		throw error(401, 'Unauthorized');
	}

	const file = await getFileById(db, params.id);
	if (!file) {
		throw error(404, 'File not found');
	}

	// Authorization: verify the requester has access to this file's transaction
	if (locals.user) {
		// Pro user: verify the file's transaction belongs to their workspace
		const txn = await db
			.prepare('SELECT workspace_id FROM transactions WHERE id = ?')
			.bind(file.transaction_id)
			.first<{ workspace_id: string }>();

		if (!txn || txn.workspace_id !== locals.user.workspaceId) {
			throw error(403, 'Access denied');
		}
	} else if (locals.clientSession) {
		// Client: allow access to files in their current transaction OR
		// to files in any transaction in the same workspace tied to the same client_email
		// (Client Vault — cross-transaction archive for the same client).
		if (file.transaction_id !== locals.clientSession.transactionId) {
			const allowed = await db
				.prepare(
					`SELECT 1 FROM transactions f_t
					 INNER JOIN transactions s_t ON s_t.id = ?
					 WHERE f_t.id = ?
					   AND f_t.workspace_id = s_t.workspace_id
					   AND LOWER(f_t.client_email) = LOWER(?)`
				)
				.bind(locals.clientSession.transactionId, file.transaction_id, locals.clientSession.clientEmail)
				.first();
			if (!allowed) throw error(403, 'Access denied');
		}
	}

	// Fetch from R2
	const object = await bucket.get(file.r2_key);
	if (!object) {
		throw error(404, 'File data not found');
	}

	return new Response(object.body, {
		headers: {
			'Content-Type': file.mime_type || 'application/octet-stream',
			'Content-Disposition': `inline; filename="${file.filename}"`,
			'Content-Length': file.file_size.toString(),
			'Cache-Control': 'private, no-store'
		}
	});
};
