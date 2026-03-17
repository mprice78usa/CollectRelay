/** GET /api/site-audit/[id] — Poll audit status */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const audit = await db.prepare(
		`SELECT id, photo_note_id, transaction_id, findings, summary, overall_severity,
		        finding_count, critical_count, warning_count, ai_status, is_relayed, created_at
		 FROM site_audits
		 WHERE id = ? AND workspace_id = ?`
	).bind(params.id, user.workspaceId).first<{
		id: string;
		photo_note_id: string;
		transaction_id: string;
		findings: string | null;
		summary: string | null;
		overall_severity: string | null;
		finding_count: number;
		critical_count: number;
		warning_count: number;
		ai_status: string;
		is_relayed: number;
		created_at: string;
	}>();

	if (!audit) throw error(404, 'Audit not found');

	let status: string;
	if (audit.ai_status === 'failed') status = 'failed';
	else if (audit.ai_status === 'completed') status = 'completed';
	else status = 'processing';

	return json({
		id: audit.id,
		status,
		photoNoteId: audit.photo_note_id,
		transactionId: audit.transaction_id,
		findings: audit.findings ? JSON.parse(audit.findings) : [],
		summary: audit.summary,
		overallSeverity: audit.overall_severity,
		findingCount: audit.finding_count,
		criticalCount: audit.critical_count,
		warningCount: audit.warning_count,
		isRelayed: audit.is_relayed === 1,
		createdAt: audit.created_at,
	});
};
