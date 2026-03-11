import { getReportCsvData, type DateRange } from '$lib/server/db/reports';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, platform, url }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const range = (url.searchParams.get('range') as DateRange) || '30d';
	const validRanges: DateRange[] = ['7d', '30d', '90d', 'all'];
	const safeRange = validRanges.includes(range) ? range : '30d';

	const rows = await getReportCsvData(db, user.workspaceId, safeRange);

	const headers = [
		'ID',
		'Title',
		'Client Name',
		'Client Email',
		'Transaction Type',
		'Status',
		'Sale Price',
		'Commission Rate',
		'Commission Amount',
		'Due Date',
		'Created At',
		'Completed At'
	];

	const csvRows = rows.map((r) =>
		[
			r.id,
			csvEscape(r.title),
			csvEscape(r.client_name),
			csvEscape(r.client_email),
			r.transaction_type,
			r.status,
			r.sale_price ?? '',
			r.commission_rate ?? '',
			r.commission_amount ?? '',
			r.due_date ?? '',
			r.created_at,
			r.completed_at ?? ''
		].join(',')
	);

	const csv = [headers.join(','), ...csvRows].join('\n');
	const filename = `collectrelay-report-${safeRange}-${new Date().toISOString().slice(0, 10)}.csv`;

	return new Response(csv, {
		headers: {
			'Content-Type': 'text/csv',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};

function csvEscape(value: string): string {
	if (!value) return '';
	if (value.includes(',') || value.includes('"') || value.includes('\n')) {
		return `"${value.replace(/"/g, '""')}"`;
	}
	return value;
}
