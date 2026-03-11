/**
 * Reporting & analytics aggregate queries.
 * All queries filter by workspace_id and support date range filtering.
 */

export type DateRange = '7d' | '30d' | '90d' | 'all';

export interface PipelineFunnel {
	draft: number;
	active: number;
	in_review: number;
	completed: number;
	cancelled: number;
	draft_value: number;
	active_value: number;
	in_review_value: number;
	completed_value: number;
}

export interface CommissionReport {
	completed_commission: number;
	pending_commission: number;
	forecast_commission: number;
	completed_count: number;
	pending_count: number;
}

export interface CompletionMetrics {
	avg_days_to_complete: number | null;
	avg_items_per_transaction: number;
	total_completed: number;
}

export interface ActivityTrend {
	period: string;
	count: number;
}

export interface CsvRow {
	id: string;
	title: string;
	client_name: string;
	client_email: string;
	transaction_type: string;
	status: string;
	sale_price: number | null;
	commission_rate: number | null;
	commission_amount: number | null;
	due_date: string | null;
	created_at: string;
	completed_at: string | null;
}

/**
 * Convert a date range to an ISO cutoff string, or null for 'all'.
 */
export function dateRangeToISO(range: DateRange): string | null {
	if (range === 'all') return null;
	const now = new Date();
	const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
	now.setDate(now.getDate() - days);
	return now.toISOString();
}

export async function getPipelineFunnel(
	db: D1Database,
	workspaceId: string,
	range: DateRange
): Promise<PipelineFunnel> {
	const cutoff = dateRangeToISO(range);
	const dateFilter = cutoff ? ' AND created_at >= ?' : '';
	const binds = cutoff ? [workspaceId, cutoff] : [workspaceId];

	const result = await db
		.prepare(
			`SELECT
				COALESCE(SUM(CASE WHEN status='draft' THEN 1 ELSE 0 END), 0) as draft,
				COALESCE(SUM(CASE WHEN status='active' THEN 1 ELSE 0 END), 0) as active,
				COALESCE(SUM(CASE WHEN status='in_review' THEN 1 ELSE 0 END), 0) as in_review,
				COALESCE(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END), 0) as completed,
				COALESCE(SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END), 0) as cancelled,
				COALESCE(SUM(CASE WHEN status='draft' THEN sale_price ELSE 0 END), 0) as draft_value,
				COALESCE(SUM(CASE WHEN status='active' THEN sale_price ELSE 0 END), 0) as active_value,
				COALESCE(SUM(CASE WHEN status='in_review' THEN sale_price ELSE 0 END), 0) as in_review_value,
				COALESCE(SUM(CASE WHEN status='completed' THEN sale_price ELSE 0 END), 0) as completed_value
			FROM transactions
			WHERE workspace_id = ?${dateFilter}`
		)
		.bind(...binds)
		.first<PipelineFunnel>();

	return result || {
		draft: 0, active: 0, in_review: 0, completed: 0, cancelled: 0,
		draft_value: 0, active_value: 0, in_review_value: 0, completed_value: 0
	};
}

export async function getCommissionReport(
	db: D1Database,
	workspaceId: string,
	range: DateRange
): Promise<CommissionReport> {
	const cutoff = dateRangeToISO(range);
	const dateFilter = cutoff ? ' AND created_at >= ?' : '';
	const binds = cutoff ? [workspaceId, cutoff] : [workspaceId];

	const result = await db
		.prepare(
			`SELECT
				COALESCE(SUM(CASE WHEN status='completed' THEN commission_amount ELSE 0 END), 0) as completed_commission,
				COALESCE(SUM(CASE WHEN status IN ('active','in_review') THEN commission_amount ELSE 0 END), 0) as pending_commission,
				COALESCE(SUM(CASE WHEN status IN ('active','in_review','draft') THEN commission_amount ELSE 0 END), 0) as forecast_commission,
				COALESCE(SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END), 0) as completed_count,
				COALESCE(SUM(CASE WHEN status IN ('active','in_review') THEN 1 ELSE 0 END), 0) as pending_count
			FROM transactions
			WHERE workspace_id = ?${dateFilter}`
		)
		.bind(...binds)
		.first<CommissionReport>();

	return result || {
		completed_commission: 0, pending_commission: 0, forecast_commission: 0,
		completed_count: 0, pending_count: 0
	};
}

export async function getCompletionMetrics(
	db: D1Database,
	workspaceId: string,
	range: DateRange
): Promise<CompletionMetrics> {
	const cutoff = dateRangeToISO(range);
	const dateFilter = cutoff ? ' AND created_at >= ?' : '';
	const binds = cutoff ? [workspaceId, cutoff] : [workspaceId];

	// Avg days to complete + total completed
	const timeResult = await db
		.prepare(
			`SELECT
				AVG(ROUND(julianday(completed_at) - julianday(created_at))) as avg_days_to_complete,
				COUNT(*) as total_completed
			FROM transactions
			WHERE workspace_id = ? AND status = 'completed' AND completed_at IS NOT NULL${dateFilter}`
		)
		.bind(...binds)
		.first<{ avg_days_to_complete: number | null; total_completed: number }>();

	// Avg items per transaction
	const itemResult = await db
		.prepare(
			`SELECT AVG(cnt) as avg_items FROM (
				SELECT COUNT(*) as cnt FROM checklist_items ci
				JOIN transactions t ON ci.transaction_id = t.id
				WHERE t.workspace_id = ?${dateFilter}
				GROUP BY ci.transaction_id
			)`
		)
		.bind(...binds)
		.first<{ avg_items: number | null }>();

	return {
		avg_days_to_complete: timeResult?.avg_days_to_complete ? Math.round(timeResult.avg_days_to_complete) : null,
		avg_items_per_transaction: Math.round((itemResult?.avg_items || 0) * 10) / 10,
		total_completed: timeResult?.total_completed || 0
	};
}

export async function getActivityTrends(
	db: D1Database,
	workspaceId: string,
	range: DateRange
): Promise<ActivityTrend[]> {
	const cutoff = dateRangeToISO(range);
	const dateFilter = cutoff ? ' AND created_at >= ?' : '';
	const binds = cutoff ? [workspaceId, cutoff] : [workspaceId];

	// Use weekly for short ranges, monthly for longer
	const groupBy = range === '7d' ? "strftime('%Y-W%W', created_at)" : "strftime('%Y-%m', created_at)";

	const result = await db
		.prepare(
			`SELECT ${groupBy} as period, COUNT(*) as count
			FROM transactions
			WHERE workspace_id = ?${dateFilter}
			GROUP BY period ORDER BY period`
		)
		.bind(...binds)
		.all<ActivityTrend>();

	return result.results;
}

export async function getReportCsvData(
	db: D1Database,
	workspaceId: string,
	range: DateRange
): Promise<CsvRow[]> {
	const cutoff = dateRangeToISO(range);
	const dateFilter = cutoff ? ' AND created_at >= ?' : '';
	const binds = cutoff ? [workspaceId, cutoff] : [workspaceId];

	const result = await db
		.prepare(
			`SELECT id, title, client_name, client_email, transaction_type, status,
				sale_price, commission_rate, commission_amount, due_date, created_at, completed_at
			FROM transactions
			WHERE workspace_id = ?${dateFilter}
			ORDER BY created_at DESC`
		)
		.bind(...binds)
		.all<CsvRow>();

	return result.results;
}
