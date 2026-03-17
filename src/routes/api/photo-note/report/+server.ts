/** POST /api/photo-note/report — Generate a site observation report PDF */
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildSiteReport } from '$lib/server/report-builder';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket) throw error(503, 'Storage not available');
	if (!user?.workspaceId) throw error(401, 'Unauthorized');

	const body = await request.json() as {
		transactionId: string;
		photoNoteIds: string[];
		reportTitle: string;
		reportNotes: string;
	};

	if (!body.transactionId || !body.photoNoteIds?.length) {
		throw error(400, 'Missing transactionId or photoNoteIds');
	}

	// Verify transaction belongs to workspace and get project name
	const txn = await db.prepare('SELECT id, title FROM transactions WHERE id = ? AND workspace_id = ?')
		.bind(body.transactionId, user.workspaceId)
		.first<{ id: string; title: string }>();

	if (!txn) throw error(404, 'Transaction not found');

	// Get workspace info for company name
	const workspace = await db.prepare('SELECT name FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ name: string }>();

	// Fetch all selected photo notes
	const placeholders = body.photoNoteIds.map(() => '?').join(', ');
	const notes = await db.prepare(
		`SELECT id, r2_key, filename, mime_type, title, notes, ai_description, created_at
		 FROM photo_notes
		 WHERE id IN (${placeholders}) AND transaction_id = ?
		 ORDER BY created_at`
	).bind(...body.photoNoteIds, body.transactionId).all<{
		id: string;
		r2_key: string;
		filename: string;
		mime_type: string;
		title: string | null;
		notes: string | null;
		ai_description: string | null;
		created_at: string;
	}>();

	if (notes.results.length === 0) {
		throw error(404, 'No photo notes found');
	}

	// Fetch all images from R2
	const photos = [];
	for (const note of notes.results) {
		const object = await bucket.get(note.r2_key);
		if (!object) continue;

		photos.push({
			imageBytes: await object.arrayBuffer(),
			mimeType: note.mime_type || 'image/jpeg',
			title: note.title,
			notes: note.notes,
			aiDescription: note.ai_description,
			createdAt: note.created_at,
		});
	}

	if (photos.length === 0) {
		throw error(404, 'No images could be retrieved');
	}

	// Build PDF
	const pdfBytes = await buildSiteReport({
		reportTitle: body.reportTitle || 'Site Observation Report',
		reportNotes: body.reportNotes || '',
		projectName: txn.title,
		companyName: workspace?.name || 'CollectRelay',
		date: new Date().toLocaleDateString('en-US', {
			month: 'long', day: 'numeric', year: 'numeric'
		}),
		photos,
	});

	return new Response(pdfBytes, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="Site-Report-${Date.now()}.pdf"`,
		},
	});
};
