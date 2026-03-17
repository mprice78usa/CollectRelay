/** POST /api/photo-note — Upload photo and optionally start AI analysis */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { processPhotoNote } from '$lib/server/photo-processing';

const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket) throw error(503, 'Storage not available');
	if (!user?.workspaceId) throw error(401, 'Unauthorized');

	const formData = await request.formData();
	const photo = formData.get('photo') as File;
	const transactionId = formData.get('transactionId') as string;
	const title = (formData.get('title') as string) || null;
	const notes = (formData.get('notes') as string) || null;
	const analyzeWithAI = formData.get('analyzeWithAI') === 'true';

	if (!photo || !transactionId) {
		throw error(400, 'Missing photo or transactionId');
	}

	if (photo.size > MAX_PHOTO_SIZE) {
		throw error(400, 'Photo too large (max 10MB)');
	}

	if (!ALLOWED_TYPES.includes(photo.type)) {
		throw error(400, 'Invalid file type. Use JPEG, PNG, or WebP.');
	}

	// Verify transaction belongs to user's workspace
	const txn = await db.prepare('SELECT id, title, workspace_id FROM transactions WHERE id = ? AND workspace_id = ?')
		.bind(transactionId, user.workspaceId)
		.first<{ id: string; title: string; workspace_id: string }>();

	if (!txn) throw error(404, 'Transaction not found');

	const noteId = generateId();
	const ext = photo.name.split('.').pop() || 'jpg';
	const filename = photo.name || `photo.${ext}`;
	const r2Key = `photo-notes/${transactionId}/${noteId}/${filename}`;

	// Upload to R2
	const photoBytes = await photo.arrayBuffer();
	await bucket.put(r2Key, photoBytes, {
		httpMetadata: { contentType: photo.type }
	});

	// Create DB record
	await db.prepare(
		`INSERT INTO photo_notes (id, transaction_id, created_by, r2_key, filename, file_size, mime_type, title, notes, ai_status)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	).bind(noteId, transactionId, user.id, r2Key, filename, photo.size, photo.type, title, notes, analyzeWithAI ? 'pending' : 'none').run();

	// If AI analysis requested, process in background
	if (analyzeWithAI) {
		platform?.context?.waitUntil(
			processPhotoNote(platform.env, db, noteId, r2Key, txn.title)
				.catch((err) => console.error('Photo note processing failed:', err))
		);

		return json({ id: noteId, status: 'processing' });
	}

	// Without AI — create a checklist item directly
	const maxSort = await db.prepare(
		'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM checklist_items WHERE transaction_id = ?'
	).bind(transactionId).first<{ max_sort: number }>();

	const sortOrder = (maxSort?.max_sort || 0) + 1;
	const itemId = generateId();

	await db.prepare(
		`INSERT INTO checklist_items (id, transaction_id, name, description, item_type, required, sort_order, status, photo_note_id)
		 VALUES (?, ?, ?, ?, 'document', 0, ?, 'submitted', ?)`
	).bind(itemId, transactionId, title || 'Site Photo', notes, sortOrder, noteId).run();

	// Also create a file record linked to the checklist item
	const fileId = generateId();
	await db.prepare(
		`INSERT INTO files (id, checklist_item_id, transaction_id, uploaded_by, original_name, r2_key, mime_type, file_size, status)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'uploaded')`
	).bind(fileId, itemId, transactionId, user.id, filename, r2Key, photo.type, photo.size).run();

	return json({ id: noteId, status: 'completed', itemId });
};
