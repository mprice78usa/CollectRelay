import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createFileRecord } from '$lib/server/db/files';
import { createAuditEvent } from '$lib/server/db/audit';
import { recordItemActivity } from '$lib/server/db/activity';
import { generateId } from '$lib/server/auth';
import { sanitizeFilename } from '$lib/server/sanitize';
import { getTransactionWithCreatorEmail } from '$lib/server/db/transactions';
import { sendSubmissionNotification } from '$lib/server/email';
import { convertImageToPdf, isConvertibleImage } from '$lib/server/pdf-convert';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;

	if (!db || !bucket) {
		throw error(503, 'Storage not available');
	}

	// Auth: either Pro user or client session
	const isClient = !!locals.clientSession;
	const isPro = !!locals.user;

	if (!isClient && !isPro) {
		throw error(401, 'Unauthorized');
	}

	const formData = await request.formData();
	const file = formData.get('file') as File;
	const checklistItemId = formData.get('checklistItemId') as string;
	const transactionId = formData.get('transactionId') as string;

	if (!file || !checklistItemId || !transactionId) {
		throw error(400, 'Missing file, checklistItemId, or transactionId');
	}

	if (file.size > MAX_FILE_SIZE) {
		throw error(413, 'File too large. Maximum size is 50MB.');
	}

	// Authorization: verify the requester has access to this transaction
	if (isPro) {
		const txn = await db
			.prepare('SELECT workspace_id FROM transactions WHERE id = ?')
			.bind(transactionId)
			.first<{ workspace_id: string }>();
		if (!txn || txn.workspace_id !== locals.user!.workspaceId) {
			throw error(403, 'Access denied');
		}
	} else if (isClient) {
		if (transactionId !== locals.clientSession!.transactionId) {
			throw error(403, 'Access denied');
		}
	}

	const fileId = generateId();
	const safeName = sanitizeFilename(file.name);
	const r2Key = `transactions/${transactionId}/${checklistItemId}/${fileId}/${safeName}`;

	// Upload to R2
	await bucket.put(r2Key, file.stream(), {
		httpMetadata: {
			contentType: file.type || 'application/octet-stream'
		}
	});

	// Create DB record
	const recordId = await createFileRecord(db, {
		checklistItemId,
		transactionId,
		uploadedByClient: isClient,
		filename: safeName,
		r2Key,
		fileSize: file.size,
		mimeType: file.type || undefined
	});

	// Auto-convert image uploads to PDF (non-blocking)
	if (isConvertibleImage(file.type)) {
		try {
			const imageBytes = await file.arrayBuffer();
			const pdfBytes = await convertImageToPdf(imageBytes, file.type);
			const pdfName = safeName.replace(/\.(jpg|jpeg|png)$/i, '.pdf');
			const pdfR2Key = `transactions/${transactionId}/${checklistItemId}/${fileId}/${pdfName}`;

			await bucket.put(pdfR2Key, pdfBytes, {
				httpMetadata: { contentType: 'application/pdf' }
			});

			await createFileRecord(db, {
				checklistItemId,
				transactionId,
				uploadedByClient: isClient,
				filename: pdfName,
				r2Key: pdfR2Key,
				fileSize: pdfBytes.byteLength,
				mimeType: 'application/pdf'
			});
		} catch (err) {
			console.error('Image-to-PDF conversion failed:', err);
		}
	}

	// Update checklist item status to submitted (only for client uploads — pro uploads don't change status)
	if (isClient) {
		await db
			.prepare("UPDATE checklist_items SET status = 'submitted' WHERE id = ? AND status IN ('pending', 'rejected')")
			.bind(checklistItemId)
			.run();
	}

	// Audit event
	await createAuditEvent(db, {
		transactionId,
		checklistItemId,
		actorType: isClient ? 'client' : 'pro',
		actorId: isClient ? undefined : locals.user?.id,
		actorName: isClient ? locals.clientSession!.clientName : locals.user!.name,
		action: 'file_uploaded',
		detail: `Uploaded "${safeName}" (${(file.size / 1024).toFixed(1)} KB)`
	});

	// Record activity for notification dots
	await recordItemActivity(
		db, checklistItemId, transactionId, 'file_uploaded',
		isClient ? 'client' : 'pro',
		isClient ? locals.clientSession!.clientName : locals.user!.name
	);

	// Notify pro when client uploads a file (non-blocking)
	if (isClient && platform?.env) {
		try {
			const txnInfo = await getTransactionWithCreatorEmail(db, transactionId);
			const item = await db
				.prepare('SELECT name FROM checklist_items WHERE id = ?')
				.bind(checklistItemId)
				.first<{ name: string }>();
			// Skip self-notification (pro testing as client in same browser)
			if (txnInfo && item && txnInfo.creatorEmail !== locals.clientSession!.clientEmail) {
				const appUrl = platform.env.APP_URL || new URL(request.url).origin;
				await sendSubmissionNotification(platform.env, {
					proEmail: txnInfo.creatorEmail,
					proName: txnInfo.creatorName,
					clientName: locals.clientSession!.clientName,
					transactionTitle: txnInfo.transactionTitle,
					itemName: item.name,
					appUrl,
					transactionId
				});
			}
		} catch (err) {
			console.error('Failed to send submission notification:', err);
		}
	}

	return json({ id: recordId, filename: safeName, size: file.size });
};
