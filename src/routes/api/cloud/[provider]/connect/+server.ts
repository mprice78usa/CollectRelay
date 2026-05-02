import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProvider } from '$lib/server/cloud';
import { createOAuthState } from '$lib/server/cloud/oauth-state';

export const GET: RequestHandler = async ({ params, locals, platform, url }) => {
	const env = platform?.env;
	const user = locals.user;

	if (!env || !user?.workspaceId) throw error(401, 'Unauthorized');

	const provider = getProvider(params.provider);
	if (!provider) throw error(404, 'Unknown provider');
	if (!provider.isConfigured(env)) {
		throw error(503, `${provider.displayName} integration is not configured on this server`);
	}

	const redirectUri = `${url.origin}/api/cloud/${provider.key}/callback`;
	const returnTo = url.searchParams.get('returnTo') || '/app/settings/integrations';

	const state = await createOAuthState(env, {
		workspaceId: user.workspaceId,
		userId: user.id,
		provider: provider.key,
		redirectUri,
		returnTo
	});

	const authorizeUrl = provider.buildAuthorizeUrl(env, state, redirectUri);
	throw redirect(302, authorizeUrl);
};
