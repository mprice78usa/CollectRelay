/** GET /api/site-audit/history — Audit history for a transaction */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, platform, locals }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const transactionId = url.searchParams.get('transactionId');
	if (!transactionId) throw error(400, 'Missing transactionId');

	const audits = await db.prepare(
		`SELECT sa.id, sa.photo_note_id, sa.summary, sa.overall_severity,
		        sa.finding_count, sa.critical_count, sa.warning_count,
		        sa.ai_status, sa.is_relayed, sa.created_at,
		        pn.filename, pn.r2_key
		 FROM site_audits sa
		 JOIN photo_notes pn ON sa.photo_note_id = pn.id
		 WHERE sa.transaction_id = ? AND sa.workspace_id = ?
		 ORDER BY sa.created_at DESC`
	).bind(transactionId, user.workspaceId).all<{
		id: string;
		photo_note_id: string;
		summary: string | null;
		overall_severity: string | null;
		finding_count: number;
		critical_count: number;
		warning_count: number;
		ai_status: string;
		is_relayed: number;
		created_at: string;
		filename: string;
		r2_key: string;
	}>();

	return json({
		audits: (audits.results || []).map(a => ({
			id: a.id,
			photoNoteId: a.photo_note_id,
			summary: a.summary,
			overallSeverity: a.overall_severity,
			findingCount: a.finding_count,
			criticalCount: a.critical_count,
			warningCount: a.warning_count,
			status: a.ai_status,
			isRelayed: a.is_relayed === 1,
			createdAt: a.created_at,
			filename: a.filename,
		}))
	});
};
