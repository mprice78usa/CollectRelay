/** Cloud provider registry + dispatch + token-refresh helper. */

import { boxProvider } from './box';
import {
	getCloudConnection,
	updateConnectionTokens,
	type CloudConnection
} from '$lib/server/db/cloud-connections';
import type { CloudProvider, CloudProviderKey } from './types';

const REGISTRY: Record<CloudProviderKey, CloudProvider | null> = {
	box: boxProvider,
	dropbox: null,
	gdrive: null
};

export function getProvider(key: string): CloudProvider | null {
	if (key in REGISTRY) {
		return REGISTRY[key as CloudProviderKey];
	}
	return null;
}

export function listEnabledProviders(env: App.Platform['env']): CloudProvider[] {
	return Object.values(REGISTRY).filter((p): p is CloudProvider => Boolean(p && p.isConfigured(env)));
}

export function listAllProviders(): CloudProvider[] {
	return Object.values(REGISTRY).filter((p): p is CloudProvider => Boolean(p));
}

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // refresh if <5 min left

export async function getValidAccessToken(
	env: App.Platform['env'],
	db: D1Database,
	connection: CloudConnection
): Promise<string> {
	const provider = getProvider(connection.provider);
	if (!provider) throw new Error(`Unknown provider: ${connection.provider}`);

	const expiresAt = connection.token_expires_at
		? Date.parse(connection.token_expires_at)
		: null;

	const needsRefresh =
		expiresAt !== null && expiresAt - Date.now() < REFRESH_BUFFER_MS;

	if (!needsRefresh) return connection.access_token;

	if (!connection.refresh_token) {
		throw new Error('Connection has no refresh token; please reconnect');
	}

	const refreshed = await provider.refreshToken(env, connection.refresh_token);
	await updateConnectionTokens(db, connection.id, refreshed);
	return refreshed.accessToken;
}

export async function getProviderConnection(
	db: D1Database,
	workspaceId: string,
	providerKey: CloudProviderKey
): Promise<CloudConnection | null> {
	return getCloudConnection(db, workspaceId, providerKey);
}
