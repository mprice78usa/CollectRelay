import { getUserById, getWorkspaceForUser, updateUser, updateWorkspace, getBillingInfo, updateNotificationPrefs } from '$lib/server/db/users';
import { getWebhooksForWorkspace } from '$lib/server/db/webhooks';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user) {
		// Dev mode: return mock profile
		return {
			profile: {
				id: 'dev-user',
				email: 'dev@example.com',
				name: 'Dev User',
				company: 'Atlas Digital',
				phone: '555-0100'
			},
			workspace: {
				id: 'dev-workspace',
				name: "Dev User's Workspace",
				role: 'owner'
			},
			billing: {
				planKey: 'free',
				billingInterval: null,
				subscriptionStatus: 'inactive',
				trialEndsAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
				currentPeriodEnd: null,
				isTrialActive: true,
				isTrialExpired: false,
				trialDaysLeft: 10,
				hasActiveSubscription: false
			},
			notificationPrefs: {
				notifySubmissions: 1,
				notifyReviewReminders: 1,
				notifyCompleted: 1
			},
			webhooks: [] as any[]
		};
	}

	const [dbUser, workspace, billing, webhooksRaw] = await Promise.all([
		getUserById(db, user.id),
		getWorkspaceForUser(db, user.id),
		getBillingInfo(db, user.workspaceId),
		getWebhooksForWorkspace(db, user.workspaceId)
	]);

	const webhooks = webhooksRaw.map((w) => ({
		...w,
		secret: w.secret.slice(0, 10) + '...',
		events: JSON.parse(w.events)
	}));

	return {
		profile: {
			id: user.id,
			email: dbUser?.email ?? user.email,
			name: dbUser?.name ?? user.name,
			company: dbUser?.company ?? null,
			phone: dbUser?.phone ?? null
		},
		workspace: workspace ?? { id: user.workspaceId, name: 'My Workspace', role: 'owner' },
		billing,
		notificationPrefs: {
			notifySubmissions: dbUser?.notify_submissions ?? 1,
			notifyReviewReminders: dbUser?.notify_review_reminders ?? 1,
			notifyCompleted: dbUser?.notify_completed ?? 1
		},
		webhooks
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const company = data.get('company')?.toString().trim() || null;
		const phone = data.get('phone')?.toString().trim() || null;

		if (!name) return fail(400, { error: 'Name is required' });

		await updateUser(db, user.id, { name, company: company ?? undefined, phone: phone ?? undefined });

		return { success: true, section: 'profile' };
	},

	updateWorkspace: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();

		if (!name) return fail(400, { error: 'Workspace name is required' });

		await updateWorkspace(db, user.workspaceId, { name });

		return { success: true, section: 'workspace' };
	},

	updateNotificationPrefs: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const notifySubmissions = data.has('notifySubmissions') ? 1 : 0;
		const notifyReviewReminders = data.has('notifyReviewReminders') ? 1 : 0;
		const notifyCompleted = data.has('notifyCompleted') ? 1 : 0;

		await updateNotificationPrefs(db, user.id, {
			notifySubmissions,
			notifyReviewReminders,
			notifyCompleted
		});

		return { success: true, section: 'notifications' };
	}
};
