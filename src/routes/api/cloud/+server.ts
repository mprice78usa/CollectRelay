import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listAllProviders } from '$lib/server/cloud';
import { listCloudConnections } from '$lib/server/db/cloud-connections';

export const GET: RequestHandler = async ({ locals, platform }) => {
	const env = platform?.env;
	const db = env?.DB;
	const user = locals.user;

	if (!env || !db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const connections = await listCloudConnections(db, user.workspaceId);
	const byProvider = new Map(connections.map((c) => [c.provider, c]));

	const providers = listAllProviders().map((p) => {
		const conn = byProvider.get(p.key);
		return {
			key: p.key,
			displayName: p.displayName,
			configured: p.isConfigured(env),
			connected: Boolean(conn),
			account: conn?.external_account_email ?? null,
			connectedAt: conn?.created_at ?? null
		};
	});

	return json({ providers });
};
