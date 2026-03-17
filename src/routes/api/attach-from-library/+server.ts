import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createFileRecord } from '$lib/server/db/files';
import { createAuditEvent } from '$lib/server/db/audit';
import { recordItemActivity } from '$lib/server/db/activity';
import { generateId } from '$lib/server/auth';
import { sanitizeFilename } from '$lib/server/sanitize';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;

	if (!db || !bucket) {
		throw error(503, 'Storage not available');
	}

	if (!locals.user?.workspaceId) {
		throw error(401, 'Unauthorized');
	}

	const { documentId, checklistItemId, transactionId } = await request.json();

	if (!documentId || !checklistItemId || !transactionId) {
		throw error(400, 'Missing documentId, checklistItemId, or transactionId');
	}

	// Verify the transaction belongs to this workspace
	const txn = await db
		.prepare('SELECT workspace_id FROM transactions WHERE id = ?')
		.bind(transactionId)
		.first<{ workspace_id: string }>();

	if (!txn || txn.workspace_id !== locals.user.workspaceId) {
		throw error(403, 'Access denied');
	}

	// Fetch the document library item (workspace-owned or SYSTEM)
	const doc = await db
		.prepare(
			"SELECT * FROM document_library WHERE id = ? AND (workspace_id = ? OR workspace_id = 'SYSTEM')"
		)
		.bind(documentId, locals.user.workspaceId)
		.first<{ r2_key: string | null; filename: string | null; file_size: number | null; mime_type: string | null; name: string }>();

	if (!doc) {
		throw error(404, 'Document not found');
	}

	if (!doc.r2_key || !doc.filename) {
		throw error(400, 'This document has no file attached');
	}

	// Copy file from document library to transaction storage
	const sourceObject = await bucket.get(doc.r2_key);
	if (!sourceObject) {
		throw error(404, 'File not found in storage');
	}

	const fileId = generateId();
	const safeName = sanitizeFilename(doc.filename);
	const r2Key = `transactions/${transactionId}/${checklistItemId}/${fileId}/${safeName}`;

	await bucket.put(r2Key, sourceObject.body, {
		httpMetadata: {
			contentType: doc.mime_type || 'application/octet-stream'
		}
	});

	// Create file record
	const recordId = await createFileRecord(db, {
		checklistItemId,
		transactionId,
		uploadedByClient: false,
		filename: safeName,
		r2Key,
		fileSize: doc.file_size || 0,
		mimeType: doc.mime_type || undefined
	});

	// Audit event
	await createAuditEvent(db, {
		transactionId,
		checklistItemId,
		actorType: 'pro',
		actorId: locals.user.id,
		actorName: locals.user.name,
		action: 'file_uploaded',
		detail: `Attached "${doc.name}" from document library`
	}, platform?.env ? { env: platform.env, workspaceId: locals.user.workspaceId, context: platform.context } : undefined);

	// Record activity
	await recordItemActivity(
		db, checklistItemId, transactionId, 'file_uploaded',
		'pro', locals.user.name
	);

	return json({ success: true, id: recordId, filename: safeName });
};
