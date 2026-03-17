/** GET /api/daily-log/[id] — Generate Daily Field Log PDF for a transaction */
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildDailyLogReport } from '$lib/server/daily-log-builder';

export const GET: RequestHandler = async ({ params, url, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	// Date filter — defaults to today
	const dateParam = url.searchParams.get('date');
	const logDate = dateParam || new Date().toISOString().split('T')[0];

	// Get transaction info
	const txn = await db.prepare(
		'SELECT id, title FROM transactions WHERE id = ? AND workspace_id = ?'
	).bind(params.id, user.workspaceId).first<{ id: string; title: string }>();

	if (!txn) throw error(404, 'Transaction not found');

	// Get workspace brand/company name
	const ws = await db.prepare(
		'SELECT brand_name, name FROM workspaces WHERE id = ?'
	).bind(user.workspaceId).first<{ brand_name: string | null; name: string }>();
	const companyName = ws?.brand_name || ws?.name || 'CollectRelay';

	// Query notes for this transaction on the given date
	const [voiceResult, photoResult, auditResult] = await Promise.all([
		db.prepare(
			`SELECT id, duration_seconds, transcript, ai_actions, ai_status, created_at
			 FROM voice_notes
			 WHERE transaction_id = ? AND date(created_at) = ?
			 ORDER BY created_at ASC`
		).bind(params.id, logDate).all(),
		db.prepare(
			`SELECT id, r2_key, filename, mime_type, title, notes, ai_description, ai_actions, ai_status, created_at
			 FROM photo_notes
			 WHERE transaction_id = ? AND date(created_at) = ?
			 ORDER BY created_at ASC`
		).bind(params.id, logDate).all(),
		db.prepare(
			`SELECT id, summary, overall_severity, finding_count, critical_count, warning_count, created_at
			 FROM site_audits
			 WHERE transaction_id = ? AND workspace_id = ? AND date(created_at) = ?
			 ORDER BY created_at ASC`
		).bind(params.id, user.workspaceId, logDate).all()
	]);

	const voiceNotes = (voiceResult.results || []) as any[];
	const photoNotes = (photoResult.results || []) as any[];
	const siteAudits = (auditResult.results || []) as any[];

	if (voiceNotes.length === 0 && photoNotes.length === 0 && siteAudits.length === 0) {
		throw error(404, `No field activity found for ${logDate}`);
	}

	// Fetch photo images from R2
	const photoEntries = [];
	for (const photo of photoNotes) {
		let imageBytes: ArrayBuffer | undefined;
		let mimeType: string | undefined;

		if (bucket && photo.r2_key) {
			try {
				const obj = await bucket.get(photo.r2_key);
				if (obj) {
					imageBytes = await obj.arrayBuffer();
					mimeType = photo.mime_type || 'image/jpeg';
				}
			} catch {
				// Skip image if R2 fetch fails
			}
		}

		photoEntries.push({
			id: photo.id,
			title: photo.title,
			notes: photo.notes,
			ai_description: photo.ai_description,
			ai_actions: photo.ai_actions,
			imageBytes,
			mimeType,
			created_at: photo.created_at,
		});
	}

	// Format the date for display
	const displayDate = new Date(logDate + 'T12:00:00Z').toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const generatedAt = new Date().toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	});

	const pdfBytes = await buildDailyLogReport({
		projectName: txn.title,
		companyName,
		date: displayDate,
		generatedAt,
		voiceNotes,
		photoNotes: photoEntries,
		siteAudits,
	});

	const filename = `daily-log-${logDate}.pdf`;

	return new Response(pdfBytes, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Content-Length': pdfBytes.byteLength.toString(),
			'Cache-Control': 'private, no-store',
		},
	});
};
