import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPortalSession } from '$lib/server/stripe';

export const POST: RequestHandler = async ({ platform, locals, url }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const db = platform?.env?.DB;
	const stripeKey = platform?.env?.STRIPE_SECRET_KEY;
	if (!db || !stripeKey) throw error(503, 'Service not available');

	// Get Stripe customer ID
	const workspace = await db
		.prepare('SELECT stripe_customer_id FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ stripe_customer_id: string | null }>();

	if (!workspace?.stripe_customer_id) {
		throw error(400, 'No billing account found. Please subscribe to a plan first.');
	}

	const appUrl = platform?.env?.APP_URL || url.origin;

	const session = await createPortalSession(stripeKey, {
		customerId: workspace.stripe_customer_id,
		returnUrl: `${appUrl}/app/settings`
	});

	return json({ url: session.url });
};
