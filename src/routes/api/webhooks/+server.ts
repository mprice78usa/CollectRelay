import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWebhooksForWorkspace, createWebhook } from '$lib/server/db/webhooks';

const VALID_EVENTS = [
	'file_uploaded', 'answer_submitted', 'signature_submitted',
	'item_reviewed', 'status_changed', 'comment_added',
	'magic_link_sent', 'reminder_sent'
];

export const GET: RequestHandler = async ({ platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db || !locals.user) throw error(401, 'Unauthorized');

	const webhooks = await getWebhooksForWorkspace(db, locals.user.workspaceId);

	// Mask secrets in list response
	return json(webhooks.map((w) => ({
		...w,
		secret: w.secret.slice(0, 10) + '...',
		events: JSON.parse(w.events)
	})));
};

export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db || !locals.user) throw error(401, 'Unauthorized');

	const body = await request.json();
	const { url, events, description } = body as { url?: string; events?: string[]; description?: string };

	if (!url || !events || !Array.isArray(events)) {
		throw error(400, 'Missing url or events');
	}

	// Validate URL
	try {
		new URL(url);
	} catch {
		throw error(400, 'Invalid URL');
	}

	// Validate events
	const invalidEvents = events.filter((e) => !VALID_EVENTS.includes(e));
	if (invalidEvents.length > 0) {
		throw error(400, `Invalid events: ${invalidEvents.join(', ')}`);
	}

	const result = await createWebhook(db, {
		workspaceId: locals.user.workspaceId,
		url,
		events,
		description
	});

	// Return full secret only on creation
	return json(result, { status: 201 });
};
