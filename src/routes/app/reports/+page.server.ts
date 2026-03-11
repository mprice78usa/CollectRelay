import {
	getPipelineFunnel,
	getCommissionReport,
	getCompletionMetrics,
	getActivityTrends,
	type DateRange
} from '$lib/server/db/reports';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	const db = platform?.env?.DB;
	const user = locals.user;
	const range = (url.searchParams.get('range') as DateRange) || '30d';

	// Validate range
	const validRanges: DateRange[] = ['7d', '30d', '90d', 'all'];
	const safeRange = validRanges.includes(range) ? range : '30d';

	if (!db || !user) {
		// Dev mode: return mock data
		return {
			range: safeRange,
			funnel: {
				draft: 3,
				active: 8,
				in_review: 4,
				completed: 15,
				cancelled: 1,
				draft_value: 450000,
				active_value: 1200000,
				in_review_value: 600000,
				completed_value: 2500000
			},
			commission: {
				completed_commission: 75000,
				pending_commission: 54000,
				forecast_commission: 67500,
				completed_count: 15,
				pending_count: 12
			},
			metrics: {
				avg_days_to_complete: 18,
				avg_items_per_transaction: 6.3,
				total_completed: 15
			},
			trends: [
				{ period: '2025-10', count: 3 },
				{ period: '2025-11', count: 5 },
				{ period: '2025-12', count: 4 },
				{ period: '2026-01', count: 7 },
				{ period: '2026-02', count: 6 },
				{ period: '2026-03', count: 8 }
			]
		};
	}

	const [funnel, commission, metrics, trends] = await Promise.all([
		getPipelineFunnel(db, user.workspaceId, safeRange),
		getCommissionReport(db, user.workspaceId, safeRange),
		getCompletionMetrics(db, user.workspaceId, safeRange),
		getActivityTrends(db, user.workspaceId, safeRange)
	]);

	return { range: safeRange, funnel, commission, metrics, trends };
};
