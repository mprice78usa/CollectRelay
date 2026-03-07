import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { deleteSession } from '$lib/server/auth';
import type { Actions } from './$types';

export const actions = {
	default: async ({ cookies, platform }) => {
		const sessionId = cookies.get('session');

		if (sessionId && !dev && platform?.env?.SESSIONS) {
			await deleteSession(platform.env, sessionId);
		}

		cookies.delete('session', { path: '/' });
		throw redirect(303, '/login');
	}
} satisfies Actions;
