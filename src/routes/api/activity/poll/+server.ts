import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getActivitySince, getActivitySinceForWorkspace } from '$lib/server/db/activity';

/**
 * GET /api/activity/poll?since=ISO_TIMESTAMP&transactionId=OPTIONAL
 *
 * Polls for new activity since a given timestamp.
 * - For pro users: returns client activity (optionally filtered to a specific transaction)
 * - For clients (via client_token): returns pro activity for their transaction
 *
 * Returns only activity from the OTHER party (pro doesn't see their own activity).
 */
export const GET: RequestHandler = async ({ url, locals, platform }) => {
	const db = platform?.env?.DB;
	if (!db) throw error(503, 'Service not available');

	const since = url.searchParams.get('since');
	if (!since) throw error(400, 'Missing "since" parameter');

	const transactionId = url.searchParams.get('transactionId');

	// Pro user polling
	if (locals.user) {
		if (transactionId) {
			// Poll specific transaction
			const items = await getActivitySince(db, transactionId, since, 'pro');
			return json({ hasNew: items.length > 0, items });
		} else {
			// Poll all workspace transactions
			const items = await getActivitySinceForWorkspace(db, locals.user.workspaceId, since);
			return json({ hasNew: items.length > 0, items });
		}
	}

	// Client polling (via client_token cookie)
	if (locals.clientSession) {
		const items = await getActivitySince(
			db,
			locals.clientSession.transactionId,
			since,
			'client'
		);
		return json({ hasNew: items.length > 0, items });
	}

	throw error(401, 'Unauthorized');
};
