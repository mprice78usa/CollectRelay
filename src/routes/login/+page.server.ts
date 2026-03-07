import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { verifyPassword, createSession } from '$lib/server/auth';
import { getUserByEmail, getWorkspaceForUser } from '$lib/server/db/users';
import { checkRateLimit } from '$lib/server/rate-limit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, platform }) => {
	if (!dev && platform?.env?.SESSIONS) {
		const sessionId = cookies.get('session');
		if (sessionId) {
			const session = await platform.env.SESSIONS.get(`session_${sessionId}`);
			if (session) throw redirect(303, '/app');
		}
	}
	return {};
};

export const actions = {
	default: async ({ request, cookies, platform, getClientAddress }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() || '';
		const password = data.get('password')?.toString() || '';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.', email });
		}

		// In dev mode, skip auth
		if (dev || !platform?.env?.DB) {
			throw redirect(303, '/app');
		}

		// Rate limiting — prevent brute force attacks
		const ip = getClientAddress();
		const rateCheck = await checkRateLimit(platform.env.SESSIONS, 'login', ip);
		if (!rateCheck.allowed) {
			return fail(429, {
				error: `Too many login attempts. Please try again in ${Math.ceil(rateCheck.retryAfterSeconds! / 60)} minutes.`,
				email
			});
		}

		const db = platform.env.DB;
		const user = await getUserByEmail(db, email);

		if (!user) {
			return fail(400, { error: 'Invalid email or password.', email });
		}

		const valid = await verifyPassword(password, user.password_hash, user.password_salt);
		if (!valid) {
			return fail(400, { error: 'Invalid email or password.', email });
		}

		const sessionId = await createSession(platform.env, user.id, getClientAddress());

		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		throw redirect(303, '/app');
	}
} satisfies Actions;
