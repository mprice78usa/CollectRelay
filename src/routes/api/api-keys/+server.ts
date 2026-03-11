import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getApiKeysForWorkspace, createApiKey } from '$lib/server/db/api-keys';

// List API keys (session auth — for Settings UI)
export const GET: RequestHandler = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) {
		// Dev mode
		return json([]);
	}

	const keys = await getApiKeysForWorkspace(db, user.workspaceId);
	return json(keys);
};

// Create a new API key (session auth — for Settings UI)
export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) {
		// Dev mode: return mock key
		return json({
			id: 'dev-key-1',
			name: 'Dev Key',
			key: 'cr_live_0000000000000000000000000000',
			prefix: 'cr_live_00000000',
			createdAt: new Date().toISOString()
		}, { status: 201 });
	}

	const body = await request.json();
	const name = body.name?.trim();

	if (!name) throw error(400, 'Name is required');
	if (name.length > 100) throw error(400, 'Name too long (max 100 characters)');

	// Limit keys per workspace
	const existing = await getApiKeysForWorkspace(db, user.workspaceId);
	if (existing.length >= 10) {
		throw error(400, 'Maximum 10 API keys per workspace. Revoke unused keys first.');
	}

	const result = await createApiKey(db, {
		workspaceId: user.workspaceId,
		name
	});

	return json({
		id: result.id,
		name,
		key: result.key,
		prefix: result.prefix,
		createdAt: new Date().toISOString()
	}, { status: 201 });
};
