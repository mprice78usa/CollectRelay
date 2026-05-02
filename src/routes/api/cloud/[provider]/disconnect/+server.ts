import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProvider } from '$lib/server/cloud';
import {
	deleteCloudConnection,
	getCloudConnection
} from '$lib/server/db/cloud-connections';

export const POST: RequestHandler = async ({ params, locals, platform }) => {
	const env = platform?.env;
	const db = env?.DB;
	const user = locals.user;

	if (!env || !db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const provider = getProvider(params.provider);
	if (!provider) throw error(404, 'Unknown provider');

	const existing = await getCloudConnection(db, user.workspaceId, provider.key);
	if (!existing) return json({ disconnected: false });

	if (provider.revoke) {
		await provider.revoke(env, existing.access_token).catch(() => {});
	}

	await deleteCloudConnection(db, user.workspaceId, provider.key);
	return json({ disconnected: true });
};
