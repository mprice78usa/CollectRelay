import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWebhookById, updateWebhook, deleteWebhook, regenerateWebhookSecret } from '$lib/server/db/webhooks';

export const PUT: RequestHandler = async ({ params, request, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db || !locals.user) throw error(401, 'Unauthorized');

	const webhook = await getWebhookById(db, params.id, locals.user.workspaceId);
	if (!webhook) throw error(404, 'Webhook not found');

	const body = await request.json();
	const { url, events, enabled, description, regenerateSecret } = body as {
		url?: string; events?: string[]; enabled?: boolean; description?: string; regenerateSecret?: boolean;
	};

	if (url) {
		try { new URL(url); } catch { throw error(400, 'Invalid URL'); }
	}

	await updateWebhook(db, params.id, locals.user.workspaceId, {
		url,
		events,
		enabled: enabled !== undefined ? (enabled ? 1 : 0) : undefined,
		description
	});

	let newSecret: string | undefined;
	if (regenerateSecret) {
		newSecret = await regenerateWebhookSecret(db, params.id, locals.user.workspaceId);
	}

	return json({ success: true, ...(newSecret ? { secret: newSecret } : {}) });
};

export const DELETE: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db || !locals.user) throw error(401, 'Unauthorized');

	await deleteWebhook(db, params.id, locals.user.workspaceId);
	return json({ success: true });
};
