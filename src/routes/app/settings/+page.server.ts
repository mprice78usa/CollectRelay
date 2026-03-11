import { getUserById, getWorkspaceForUser, updateUser, updateWorkspace, getBillingInfo, updateNotificationPrefs, getWorkspaceBranding } from '$lib/server/db/users';
import { getApiKeysForWorkspace } from '$lib/server/db/api-keys';
import { getWebhooksForWorkspace } from '$lib/server/db/webhooks';
import { getWorkspaceMembers, getPendingInvitations, createInvitation, updateMemberRole, removeMember, revokeInvitation, resendInvitation } from '$lib/server/db/team';
import { sendTeamInviteEmail } from '$lib/server/email';
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
			branding: {
				brand_logo_r2_key: null as string | null,
				brand_color: null as string | null,
				brand_name: null as string | null
			},
			webhooks: [] as any[],
			apiKeys: [] as any[],
			members: [
				{ userId: 'dev-user', name: 'Dev User', email: 'dev@example.com', role: 'owner', joinedAt: new Date().toISOString() }
			],
			invitations: [] as any[]
		};
	}

	const [dbUser, workspace, billing, webhooksRaw, branding, apiKeys, members, invitations] = await Promise.all([
		getUserById(db, user.id),
		getWorkspaceForUser(db, user.id),
		getBillingInfo(db, user.workspaceId),
		getWebhooksForWorkspace(db, user.workspaceId),
		getWorkspaceBranding(db, user.workspaceId),
		getApiKeysForWorkspace(db, user.workspaceId),
		getWorkspaceMembers(db, user.workspaceId),
		getPendingInvitations(db, user.workspaceId)
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
		branding: branding ?? { brand_logo_r2_key: null, brand_color: null, brand_name: null },
		notificationPrefs: {
			notifySubmissions: dbUser?.notify_submissions ?? 1,
			notifyReviewReminders: dbUser?.notify_review_reminders ?? 1,
			notifyCompleted: dbUser?.notify_completed ?? 1
		},
		webhooks,
		apiKeys,
		members,
		invitations
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
	},

	updateBranding: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const brandColor = data.get('brandColor')?.toString().trim() || null;
		const brandName = data.get('brandName')?.toString().trim() || null;

		// Validate hex color if provided
		if (brandColor && !/^#[0-9a-fA-F]{6}$/.test(brandColor)) {
			return fail(400, { error: 'Invalid color format. Use hex (e.g. #10B981)', section: 'branding' });
		}

		await updateWorkspace(db, user.workspaceId, {
			brand_color: brandColor,
			brand_name: brandName
		});

		return { success: true, section: 'branding' };
	},

	inviteMember: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		// Only owners and admins can invite
		if (user.role !== 'owner' && user.role !== 'admin') {
			return fail(403, { error: 'Only admins can invite members', section: 'team' });
		}

		const data = await request.formData();
		const email = data.get('email')?.toString().trim().toLowerCase();
		const role = data.get('role')?.toString() || 'member';

		if (!email) return fail(400, { error: 'Email is required', section: 'team' });
		if (!['admin', 'member'].includes(role)) return fail(400, { error: 'Invalid role', section: 'team' });

		// Check if already a member
		const members = await getWorkspaceMembers(db, user.workspaceId);
		if (members.some((m) => m.email === email)) {
			return fail(400, { error: 'This person is already a team member', section: 'team' });
		}

		// Check if already invited
		const invitations = await getPendingInvitations(db, user.workspaceId);
		if (invitations.some((i) => i.email === email)) {
			return fail(400, { error: 'An invitation has already been sent to this email', section: 'team' });
		}

		const { token } = await createInvitation(db, {
			workspaceId: user.workspaceId,
			email,
			role,
			invitedBy: user.id
		});

		// Send invite email
		const workspace = await getWorkspaceForUser(db, user.id);
		const appUrl = platform?.env?.APP_URL || 'http://localhost:5173';
		await sendTeamInviteEmail(platform!.env, {
			to: email,
			inviterName: user.name,
			workspaceName: workspace?.name || 'CollectRelay Workspace',
			role,
			inviteUrl: `${appUrl}/app/invite/${token}`
		});

		return { success: true, section: 'team' };
	},

	changeMemberRole: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		if (user.role !== 'owner' && user.role !== 'admin') {
			return fail(403, { error: 'Only admins can change roles', section: 'team' });
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		const newRole = data.get('role')?.toString();

		if (!userId || !newRole) return fail(400, { error: 'Missing fields', section: 'team' });

		const success = await updateMemberRole(db, user.workspaceId, userId, newRole);
		if (!success) return fail(400, { error: 'Cannot change this member\'s role', section: 'team' });

		return { success: true, section: 'team' };
	},

	removeMember: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		if (user.role !== 'owner' && user.role !== 'admin') {
			return fail(403, { error: 'Only admins can remove members', section: 'team' });
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		if (!userId) return fail(400, { error: 'Missing user ID', section: 'team' });

		const success = await removeMember(db, user.workspaceId, userId);
		if (!success) return fail(400, { error: 'Cannot remove this member', section: 'team' });

		return { success: true, section: 'team' };
	},

	revokeInvitation: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		if (user.role !== 'owner' && user.role !== 'admin') {
			return fail(403, { error: 'Only admins can revoke invitations', section: 'team' });
		}

		const data = await request.formData();
		const invitationId = data.get('invitationId')?.toString();
		if (!invitationId) return fail(400, { error: 'Missing invitation ID', section: 'team' });

		await revokeInvitation(db, invitationId, user.workspaceId);
		return { success: true, section: 'team' };
	},

	resendInvitation: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		if (user.role !== 'owner' && user.role !== 'admin') {
			return fail(403, { error: 'Only admins can resend invitations', section: 'team' });
		}

		const data = await request.formData();
		const invitationId = data.get('invitationId')?.toString();
		if (!invitationId) return fail(400, { error: 'Missing invitation ID', section: 'team' });

		const result = await resendInvitation(db, invitationId, user.workspaceId);
		if (!result) return fail(400, { error: 'Invitation not found', section: 'team' });

		// Resend the email
		const invitation = (await getPendingInvitations(db, user.workspaceId)).find((i) => i.id === invitationId);
		if (invitation) {
			const workspace = await getWorkspaceForUser(db, user.id);
			const appUrl = platform?.env?.APP_URL || 'http://localhost:5173';
			await sendTeamInviteEmail(platform!.env, {
				to: invitation.email,
				inviterName: user.name,
				workspaceName: workspace?.name || 'CollectRelay Workspace',
				role: invitation.role,
				inviteUrl: `${appUrl}/app/invite/${result.token}`
			});
		}

		return { success: true, section: 'team' };
	}
};
