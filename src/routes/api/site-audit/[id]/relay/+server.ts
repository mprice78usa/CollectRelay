/** POST /api/site-audit/[id]/relay — Create high-priority tasks from audit findings */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateId } from '$lib/server/auth';
import { recordItemActivity } from '$lib/server/db/activity';

export const POST: RequestHandler = async ({ params, request, platform, locals }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const body = await request.json() as {
		findings: Array<{
			code: string;
			description: string;
			recommendation: string;
			severity: string;
			category: string;
		}>;
	};

	if (!body.findings || !Array.isArray(body.findings) || body.findings.length === 0) {
		throw error(400, 'No findings provided');
	}

	// Verify audit belongs to workspace
	const audit = await db.prepare(
		`SELECT id, transaction_id, photo_note_id FROM site_audits
		 WHERE id = ? AND workspace_id = ?`
	).bind(params.id, user.workspaceId).first<{
		id: string;
		transaction_id: string;
		photo_note_id: string;
	}>();

	if (!audit) throw error(404, 'Audit not found');

	// Get max sort order
	const maxSort = await db.prepare(
		'SELECT COALESCE(MAX(sort_order), 0) as max_sort FROM checklist_items WHERE transaction_id = ?'
	).bind(audit.transaction_id).first<{ max_sort: number }>();

	let sortOrder = (maxSort?.max_sort || 0) + 1;

	const statements: D1PreparedStatement[] = [];
	const itemIds: string[] = [];

	for (const finding of body.findings) {
		const itemId = generateId();
		itemIds.push(itemId);

		const name = `[${finding.code}] ${finding.description}`;
		const description = `Severity: ${finding.severity.toUpperCase()}\nCategory: ${finding.category}\n\nRecommendation: ${finding.recommendation}`;

		statements.push(
			db.prepare(
				`INSERT INTO checklist_items (id, transaction_id, name, description, item_type, required, sort_order, status, photo_note_id)
				 VALUES (?, ?, ?, ?, 'document', 1, ?, 'pending', ?)`
			).bind(itemId, audit.transaction_id, name, description, sortOrder++, audit.photo_note_id)
		);
	}

	// Mark audit as relayed
	statements.push(
		db.prepare('UPDATE site_audits SET is_relayed = 1 WHERE id = ?').bind(audit.id)
	);

	await db.batch(statements);

	// Record activity
	try {
		await recordItemActivity(db, {
			transactionId: audit.transaction_id,
			checklistItemId: itemIds[0],
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'status_changed',
			detail: `Safety audit relayed: ${body.findings.length} finding${body.findings.length === 1 ? '' : 's'} added as tasks`
		});
	} catch {
		// Non-critical
	}

	return json({ success: true, items_created: body.findings.length });
};
