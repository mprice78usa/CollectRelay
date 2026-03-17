import { dev } from '$app/environment';
import { workspaceHasTemplates, cloneStarterTemplates } from '$lib/server/db/templates';
import { getBillingInfo } from '$lib/server/db/users';
import { getUnseenCountsForTransactions } from '$lib/server/db/activity';
import { getUnreadNotificationCount } from '$lib/server/db/notifications';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const user = locals.user;
	if (!user) return { user: null, billing: null, isAdmin: false, totalUnseenCount: 0, unreadNotificationCount: 0, industry: null };

	const db = platform?.env?.DB;

	// Load workspace industry (used for terminology + template cloning)
	let industry: string | null = null;
	if (db && user.workspaceId) {
		const ws = await db.prepare('SELECT industry, onboarding_completed FROM workspaces WHERE id = ?')
			.bind(user.workspaceId).first<{ industry: string; onboarding_completed: number }>();
		industry = ws?.industry || null;
		if (ws?.onboarding_completed === 1) {
			const hasTemplates = await workspaceHasTemplates(db, user.workspaceId);
			if (!hasTemplates) {
				await cloneStarterTemplates(db, user.workspaceId, user.id, ws.industry || 'real_estate');
			}
		}
	}

	// Load billing / trial info
	let billing = null;
	if (db && user.workspaceId) {
		billing = await getBillingInfo(db, user.workspaceId);
	} else if (dev) {
		billing = {
			planKey: 'free',
			billingInterval: null,
			subscriptionStatus: 'inactive',
			trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
			currentPeriodEnd: null,
			isTrialActive: true,
			isTrialExpired: false,
			trialDaysLeft: 10,
			hasActiveSubscription: false
		};
	}

	// Check admin status
	const adminEmails = platform?.env?.ADMIN_EMAILS || '';
	const isAdmin =
		dev || adminEmails.split(',').map((e) => e.trim().toLowerCase()).includes(user.email.toLowerCase());

	// Get total unseen activity count for sidebar badge
	let totalUnseenCount = 0;
	if (db && user.workspaceId) {
		try {
			const txnRows = await db
				.prepare("SELECT id FROM transactions WHERE workspace_id = ? AND status NOT IN ('completed', 'cancelled')")
				.bind(user.workspaceId)
				.all<{ id: string }>();
			const txnIds = (txnRows.results || []).map((r) => r.id);
			if (txnIds.length > 0) {
				const unseenMap = await getUnseenCountsForTransactions(db, txnIds, 'pro', user.id);
				for (const count of unseenMap.values()) {
					totalUnseenCount += count;
				}
			}
		} catch {
			// Non-critical — sidebar badge is best-effort
		}
	}

	// Get unread notification count for activity bell badge
	let unreadNotificationCount = 0;
	if (db && user.workspaceId) {
		try {
			unreadNotificationCount = await getUnreadNotificationCount(db, user.workspaceId, user.id);
		} catch {
			// Non-critical
		}
	}

	return { user, billing, isAdmin, totalUnseenCount, unreadNotificationCount, industry };
};
