import type { RequestHandler } from './$types';
import { getWebhookById, deleteWebhook } from '$lib/server/db/webhooks';
import { apiError } from '$lib/server/api-response';

// Zapier REST Hook unsubscribe endpoint
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const apiKey = locals.apiKey;
	if (!apiKey) return apiError(401, 'API key required');

	const db = platform?.env?.DB;
	if (!db) return apiError(503, 'Service unavailable');

	// Verify webhook exists and belongs to workspace
	const webhook = await getWebhookById(db, params.id, apiKey.workspaceId);
	if (!webhook) return apiError(404, 'Webhook not found');

	// Only allow deleting Zapier-created webhooks through this endpoint
	// @ts-ignore — source column added in migration 0023
	if ((webhook as any).source !== 'zapier') {
		return apiError(403, 'Can only unsubscribe Zapier-created webhooks through this endpoint');
	}

	await deleteWebhook(db, params.id, apiKey.workspaceId);

	return new Response(null, { status: 204 });
};
