/** Stripe API client for Cloudflare Workers (REST-based, no SDK needed) */

const STRIPE_API = 'https://api.stripe.com/v1';

// Price IDs from Stripe (test mode)
export const STRIPE_PRICES = {
	pro: {
		monthly: 'price_1T9u0YAf5ZaWveKYQeAM3pWc',
		annual: 'price_1T9u0YAf5ZaWveKYN5Rd4M2a'
	},
	team: {
		monthly: 'price_1T9u0ZAf5ZaWveKYmB5es9Vn',
		annual: 'price_1T9u0ZAf5ZaWveKYFZGgN57B'
	}
} as const;

// Additional Team Member seat prices ($15/mo or $150/yr per extra seat beyond 5)
export const TEAM_SEAT_PRICES = {
	monthly: 'price_1T9wqYAf5ZaWveKYJ8EdKCMy',
	annual: 'price_1T9wqYAf5ZaWveKYVNzm473u'
} as const;

export const TEAM_INCLUDED_SEATS = 5;
export const TEAM_SEAT_PRICE_MONTHLY = 15;
export const TEAM_SEAT_PRICE_ANNUAL = 150;

export type PlanKey = keyof typeof STRIPE_PRICES;
export type BillingInterval = 'monthly' | 'annual';

// Plan display info
export const PLAN_INFO: Record<PlanKey | 'free', { name: string; users: number; storageLabel: string }> = {
	free: { name: 'Free', users: 1, storageLabel: '500MB' },
	pro: { name: 'Pro', users: 1, storageLabel: '5GB' },
	team: { name: 'Team', users: 5, storageLabel: '25GB' }
};

/** Make a Stripe API request */
async function stripeRequest(
	secretKey: string,
	method: string,
	endpoint: string,
	body?: Record<string, string>
): Promise<any> {
	const headers: Record<string, string> = {
		Authorization: `Bearer ${secretKey}`,
		'Content-Type': 'application/x-www-form-urlencoded'
	};

	const options: RequestInit = { method, headers };
	if (body) {
		options.body = new URLSearchParams(body).toString();
	}

	const response = await fetch(`${STRIPE_API}${endpoint}`, options);
	const data = await response.json();

	if (!response.ok) {
		console.error('Stripe API error:', data);
		throw new Error(data.error?.message || 'Stripe API error');
	}

	return data;
}

/** Create a Stripe customer */
export async function createCustomer(
	secretKey: string,
	params: { email: string; name: string; workspaceId: string }
): Promise<string> {
	const data = await stripeRequest(secretKey, 'POST', '/customers', {
		email: params.email,
		name: params.name,
		'metadata[workspace_id]': params.workspaceId
	});
	return data.id;
}

/** Create a Stripe Checkout session */
export async function createCheckoutSession(
	secretKey: string,
	params: {
		customerId: string;
		priceId: string;
		successUrl: string;
		cancelUrl: string;
		workspaceId: string;
	}
): Promise<{ id: string; url: string }> {
	const data = await stripeRequest(secretKey, 'POST', '/checkout/sessions', {
		customer: params.customerId,
		'line_items[0][price]': params.priceId,
		'line_items[0][quantity]': '1',
		mode: 'subscription',
		success_url: params.successUrl,
		cancel_url: params.cancelUrl,
		'subscription_data[metadata][workspace_id]': params.workspaceId,
		allow_promotion_codes: 'true'
	});
	return { id: data.id, url: data.url };
}

/** Create a Stripe Customer Portal session */
export async function createPortalSession(
	secretKey: string,
	params: { customerId: string; returnUrl: string }
): Promise<{ url: string }> {
	const data = await stripeRequest(secretKey, 'POST', '/billing_portal/sessions', {
		customer: params.customerId,
		return_url: params.returnUrl
	});
	return { url: data.url };
}

/** Get subscription details */
export async function getSubscription(
	secretKey: string,
	subscriptionId: string
): Promise<any> {
	return stripeRequest(secretKey, 'GET', `/subscriptions/${subscriptionId}`);
}

/** Update additional seat quantity on a Team subscription.
 *  If extraSeats > 0 and no seat line item exists, adds one.
 *  If extraSeats === 0 and a seat line item exists, removes it.
 *  Otherwise updates the existing quantity. */
export async function updateTeamSeats(
	secretKey: string,
	subscriptionId: string,
	extraSeats: number
): Promise<{ totalSeats: number; extraSeats: number }> {
	// Fetch current subscription to find seat line item
	const sub = await getSubscription(secretKey, subscriptionId);
	const seatItem = sub.items?.data?.find(
		(item: any) => item.price?.metadata?.plan_key === 'team_seat'
	);

	if (extraSeats > 0 && seatItem) {
		// Update existing seat quantity
		await stripeRequest(secretKey, 'POST', `/subscription_items/${seatItem.id}`, {
			quantity: extraSeats.toString(),
			proration_behavior: 'always_invoice'
		});
	} else if (extraSeats > 0 && !seatItem) {
		// Add seat line item to subscription
		const billing = sub.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
		const seatPriceId = TEAM_SEAT_PRICES[billing];
		await stripeRequest(secretKey, 'POST', '/subscription_items', {
			subscription: subscriptionId,
			price: seatPriceId,
			quantity: extraSeats.toString(),
			proration_behavior: 'always_invoice'
		});
	} else if (extraSeats === 0 && seatItem) {
		// Remove seat line item
		await stripeRequest(secretKey, 'DELETE', `/subscription_items/${seatItem.id}`, {
			proration_behavior: 'always_invoice'
		});
	}

	return {
		totalSeats: TEAM_INCLUDED_SEATS + extraSeats,
		extraSeats
	};
}

/** Get current seat count for a Team subscription */
export async function getTeamSeatCount(
	secretKey: string,
	subscriptionId: string
): Promise<{ totalSeats: number; extraSeats: number; monthlyCost: number }> {
	const sub = await getSubscription(secretKey, subscriptionId);
	const seatItem = sub.items?.data?.find(
		(item: any) => item.price?.metadata?.plan_key === 'team_seat'
	);
	const extraSeats = seatItem ? (seatItem.quantity || 0) : 0;
	const billing = sub.items?.data?.[0]?.price?.recurring?.interval === 'year' ? 'annual' : 'monthly';
	const seatCost = billing === 'annual'
		? (TEAM_SEAT_PRICE_ANNUAL / 12) * extraSeats
		: TEAM_SEAT_PRICE_MONTHLY * extraSeats;

	return {
		totalSeats: TEAM_INCLUDED_SEATS + extraSeats,
		extraSeats,
		monthlyCost: seatCost
	};
}

/** Verify Stripe webhook signature */
export async function verifyWebhookSignature(
	payload: string,
	signature: string,
	secret: string
): Promise<any> {
	const parts = signature.split(',');
	const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
	const v1Signature = parts.find((p) => p.startsWith('v1='))?.slice(3);

	if (!timestamp || !v1Signature) {
		throw new Error('Invalid signature format');
	}

	// Check timestamp (reject if older than 5 minutes)
	const age = Math.abs(Date.now() / 1000 - parseInt(timestamp));
	if (age > 300) {
		throw new Error('Webhook timestamp too old');
	}

	// Compute expected signature
	const signedPayload = `${timestamp}.${payload}`;
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signatureBytes = await crypto.subtle.sign(
		'HMAC',
		key,
		new TextEncoder().encode(signedPayload)
	);
	const expectedSignature = Array.from(new Uint8Array(signatureBytes))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	if (expectedSignature !== v1Signature) {
		throw new Error('Invalid webhook signature');
	}

	return JSON.parse(payload);
}
