import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { hashPassword, createSession } from '$lib/server/auth';
import { getUserByEmail, createUser } from '$lib/server/db/users';
import { checkRateLimit } from '$lib/server/rate-limit';
import { createCustomer, createCheckoutSession, STRIPE_PRICES } from '$lib/server/stripe';
import type { PlanKey, BillingInterval } from '$lib/server/stripe';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies, platform }) => {
	// If already logged in, redirect to app
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
	default: async ({ request, cookies, platform, url, getClientAddress }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim() || '';
		const name = data.get('name')?.toString().trim() || '';
		const password = data.get('password')?.toString() || '';
		const company = data.get('company')?.toString().trim() || '';
		const planKey = data.get('plan')?.toString() || '';
		const billing = data.get('billing')?.toString() || '';

		// Validation
		if (!email || !name || !password) {
			return fail(400, { error: 'Email, name, and password are required.', email, name, company });
		}

		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.', email, name, company });
		}

		if (!email.includes('@') || !email.includes('.')) {
			return fail(400, { error: 'Please enter a valid email address.', email, name, company });
		}

		// In dev mode, skip DB operations
		if (dev || !platform?.env?.DB) {
			throw redirect(303, '/app');
		}

		// Rate limiting — prevent spam registrations
		const ip = getClientAddress();
		const rateCheck = await checkRateLimit(platform.env.SESSIONS, 'register', ip);
		if (!rateCheck.allowed) {
			return fail(429, {
				error: `Too many registration attempts. Please try again in ${Math.ceil(rateCheck.retryAfterSeconds! / 60)} minutes.`,
				email,
				name,
				company
			});
		}

		const db = platform.env.DB;

		// Check if user exists
		const existing = await getUserByEmail(db, email);
		if (existing) {
			return fail(400, { error: 'An account with this email already exists.', email, name, company });
		}

		// Hash password
		const { hash, salt } = await hashPassword(password);

		// Create user + workspace
		const { userId, workspaceId } = await createUser(db, {
			email,
			name,
			passwordHash: hash,
			passwordSalt: salt,
			company: company || undefined
		});

		// Create session
		const sessionId = await createSession(platform.env, userId, getClientAddress());

		cookies.set('session', sessionId, {
			path: '/',
			httpOnly: true,
			secure: !dev,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		// If user came from pricing page with a plan selected, create Stripe checkout
		const stripeKey = platform.env.STRIPE_SECRET_KEY;
		if (planKey && billing && stripeKey && STRIPE_PRICES[planKey as PlanKey]) {
			try {
				const priceId = STRIPE_PRICES[planKey as PlanKey][billing as BillingInterval];
				if (priceId) {
					// Create Stripe customer
					const customerId = await createCustomer(stripeKey, {
						email,
						name,
						workspaceId
					});

					// Save customer ID to workspace
					await db
						.prepare('UPDATE workspaces SET stripe_customer_id = ? WHERE id = ?')
						.bind(customerId, workspaceId)
						.run();

					// Create checkout session
					const appUrl = platform.env.APP_URL || url.origin;
					const session = await createCheckoutSession(stripeKey, {
						customerId,
						priceId,
						successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
						cancelUrl: `${appUrl}/pricing`,
						workspaceId
					});

					// Redirect to Stripe Checkout instead of /app
					throw redirect(303, session.url);
				}
			} catch (e) {
				// If it's a redirect, re-throw it
				if (e && typeof e === 'object' && 'status' in e) throw e;
				// If Stripe fails, just continue to /app — they can subscribe later
				console.error('Post-registration checkout failed:', e);
			}
		}

		throw redirect(303, '/app');
	}
} satisfies Actions;
