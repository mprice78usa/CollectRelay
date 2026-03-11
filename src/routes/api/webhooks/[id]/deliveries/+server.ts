import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWebhookById, getRecentDeliveries } from '$lib/server/db/webhooks';

export const GET: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db || !locals.user) throw error(401, 'Unauthorized');

	const webhook = await getWebhookById(db, params.id, locals.user.workspaceId);
	if (!webhook) throw error(404, 'Webhook not found');

	const deliveries = await getRecentDeliveries(db, webhook.id, 20);
	return json(deliveries);
};
