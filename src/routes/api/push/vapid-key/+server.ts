import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';

// Return the VAPID public key for client-side push subscription
// No auth required — the public key is non-secret
export const GET: RequestHandler = async ({ platform }) => {
	if (dev || !platform?.env?.VAPID_PUBLIC_KEY) {
		return json({ key: '' });
	}

	return json({ key: platform.env.VAPID_PUBLIC_KEY });
};
