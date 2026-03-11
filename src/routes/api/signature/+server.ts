import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createFileRecord } from '$lib/server/db/files';
import { createAuditEvent } from '$lib/server/db/audit';
import { recordItemActivity } from '$lib/server/db/activity';
import { generateId } from '$lib/server/auth';
import { sanitizeTextInput } from '$lib/server/sanitize';
import { getTransactionWithCreatorEmail } from '$lib/server/db/transactions';
import { sendSubmissionNotification } from '$lib/server/email';
import { getNotificationPrefs } from '$lib/server/db/users';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;

	if (!db || !bucket) {
		throw error(503, 'Storage not available');
	}

	// Auth: client session only
	if (!locals.clientSession) {
		throw error(401, 'Unauthorized');
	}

	const session = locals.clientSession;
	const formData = await request.formData();
	const signatureFile = formData.get('signature') as File;
	const itemId = formData.get('itemId') as string;
	const mode = formData.get('mode') as string;
	const typedName = formData.get('typedName') as string | null;
	const consent = formData.get('consent') as string;

	if (!signatureFile || !itemId || !mode) {
		throw error(400, 'Missing required signature data');
	}

	if (consent !== 'true') {
		throw error(400, 'You must agree to sign electronically');
	}

	// Verify item belongs to this transaction and is a signature type
	const item = await db
		.prepare('SELECT id, name, item_type, status FROM checklist_items WHERE id = ? AND transaction_id = ?')
		.bind(itemId, session.transactionId)
		.first<{ id: string; name: string; item_type: string; status: string }>();

	if (!item || item.item_type !== 'signature') {
		throw error(400, 'Invalid signature item');
	}

	if (item.status === 'accepted' || item.status === 'waived') {
		throw error(400, 'This item has already been completed');
	}

	// Upload signature PNG to R2
	const fileId = generateId();
	const r2Key = `transactions/${session.transactionId}/${itemId}/${fileId}/signature.png`;

	await bucket.put(r2Key, signatureFile.stream(), {
		httpMetadata: { contentType: 'image/png' }
	});

	// Create file record
	const recordId = await createFileRecord(db, {
		checklistItemId: itemId,
		transactionId: session.transactionId,
		uploadedByClient: true,
		filename: 'signature.png',
		r2Key,
		fileSize: signatureFile.size,
		mimeType: 'image/png'
	});

	// Capture legal metadata
	const ipAddress =
		request.headers.get('cf-connecting-ip') ||
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		'unknown';
	const userAgent = request.headers.get('user-agent') || 'unknown';

	const signatureData = JSON.stringify({
		fileId: recordId,
		r2Key,
		mode: mode === 'type' ? 'type' : 'draw',
		typedName: mode === 'type' && typedName ? sanitizeTextInput(typedName, 200) : undefined,
		signerName: session.clientName,
		signerEmail: session.clientEmail,
		ipAddress,
		userAgent,
		signedAt: new Date().toISOString(),
		consentGiven: true
	});

	// Update checklist item: set status to submitted, store signature metadata
	await db
		.prepare("UPDATE checklist_items SET status = 'submitted', signature_data = ?, answer = 'signed' WHERE id = ?")
		.bind(signatureData, itemId)
		.run();

	// Audit event with full legal context
	await createAuditEvent(db, {
		transactionId: session.transactionId,
		checklistItemId: itemId,
		actorType: 'client',
		actorName: session.clientName,
		action: 'signature_submitted',
		detail: `E-signature submitted (${mode} mode) by ${session.clientName} (${session.clientEmail})`,
		ipAddress,
		userAgent
	});

	// Record activity for notification dots
	await recordItemActivity(
		db, itemId, session.transactionId, 'signature_submitted', 'client', session.clientName
	);

	// Notify pro (with preference gating, non-blocking)
	if (platform?.env) {
		try {
			const txnInfo = await getTransactionWithCreatorEmail(db, session.transactionId);
			if (txnInfo && txnInfo.creatorEmail !== session.clientEmail) {
				const prefs = await getNotificationPrefs(db, txnInfo.creatorId);
				if (!prefs || prefs.notify_submissions) {
					const appUrl = platform.env.APP_URL || new URL(request.url).origin;
					await sendSubmissionNotification(platform.env, {
						proEmail: txnInfo.creatorEmail,
						proName: txnInfo.creatorName,
						clientName: session.clientName,
						transactionTitle: txnInfo.transactionTitle,
						itemName: item.name,
						appUrl,
						transactionId: session.transactionId
					});
				}
			}
		} catch (err) {
			console.error('Failed to send signature notification:', err);
		}
	}

	return json({ success: true, fileId: recordId });
};
