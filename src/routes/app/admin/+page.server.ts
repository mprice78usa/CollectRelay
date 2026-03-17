import { error, fail } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { hashPassword } from '$lib/server/auth';
import type { PageServerLoad, Actions } from './$types';

interface AdminUser {
	id: string;
	email: string;
	name: string;
	company: string | null;
	created_at: string;
	disabled_at: string | null;
	workspace_id: string;
	industry: string;
	plan_key: string;
	subscription_status: string;
	trial_ends_at: string | null;
	current_period_end: string | null;
	stripe_customer_id: string | null;
	transaction_count: number;
	template_count: number;
}

interface AdminStats {
	totalUsers: number;
	activeTrials: number;
	expiredTrials: number;
	paidUsers: number;
	conversionRate: number;
	totalTransactions: number;
}

function computeStats(users: AdminUser[]): AdminStats {
	const now = Date.now();
	let activeTrials = 0;
	let expiredTrials = 0;
	let paidUsers = 0;
	let totalTransactions = 0;

	for (const u of users) {
		totalTransactions += u.transaction_count || 0;
		if (u.subscription_status === 'active') {
			paidUsers++;
		} else if (u.trial_ends_at) {
			const trialEnd = new Date(u.trial_ends_at).getTime();
			if (trialEnd > now) activeTrials++;
			else expiredTrials++;
		}
	}

	const totalEverTrialed = paidUsers + expiredTrials;
	const conversionRate = totalEverTrialed > 0 ? Math.round((paidUsers / totalEverTrialed) * 100) : 0;

	return {
		totalUsers: users.length,
		activeTrials,
		expiredTrials,
		paidUsers,
		conversionRate,
		totalTransactions
	};
}

function isAdminUser(email: string, platform: App.Platform | undefined): boolean {
	if (dev) return true;
	const adminEmails = platform?.env?.ADMIN_EMAILS || '';
	return adminEmails.split(',').map((e) => e.trim().toLowerCase()).includes(email.toLowerCase());
}

export const load: PageServerLoad = async ({ locals, platform }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');
	if (!isAdminUser(user.email, platform)) throw error(403, 'Access denied');

	const db = platform?.env?.DB;

	if (!db || dev) {
		const now = new Date();
		const mockUsers: AdminUser[] = [
			{
				id: 'dev-user', email: 'dev@collectrelay.com', name: 'Dev User', company: 'Atlas Digital',
				created_at: '2026-02-20T10:00:00Z', disabled_at: null,
				workspace_id: 'dev-workspace', industry: 'real_estate', plan_key: 'free', subscription_status: 'inactive',
				trial_ends_at: new Date(now.getTime() + 10 * 86400000).toISOString(),
				current_period_end: null, stripe_customer_id: null,
				transaction_count: 12, template_count: 4
			},
			{
				id: 'user-2', email: 'sarah@example.com', name: 'Sarah Johnson', company: 'Johnson Realty',
				created_at: '2026-02-25T14:00:00Z', disabled_at: null,
				workspace_id: 'ws-2', industry: 'real_estate', plan_key: 'single', subscription_status: 'active',
				trial_ends_at: null,
				current_period_end: '2026-04-01T00:00:00Z', stripe_customer_id: 'cus_mock_2',
				transaction_count: 45, template_count: 6
			},
			{
				id: 'user-3', email: 'mike@example.com', name: 'Mike Chen', company: null,
				created_at: '2026-03-01T09:00:00Z', disabled_at: null,
				workspace_id: 'ws-3', industry: 'contractors', plan_key: 'free', subscription_status: 'inactive',
				trial_ends_at: new Date(now.getTime() - 2 * 86400000).toISOString(),
				current_period_end: null, stripe_customer_id: null,
				transaction_count: 3, template_count: 3
			}
		];
		return { users: mockUsers, stats: computeStats(mockUsers) };
	}

	const result = await db
		.prepare(
			`SELECT u.id, u.email, u.name, u.company, u.created_at, u.disabled_at,
				w.id as workspace_id, w.industry, w.plan_key, w.subscription_status,
				w.trial_ends_at, w.current_period_end, w.stripe_customer_id,
				(SELECT COUNT(*) FROM transactions WHERE workspace_id = w.id) as transaction_count,
				(SELECT COUNT(*) FROM templates WHERE workspace_id = w.id) as template_count
			 FROM users u
			 JOIN workspace_members wm ON u.id = wm.user_id
			 JOIN workspaces w ON wm.workspace_id = w.id
			 WHERE u.id != 'system'
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
		if (!isAdminUser(user.email, platform)) return fail(403, { error: 'Access denied' });

		const formData = await request.formData();
		const targetUserId = formData.get('userId') as string;
		if (!targetUserId) return fail(400, { error: 'User ID required' });
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
		if (!isAdminUser(user.email, platform)) return fail(403, { error: 'Access denied' });

		const formData = await request.formData();
		const targetUserId = formData.get('userId') as string;
		if (!targetUserId) return fail(400, { error: 'User ID required' });

		await db
			.prepare('UPDATE users SET disabled_at = NULL WHERE id = ?')
			.bind(targetUserId)
			.run();

		return { success: true };
	},

	resetPassword: async ({ request, locals, platform }) => {
		const user = locals.user;
		const db = platform?.env?.DB;
		if (!user || !db) return fail(400, { error: 'Not available' });
		if (!isAdminUser(user.email, platform)) return fail(403, { error: 'Access denied' });

		const formData = await request.formData();
		const targetUserId = formData.get('userId') as string;
		const targetEmail = formData.get('userEmail') as string;
		if (!targetUserId) return fail(400, { error: 'User ID required' });

		// Generate a random 12-character temporary password
		const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
		let tempPassword = '';
		const randomBytes = crypto.getRandomValues(new Uint8Array(12));
		for (let i = 0; i < 12; i++) {
			tempPassword += chars[randomBytes[i] % chars.length];
		}

		const { hash, salt } = await hashPassword(tempPassword);

		await db
			.prepare("UPDATE users SET password_hash = ?, password_salt = ?, updated_at = datetime('now') WHERE id = ?")
			.bind(hash, salt, targetUserId)
			.run();

		return { success: true, action: 'resetPassword', tempPassword, targetEmail: targetEmail || targetUserId };
	},

	deleteUser: async ({ request, locals, platform }) => {
		const user = locals.user;
		const db = platform?.env?.DB;
		if (!user || !db) return fail(400, { error: 'Not available' });
		if (!isAdminUser(user.email, platform)) return fail(403, { error: 'Access denied' });

		const formData = await request.formData();
		const targetUserId = formData.get('userId') as string;
		const workspaceId = formData.get('workspaceId') as string;
		if (!targetUserId || !workspaceId) return fail(400, { error: 'User ID and workspace ID required' });
		if (targetUserId === user.id) return fail(400, { error: 'Cannot delete yourself' });

		// Delete in FK-safe order: children before parents, split into two batches
		// Batch 1: Transaction children (deepest level)
		await db.batch([
			db.prepare('DELETE FROM item_activity WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM activity_seen WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM files WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM comments WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM audit_events WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM voice_notes WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM photo_notes WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM checklist_items WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM client_sessions WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM transaction_custom_fields WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM transaction_collaborators WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM transaction_milestones WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM partner_links WHERE transaction_id IN (SELECT id FROM transactions WHERE workspace_id = ?)').bind(workspaceId),
		]);
		// Batch 2: Transactions, then templates, workspace-level data, workspace, user
		await db.batch([
			db.prepare('DELETE FROM transactions WHERE workspace_id = ?').bind(workspaceId),
			db.prepare('DELETE FROM template_items WHERE template_id IN (SELECT id FROM templates WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM templates WHERE workspace_id = ?').bind(workspaceId),
			db.prepare('DELETE FROM webhook_deliveries WHERE webhook_id IN (SELECT id FROM webhooks WHERE workspace_id = ?)').bind(workspaceId),
			db.prepare('DELETE FROM webhooks WHERE workspace_id = ?').bind(workspaceId),
			db.prepare('DELETE FROM document_library WHERE workspace_id = ?').bind(workspaceId),
			db.prepare('DELETE FROM api_keys WHERE workspace_id = ?').bind(workspaceId),
			db.prepare('DELETE FROM push_subscriptions WHERE workspace_id = ?').bind(workspaceId),
			db.prepare('DELETE FROM workspace_invitations WHERE workspace_id = ?').bind(workspaceId),
			db.prepare('DELETE FROM workspace_members WHERE workspace_id = ?').bind(workspaceId),
			db.prepare('DELETE FROM workspaces WHERE id = ?').bind(workspaceId),
			db.prepare('DELETE FROM users WHERE id = ?').bind(targetUserId),
		]);

		return { success: true, action: 'deleteUser' };
	}
};
