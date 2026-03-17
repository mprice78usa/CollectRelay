import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;

	if (!db || !bucket) {
		throw error(503, 'Storage not available');
	}

	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	// Fetch document entry — allow workspace-owned docs and system docs
	const doc = await db
		.prepare(
			"SELECT * FROM document_library WHERE id = ? AND (workspace_id = ? OR workspace_id = 'SYSTEM')"
		)
		.bind(params.id, locals.user.workspaceId)
		.first<{ r2_key: string | null; filename: string | null; file_size: number | null; mime_type: string | null }>();

	if (!doc) {
		throw error(404, 'Document not found');
	}

	if (!doc.r2_key || !doc.filename) {
		throw error(404, 'No file attached to this document');
	}

	const object = await bucket.get(doc.r2_key);
	if (!object) {
		throw error(404, 'File not found in storage');
	}

	return new Response(object.body, {
		headers: {
			'Content-Type': doc.mime_type || 'application/octet-stream',
			'Content-Disposition': `attachment; filename="${doc.filename}"`,
			'Content-Length': doc.file_size?.toString() || '0',
			'Cache-Control': 'private, no-store'
		}
	});
};
