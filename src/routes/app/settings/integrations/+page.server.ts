import { listAllProviders } from '$lib/server/cloud';
import { listCloudConnections } from '$lib/server/db/cloud-connections';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	const env = platform?.env;
	const db = env?.DB;
	const user = locals.user;

	if (!env || !db || !user?.workspaceId) {
		return {
			providers: listAllProviders().map((p) => ({
				key: p.key,
				displayName: p.displayName,
				configured: false,
				connected: false,
				account: null as string | null,
				connectedAt: null as string | null
			})),
			flash: null
		};
	}

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

	const flash = (() => {
		const connected = url.searchParams.get('connected');
		const errorMsg = url.searchParams.get('error');
		if (connected) return { kind: 'success' as const, text: `Connected to ${connected}.` };
		if (errorMsg) return { kind: 'error' as const, text: errorMsg };
		return null;
	})();

	return { providers, flash };
};
