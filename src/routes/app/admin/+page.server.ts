import { error, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { PageServerLoad, Actions } from './$types';

interface AdminUser {
	id: string;
	email: string;
	name: string;
	company: string | null;
	created_at: string;
	disabled_at: string | null;
	workspace_id: string;
	plan_key: string;
	subscription_status: string;
	trial_ends_at: string | null;
	current_period_end: string | null;
	stripe_customer_id: string | null;
}

interface AdminStats {
	totalUsers: number;
	activeTrials: number;
	expiredTrials: number;
	paidUsers: number;
	conversionRate: number;
}

function computeStats(users: AdminUser[]): AdminStats {
	const now = Date.now();
	let activeTrials = 0;
	let expiredTrials = 0;
	let paidUsers = 0;

	for (const u of users) {
		if (u.subscription_status === 'active') {
			paidUsers++;
		} else if (u.trial_ends_at) {
			const trialEnd = new Date(u.trial_ends_at).getTime();
			if (trialEnd > now) activeTrials++;
			else expiredTrials++;
		}
	}

	const totalEverTrialed = paidUsers + expiredTrials; // users who completed or expired trial
	const conversionRate = totalEverTrialed > 0 ? Math.round((paidUsers / totalEverTrialed) * 100) : 0;

	return {
		totalUsers: users.length,
		activeTrials,
		expiredTrials,
		paidUsers,
		conversionRate
	};
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	// Admin check
	if (!dev) {
		const adminEmails = platform?.env?.ADMIN_EMAILS || '';
		const isAdmin = adminEmails.split(',').map((e) => e.trim().toLowerCase()).includes(user.email.toLowerCase());
		if (!isAdmin) throw error(403, 'Access denied');
	}

	const db = platform?.env?.DB;

	if (!db || dev) {
		// Dev mode mock
		const now = new Date();
		const mockUsers: AdminUser[] = [
			{
				id: 'dev-user', email: 'dev@collectrelay.com', name: 'Dev User', company: 'Atlas Digital',
				created_at: '2026-02-20T10:00:00Z', disabled_at: null,
				workspace_id: 'dev-workspace', plan_key: 'free', subscription_status: 'inactive',
				trial_ends_at: new Date(now.getTime() + 10 * 86400000).toISOString(),
				current_period_end: null, stripe_customer_id: null
			},
			{
				id: 'user-2', email: 'sarah@example.com', name: 'Sarah Johnson', company: 'Johnson Realty',
				created_at: '2026-02-25T14:00:00Z', disabled_at: null,
				workspace_id: 'ws-2', plan_key: 'single', subscription_status: 'active',
				trial_ends_at: null,
				current_period_end: '2026-04-01T00:00:00Z', stripe_customer_id: 'cus_mock_2'
			},
			{
				id: 'user-3', email: 'mike@example.com', name: 'Mike Chen', company: null,
				created_at: '2026-03-01T09:00:00Z', disabled_at: null,
				workspace_id: 'ws-3', plan_key: 'free', subscription_status: 'inactive',
				trial_ends_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
				current_period_end: null, stripe_customer_id: null
			}
		];
		return { users: mockUsers, stats: computeStats(mockUsers) };
	}

	const result = await db
		.prepare(
			`SELECT u.id, u.email, u.name, u.company, u.created_at, u.disabled_at,
				w.id as workspace_id, w.plan_key, w.subscription_status,
				w.trial_ends_at, w.current_period_end, w.stripe_customer_id
			 FROM users u
			 JOIN workspace_members wm ON u.id = wm.user_id
			 JOIN workspaces w ON wm.workspace_id = w.id
			 ORDER BY u.created_at DESC`
		)
		.all<AdminUser>();

	const users = result.results || [];
	return { users, stats: computeStats(users) };
};

export const actions: Actions = {
	revokeUser: async ({ request, locals, platform }) => {
		const user = locals.user;
		const db = platform?.env?.DB;
		if (!user || !db) return fail(400, { error: 'Not available' });

		// Admin check
		if (!dev) {
			const adminEmails = platform?.env?.ADMIN_EMAILS || '';
			const isAdmin = adminEmails.split(',').map((e) => e.trim().toLowerCase()).includes(user.email.toLowerCase());
			if (!isAdmin) return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const targetUserId = formData.get('userId') as string;
		if (!targetUserId) return fail(400, { error: 'User ID required' });

		// Prevent revoking yourself
		if (targetUserId === user.id) return fail(400, { error: 'Cannot revoke yourself' });

		await db
			.prepare("UPDATE users SET disabled_at = datetime('now') WHERE id = ?")
			.bind(targetUserId)
			.run();

		return { success: true };
	},

	restoreUser: async ({ request, locals, platform }) => {
		const user = locals.user;
		const db = platform?.env?.DB;
		if (!user || !db) return fail(400, { error: 'Not available' });

		if (!dev) {
			const adminEmails = platform?.env?.ADMIN_EMAILS || '';
			const isAdmin = adminEmails.split(',').map((e) => e.trim().toLowerCase()).includes(user.email.toLowerCase());
			if (!isAdmin) return fail(403, { error: 'Access denied' });
		}

		const formData = await request.formData();
		const targetUserId = formData.get('userId') as string;
		if (!targetUserId) return fail(400, { error: 'User ID required' });

		await db
			.prepare('UPDATE users SET disabled_at = NULL WHERE id = ?')
			.bind(targetUserId)
			.run();

		return { success: true };
	}
};
