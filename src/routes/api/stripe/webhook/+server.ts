import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { verifyWebhookSignature } from '$lib/server/stripe';

/** Map Stripe plan metadata to workspace limits */
function getPlanLimits(planKey: string): { maxUsers: number; maxStorageBytes: number } {
	const plans: Record<string, { maxUsers: number; maxStorageBytes: number }> = {
		single: { maxUsers: 1, maxStorageBytes: 500 * 1024 * 1024 * 1024 },          // 500GB
		team5: { maxUsers: 5, maxStorageBytes: 2560 * 1024 * 1024 * 1024 },           // 2.5TB
		team10: { maxUsers: 10, maxStorageBytes: 5120 * 1024 * 1024 * 1024 },          // 5TB
		team25: { maxUsers: 25, maxStorageBytes: 12800 * 1024 * 1024 * 1024 }          // 12.5TB
	};
	return plans[planKey] || { maxUsers: 1, maxStorageBytes: 500 * 1024 * 1024 * 1024 };
}

export const POST: RequestHandler = async ({ request, platform }) => {
	const db = platform?.env?.DB;
	const webhookSecret = platform?.env?.STRIPE_WEBHOOK_SECRET;
	const stripeKey = platform?.env?.STRIPE_SECRET_KEY;

	if (!db || !webhookSecret) {
		throw error(503, 'Service not available');
	}

	const payload = await request.text();
	const signature = request.headers.get('stripe-signature');

	if (!signature) {
		throw error(400, 'Missing Stripe signature');
	}

	let event: any;
	try {
		event = await verifyWebhookSignature(payload, signature, webhookSecret);
	} catch (err) {
		console.error('Webhook signature verification failed:', err);
		throw error(400, 'Invalid signature');
	}

	console.log(`Stripe webhook: ${event.type}`);

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;
			const customerId = session.customer;
			const subscriptionId = session.subscription;

			if (subscriptionId && stripeKey) {
				// Fetch subscription details to get plan info
				const subResponse = await fetch(
					`https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
					{ headers: { Authorization: `Bearer ${stripeKey}` } }
				);
				const subscription = await subResponse.json();

				const planKey = subscription.metadata?.plan_key ||
					subscription.items?.data?.[0]?.price?.metadata?.plan_key || 'single';
				const billingInterval = subscription.items?.data?.[0]?.price?.metadata?.billing || 'monthly';
				const limits = getPlanLimits(planKey);

				await db
					.prepare(
						`UPDATE workspaces SET
							stripe_subscription_id = ?,
							plan_key = ?,
							billing_interval = ?,
							subscription_status = 'active',
							current_period_end = ?,
							max_users = ?,
							max_storage_bytes = ?,
							trial_ends_at = NULL
						WHERE stripe_customer_id = ?`
					)
					.bind(
						subscriptionId,
						planKey,
						billingInterval,
						new Date(subscription.current_period_end * 1000).toISOString(),
						limits.maxUsers,
						limits.maxStorageBytes,
						customerId
					)
					.run();
			}
			break;
		}

		case 'customer.subscription.updated': {
			const subscription = event.data.object;
			const customerId = subscription.customer;
			const planKey = subscription.metadata?.plan_key ||
				subscription.items?.data?.[0]?.price?.metadata?.plan_key || 'single';
			const billingInterval = subscription.items?.data?.[0]?.price?.metadata?.billing || 'monthly';
			const limits = getPlanLimits(planKey);

			await db
				.prepare(
					`UPDATE workspaces SET
						plan_key = ?,
						billing_interval = ?,
						subscription_status = ?,
						current_period_end = ?,
						max_users = ?,
						max_storage_bytes = ?
					WHERE stripe_customer_id = ?`
				)
				.bind(
					planKey,
					billingInterval,
					subscription.status === 'active' ? 'active' : subscription.status,
					new Date(subscription.current_period_end * 1000).toISOString(),
					limits.maxUsers,
					limits.maxStorageBytes,
					customerId
				)
				.run();
			break;
		}

		case 'customer.subscription.deleted': {
			const subscription = event.data.object;
			const customerId = subscription.customer;

			await db
				.prepare(
					`UPDATE workspaces SET
						subscription_status = 'cancelled',
						plan_key = 'free'
					WHERE stripe_customer_id = ?`
				)
				.bind(customerId)
				.run();
			break;
		}

		case 'invoice.payment_failed': {
			const invoice = event.data.object;
			const customerId = invoice.customer;

			await db
				.prepare(
					`UPDATE workspaces SET subscription_status = 'past_due' WHERE stripe_customer_id = ?`
				)
				.bind(customerId)
				.run();
			break;
		}

		default:
			// Unhandled event type — log and acknowledge
			console.log(`Unhandled Stripe event: ${event.type}`);
	}

	return json({ received: true });
};
