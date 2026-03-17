/** POST /api/voice-note — Upload voice recording and start processing */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { processVoiceNote } from '$lib/server/voice-processing';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_DURATION = 120; // 2 minutes

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket) throw error(503, 'Storage not available');
	if (!user?.workspaceId) throw error(401, 'Unauthorized');

	const formData = await request.formData();
	const audio = formData.get('audio') as File;
	const transactionId = formData.get('transactionId') as string;
	const durationStr = formData.get('duration') as string;

	if (!audio || !transactionId) {
		throw error(400, 'Missing audio or transactionId');
	}

	if (audio.size > MAX_AUDIO_SIZE) {
		throw error(400, 'Audio file too large (max 25MB)');
	}

	// Verify transaction belongs to user's workspace
	const txn = await db.prepare('SELECT id, title, workspace_id FROM transactions WHERE id = ? AND workspace_id = ?')
		.bind(transactionId, user.workspaceId)
		.first<{ id: string; title: string; workspace_id: string }>();

	if (!txn) throw error(404, 'Transaction not found');

	const noteId = generateId();
	const r2Key = `voice-notes/${transactionId}/${noteId}/recording.webm`;
	const duration = durationStr ? parseInt(durationStr, 10) : null;

	// Upload to R2
	const audioBytes = await audio.arrayBuffer();
	await bucket.put(r2Key, audioBytes, {
		httpMetadata: { contentType: audio.type || 'audio/webm' }
	});

	// Create DB record
	await db.prepare(
		`INSERT INTO voice_notes (id, transaction_id, created_by, r2_key, duration_seconds, file_size, transcript_status, ai_status)
		 VALUES (?, ?, ?, ?, ?, ?, 'pending', 'pending')`
	).bind(noteId, transactionId, user.id, r2Key, duration, audio.size).run();

	// Process in background (transcribe + extract tasks)
	platform?.context?.waitUntil(
		processVoiceNote(platform.env, db, noteId, r2Key, txn.title)
			.catch((err) => console.error('Voice note processing failed:', err))
	);

	return json({ id: noteId, status: 'processing' });
};
