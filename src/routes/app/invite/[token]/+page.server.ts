import { getInvitationByToken, acceptInvitation } from '$lib/server/db/team';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user) {
		// Dev mode
		return {
			invitation: {
				id: 'mock-inv',
				workspaceId: 'mock-ws',
				email: 'dev@example.com',
				role: 'member',
				invitedBy: 'mock-inviter',
				inviterName: 'Jane Smith',
				token: params.token,
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
				acceptedAt: null,
				createdAt: new Date().toISOString(),
				workspaceName: 'Acme Real Estate'
			},
			error: null
		};
	}

	const invitation = await getInvitationByToken(db, params.token);

	if (!invitation) {
		return { invitation: null, error: 'invalid' };
	}

	if (invitation.acceptedAt) {
		return { invitation, error: 'already_accepted' };
	}

	if (new Date(invitation.expiresAt) < new Date()) {
		return { invitation, error: 'expired' };
	}

	return { invitation, error: null };
};

export const actions: Actions = {
	accept: async ({ params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;

		if (!db || !user) return fail(401, { error: 'Please log in first' });

		const success = await acceptInvitation(db, params.token, user.id);
		if (!success) {
			return fail(400, { error: 'Unable to accept invitation. It may have expired or already been accepted.' });
		}

		throw redirect(303, '/app');
	}
};
