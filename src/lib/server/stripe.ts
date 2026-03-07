/** Stripe API client for Cloudflare Workers (REST-based, no SDK needed) */

const STRIPE_API = 'https://api.stripe.com/v1';

// Price IDs from Stripe (test mode)
export const STRIPE_PRICES = {
	single: {
		monthly: 'price_1T7nHyAf5ZaWveKYK2JBtCqA',
		annual: 'price_1T7nHyAf5ZaWveKYmrofteHJ'
	},
	team5: {
		monthly: 'price_1T7nHyAf5ZaWveKYFR4LpMot',
		annual: 'price_1T7nHzAf5ZaWveKYvQMNrfAR'
	},
	team10: {
		monthly: 'price_1T7nHzAf5ZaWveKYFR4qp9J4',
		annual: 'price_1T7nHzAf5ZaWveKYgbaI2EAb'
	},
	team25: {
		monthly: 'price_1T7nI0Af5ZaWveKYNNIqy8Rq',
		annual: 'price_1T7nI0Af5ZaWveKYvEyAy5kB'
	}
} as const;

export type PlanKey = keyof typeof STRIPE_PRICES;
export type BillingInterval = 'monthly' | 'annual';

// Plan display info
export const PLAN_INFO: Record<PlanKey, { name: string; users: number; storageLabel: string }> = {
	single: { name: 'Single User', users: 1, storageLabel: '500GB' },
	team5: { name: 'Team 5', users: 5, storageLabel: '2.5TB' },
	team10: { name: 'Team 10', users: 10, storageLabel: '5TB' },
	team25: { name: 'Team 25', users: 25, storageLabel: '12.5TB' }
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
