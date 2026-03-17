/** POST /api/site-audit/report — Generate safety audit PDF report */
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { buildAuditReport } from '$lib/server/audit-report-builder';

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket) throw error(503, 'Storage not available');
	if (!user?.workspaceId) throw error(401, 'Unauthorized');

	const body = await request.json() as { auditId: string };
	if (!body.auditId) throw error(400, 'Missing auditId');

	// Fetch audit with photo note data
	const audit = await db.prepare(
		`SELECT sa.*, pn.r2_key, pn.filename, pn.mime_type,
		        t.title as project_title, w.name as company_name
		 FROM site_audits sa
		 JOIN photo_notes pn ON sa.photo_note_id = pn.id
		 JOIN transactions t ON sa.transaction_id = t.id
		 JOIN workspaces w ON t.workspace_id = w.id
		 WHERE sa.id = ? AND sa.workspace_id = ?`
	).bind(body.auditId, user.workspaceId).first<{
		id: string;
		findings: string | null;
		summary: string | null;
		overall_severity: string | null;
		finding_count: number;
		critical_count: number;
		warning_count: number;
		ai_status: string;
		r2_key: string;
		filename: string;
		mime_type: string;
		project_title: string;
		company_name: string;
	}>();

	if (!audit) throw error(404, 'Audit not found');
	if (audit.ai_status !== 'completed') throw error(400, 'Audit not yet completed');

	// Fetch photo from R2
	let photoData: { imageBytes: ArrayBuffer; mimeType: string; filename: string } | undefined;
	try {
		const object = await bucket.get(audit.r2_key);
		if (object) {
			photoData = {
				imageBytes: await object.arrayBuffer(),
				mimeType: audit.mime_type,
				filename: audit.filename,
			};
		}
	} catch {
		// Photo not available — report will be generated without it
	}

	const pdfBytes = await buildAuditReport({
		projectName: audit.project_title,
		companyName: audit.company_name,
		date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
		summary: audit.summary || '',
		overallSeverity: audit.overall_severity || 'pass',
		findings: audit.findings ? JSON.parse(audit.findings) : [],
		findingCount: audit.finding_count,
		criticalCount: audit.critical_count,
		warningCount: audit.warning_count,
		photo: photoData,
	});

	return new Response(pdfBytes, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="Safety-Audit-${audit.id.slice(0, 8)}.pdf"`,
		},
	});
};
