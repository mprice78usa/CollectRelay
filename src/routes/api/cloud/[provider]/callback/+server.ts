import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProvider } from '$lib/server/cloud';
import { consumeOAuthState } from '$lib/server/cloud/oauth-state';
import { upsertCloudConnection } from '$lib/server/db/cloud-connections';

export const GET: RequestHandler = async ({ params, platform, url, locals }) => {
	const env = platform?.env;
	const db = env?.DB;
	const user = locals.user;

	if (!env || !db || !user) throw error(401, 'Unauthorized');

	const provider = getProvider(params.provider);
	if (!provider) throw error(404, 'Unknown provider');

	const code = url.searchParams.get('code');
	const stateToken = url.searchParams.get('state');
	const oauthError = url.searchParams.get('error');

	if (oauthError) {
		throw redirect(302, `/app/settings/integrations?error=${encodeURIComponent(oauthError)}`);
	}
	if (!code || !stateToken) throw error(400, 'Missing code or state');

	const state = await consumeOAuthState(env, stateToken);
	if (!state) throw error(400, 'Invalid or expired state');
	if (state.provider !== provider.key) throw error(400, 'Provider mismatch');
	if (state.workspaceId !== user.workspaceId) throw error(403, 'Workspace mismatch');

	let tokens;
	try {
		tokens = await provider.exchangeCode(env, code, state.redirectUri);
	} catch (err) {
		console.error('[cloud/callback] token exchange failed', err);
		throw redirect(
			302,
			`${state.returnTo}?error=${encodeURIComponent('Could not connect ' + provider.displayName)}`
		);
	}

	await upsertCloudConnection(db, user.workspaceId, provider.key, tokens, user.id);

	throw redirect(
		302,
		`${state.returnTo}?connected=${encodeURIComponent(provider.key)}`
	);
};
