/** Box.com API client. Fetch-based, no SDK. Mirrors the stripe.ts pattern. */

import type {
	CloudFolder,
	CloudProvider,
	CloudUploadResult,
	OAuthTokens
} from './types';

const AUTHORIZE_URL = 'https://account.box.com/api/oauth2/authorize';
const TOKEN_URL = 'https://api.box.com/oauth2/token';
const REVOKE_URL = 'https://api.box.com/oauth2/revoke';
const API_BASE = 'https://api.box.com/2.0';
const UPLOAD_BASE = 'https://upload.box.com/api/2.0';
const SCOPES = 'root_readwrite';

function epochToIso(secondsFromNow: number): string {
	return new Date(Date.now() + secondsFromNow * 1000).toISOString();
}

async function tokenRequest(
	clientId: string,
	clientSecret: string,
	body: Record<string, string>
): Promise<OAuthTokens> {
	const params = new URLSearchParams({
		client_id: clientId,
		client_secret: clientSecret,
		...body
	});

	const res = await fetch(TOKEN_URL, {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: params.toString()
	});

	if (!res.ok) {
		throw new Error(`Box token request failed: ${res.status} ${await res.text()}`);
	}

	const json = await res.json<{
		access_token: string;
		refresh_token?: string;
		expires_in?: number;
	}>();

	const accessToken = json.access_token;
	const userInfo = await fetchUserInfo(accessToken);

	return {
		accessToken,
		refreshToken: json.refresh_token ?? null,
		expiresAt: json.expires_in ? epochToIso(json.expires_in) : null,
		externalUserId: userInfo.id,
		externalAccountEmail: userInfo.login ?? null
	};
}

async function fetchUserInfo(accessToken: string): Promise<{ id: string; login?: string }> {
	const res = await fetch(`${API_BASE}/users/me?fields=id,login`, {
		headers: { Authorization: `Bearer ${accessToken}` }
	});
	if (!res.ok) {
		throw new Error(`Box user lookup failed: ${res.status} ${await res.text()}`);
	}
	return res.json();
}

async function findChildFolder(
	accessToken: string,
	parentId: string,
	name: string
): Promise<string | null> {
	// /folders/{id}/items returns up to 1000 entries; for typical CollectRelay
	// usage (one folder per workspace, one per transaction) this is plenty.
	const res = await fetch(
		`${API_BASE}/folders/${parentId}/items?fields=id,name,type&limit=1000`,
		{ headers: { Authorization: `Bearer ${accessToken}` } }
	);
	if (!res.ok) return null;
	const json = await res.json<{ entries: Array<{ id: string; name: string; type: string }> }>();
	const match = json.entries.find((e) => e.type === 'folder' && e.name === name);
	return match?.id ?? null;
}

async function createFolder(
	accessToken: string,
	parentId: string,
	name: string
): Promise<string> {
	const res = await fetch(`${API_BASE}/folders`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ name, parent: { id: parentId } })
	});
	if (res.ok) {
		const json = await res.json<{ id: string }>();
		return json.id;
	}
	// 409 = name conflict; refetch
	if (res.status === 409) {
		const existing = await findChildFolder(accessToken, parentId, name);
		if (existing) return existing;
	}
	throw new Error(`Box createFolder failed: ${res.status} ${await res.text()}`);
}

export const boxProvider: CloudProvider = {
	key: 'box',
	displayName: 'Box',

	isConfigured(env) {
		return Boolean(env.BOX_CLIENT_ID && env.BOX_CLIENT_SECRET);
	},

	buildAuthorizeUrl(env, state, redirectUri) {
		if (!env.BOX_CLIENT_ID) throw new Error('Box is not configured');
		const params = new URLSearchParams({
			response_type: 'code',
			client_id: env.BOX_CLIENT_ID,
			redirect_uri: redirectUri,
			state,
			scope: SCOPES
		});
		return `${AUTHORIZE_URL}?${params.toString()}`;
	},

	async exchangeCode(env, code, redirectUri) {
		if (!env.BOX_CLIENT_ID || !env.BOX_CLIENT_SECRET) throw new Error('Box is not configured');
		return tokenRequest(env.BOX_CLIENT_ID, env.BOX_CLIENT_SECRET, {
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri
		});
	},

	async refreshToken(env, refreshToken) {
		if (!env.BOX_CLIENT_ID || !env.BOX_CLIENT_SECRET) throw new Error('Box is not configured');
		return tokenRequest(env.BOX_CLIENT_ID, env.BOX_CLIENT_SECRET, {
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		});
	},

	async getOrCreateFolder(accessToken, path) {
		let parentId = '0'; // Box uses '0' as the root folder ID
		for (const segment of path) {
			const safe = segment.replace(/[/\\]/g, '_').slice(0, 200) || 'folder';
			const existing = await findChildFolder(accessToken, parentId, safe);
			parentId = existing ?? (await createFolder(accessToken, parentId, safe));
		}
		const last = path[path.length - 1] ?? 'CollectRelay';
		return { id: parentId, name: last };
	},

	async uploadFile(accessToken, folderId, filename, bytes, mimeType) {
		const attributes = JSON.stringify({
			name: filename,
			parent: { id: folderId }
		});

		const form = new FormData();
		form.append('attributes', attributes);
		form.append(
			'file',
			new Blob([bytes], { type: mimeType ?? 'application/octet-stream' }),
			filename
		);

		const res = await fetch(`${UPLOAD_BASE}/files/content`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${accessToken}` },
			body: form
		});

		if (res.ok) {
			const json = await res.json<{ entries: Array<{ id: string; name: string }> }>();
			const entry = json.entries[0];
			return {
				externalFileId: entry.id,
				externalPath: `/${filename}`
			} satisfies CloudUploadResult;
		}

		// 409 = filename collision in target folder. Box returns the conflicting
		// file in context_info; upload a versioned copy with a timestamp suffix.
		if (res.status === 409) {
			const dot = filename.lastIndexOf('.');
			const stem = dot > 0 ? filename.slice(0, dot) : filename;
			const ext = dot > 0 ? filename.slice(dot) : '';
			const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
			const renamed = `${stem}_${stamp}${ext}`;
			return boxProvider.uploadFile(accessToken, folderId, renamed, bytes, mimeType);
		}

		throw new Error(`Box upload failed: ${res.status} ${await res.text()}`);
	},

	async revoke(env, accessToken) {
		if (!env.BOX_CLIENT_ID || !env.BOX_CLIENT_SECRET) return;
		const params = new URLSearchParams({
			client_id: env.BOX_CLIENT_ID,
			client_secret: env.BOX_CLIENT_SECRET,
			token: accessToken
		});
		await fetch(REVOKE_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: params.toString()
		}).catch(() => {});
	}
};
