import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { revokeApiKey } from '$lib/server/db/api-keys';

// Revoke an API key (session auth — for Settings UI)
export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) {
		// Dev mode
		return json({ success: true });
	}

	const success = await revokeApiKey(db, params.id, user.workspaceId);
	if (!success) throw error(404, 'API key not found or already revoked');

	return json({ success: true });
};
