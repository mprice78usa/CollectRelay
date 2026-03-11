import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { savePushSubscription } from '$lib/server/db/push-subscriptions';

// Save a push subscription from the client
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = platform?.env?.DB;

	// Must be authenticated — either client session or pro user
	const clientSession = locals.clientSession;
	const user = locals.user;

	if (!db) {
		// Dev mode
		return json({ success: true });
	}

	if (!clientSession && !user) {
		throw error(401, 'Authentication required');
	}

	let body: any;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body');
	}

	const { endpoint, keys } = body;

	if (!endpoint || typeof endpoint !== 'string') {
		throw error(400, 'endpoint is required');
	}
	if (!keys?.p256dh || !keys?.auth) {
		throw error(400, 'keys.p256dh and keys.auth are required');
	}

	// Validate endpoint URL
	try {
		new URL(endpoint);
	} catch {
		throw error(400, 'Invalid endpoint URL');
	}

	// Determine workspace ID and context
	let workspaceId: string;
	let transactionId: string | undefined;
	let clientEmail: string | undefined;

	if (clientSession) {
		// Client portal subscription — look up workspace from transaction
		const txn = await db
			.prepare('SELECT workspace_id FROM transactions WHERE id = ?')
			.bind(clientSession.transactionId)
			.first<{ workspace_id: string }>();

		if (!txn) throw error(404, 'Transaction not found');

		workspaceId = txn.workspace_id;
		transactionId = clientSession.transactionId;
		clientEmail = clientSession.clientEmail;
	} else {
		workspaceId = user!.workspaceId;
	}

	await savePushSubscription(db, {
		workspaceId,
		transactionId,
		clientEmail,
		endpoint,
		p256dh: keys.p256dh,
		auth: keys.auth
	});

	return json({ success: true });
};
