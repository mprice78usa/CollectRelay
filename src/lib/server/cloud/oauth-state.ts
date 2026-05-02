/** Short-lived OAuth state tokens stored in OAUTH_STATES KV (15-min TTL). */

import type { CloudProviderKey } from './types';

const STATE_TTL_SECONDS = 15 * 60;

export interface OAuthStatePayload {
	workspaceId: string;
	userId: string;
	provider: CloudProviderKey;
	redirectUri: string;
	returnTo: string;
	createdAt: string;
}

function generateState(): string {
	const bytes = new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

export async function createOAuthState(
	env: App.Platform['env'],
	payload: Omit<OAuthStatePayload, 'createdAt'>
): Promise<string> {
	const state = generateState();
	const value: OAuthStatePayload = {
		...payload,
		createdAt: new Date().toISOString()
	};
	await env.OAUTH_STATES.put(state, JSON.stringify(value), {
		expirationTtl: STATE_TTL_SECONDS
	});
	return state;
}

export async function consumeOAuthState(
	env: App.Platform['env'],
	state: string
): Promise<OAuthStatePayload | null> {
	const raw = await env.OAUTH_STATES.get(state);
	if (!raw) return null;
	// Single-use: delete immediately after read
	await env.OAUTH_STATES.delete(state);
	try {
		return JSON.parse(raw) as OAuthStatePayload;
	} catch {
		return null;
	}
}
