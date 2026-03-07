import { getUserById, getWorkspaceForUser, updateUser, updateWorkspace, getBillingInfo } from '$lib/server/db/users';
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
			}
		};
	}

	const [dbUser, workspace, billing] = await Promise.all([
		getUserById(db, user.id),
		getWorkspaceForUser(db, user.id),
		getBillingInfo(db, user.workspaceId)
	]);

	return {
		profile: {
			id: user.id,
			email: dbUser?.email ?? user.email,
			name: dbUser?.name ?? user.name,
			company: dbUser?.company ?? null,
			phone: dbUser?.phone ?? null
		},
		workspace: workspace ?? { id: user.workspaceId, name: 'My Workspace', role: 'owner' },
		billing
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
	}
};
