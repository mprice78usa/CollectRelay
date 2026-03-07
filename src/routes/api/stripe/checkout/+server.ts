import { json, error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCustomer, createCheckoutSession, STRIPE_PRICES } from '$lib/server/stripe';
import type { PlanKey, BillingInterval } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ request, platform, locals, url }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const db = platform?.env?.DB;
	const stripeKey = platform?.env?.STRIPE_SECRET_KEY;
	if (!db || !stripeKey) throw error(503, 'Service not available');

	const body = await request.json();
	const planKey = body.plan as PlanKey;
	const billing = (body.billing || 'monthly') as BillingInterval;

	// Validate plan
	if (!STRIPE_PRICES[planKey]) {
		throw error(400, 'Invalid plan');
	}

	const priceId = STRIPE_PRICES[planKey][billing];
	if (!priceId) {
		throw error(400, 'Invalid billing interval');
	}

	// Get or create Stripe customer
	let customerId: string;
	const workspace = await db
		.prepare('SELECT stripe_customer_id FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ stripe_customer_id: string | null }>();

	if (workspace?.stripe_customer_id) {
		customerId = workspace.stripe_customer_id;
	} else {
		customerId = await createCustomer(stripeKey, {
			email: user.email,
			name: user.name,
			workspaceId: user.workspaceId
		});

		// Save customer ID
		await db
			.prepare('UPDATE workspaces SET stripe_customer_id = ? WHERE id = ?')
			.bind(customerId, user.workspaceId)
			.run();
	}

	const appUrl = platform?.env?.APP_URL || url.origin;

	const session = await createCheckoutSession(stripeKey, {
		customerId,
		priceId,
		successUrl: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
		cancelUrl: `${appUrl}/pricing`,
		workspaceId: user.workspaceId
	});

	return json({ url: session.url });
};
