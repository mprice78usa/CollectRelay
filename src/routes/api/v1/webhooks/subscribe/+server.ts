import type { RequestHandler } from './$types';
import { createWebhook } from '$lib/server/db/webhooks';
import { apiSuccess, apiError } from '$lib/server/api-response';

// Zapier REST Hook subscribe endpoint
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const apiKey = locals.apiKey;
	if (!apiKey) return apiError(401, 'API key required');

	const db = platform?.env?.DB;
	if (!db) return apiError(503, 'Service unavailable');

	let body: any;
	try {
		body = await request.json();
	} catch {
		return apiError(400, 'Invalid JSON body');
	}

	const { hookUrl, event } = body;

	if (!hookUrl || typeof hookUrl !== 'string') {
		return apiError(400, 'hookUrl is required');
	}

	if (!event || typeof event !== 'string') {
		return apiError(400, 'event is required');
	}

	// Validate URL
	try {
		new URL(hookUrl);
	} catch {
		return apiError(400, 'Invalid hookUrl');
	}

	// Valid webhook event types
	const validEvents = [
		'file_uploaded',
		'item_reviewed',
		'status_changed',
		'signature_submitted',
		'comment_added',
		'transaction_created',
		'reminder_sent'
	];

	if (!validEvents.includes(event)) {
		return apiError(400, `Invalid event. Must be one of: ${validEvents.join(', ')}`);
	}

	const result = await createWebhook(db, {
		workspaceId: apiKey.workspaceId,
		url: hookUrl,
		events: [event],
		description: `Zapier subscription: ${event}`,
		source: 'zapier'
	});

	return apiSuccess({ id: result.id });
};
