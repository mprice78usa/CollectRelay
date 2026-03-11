/** API key database operations */
import { generateId } from '$server/auth';

export interface DbApiKey {
	id: string;
	workspace_id: string;
	name: string;
	key_prefix: string;
	key_hash: string;
	last_used_at: string | null;
	created_at: string;
	revoked_at: string | null;
}

export interface ApiKeyDisplay {
	id: string;
	name: string;
	keyPrefix: string;
	lastUsedAt: string | null;
	createdAt: string;
}

/**
 * Hash a plaintext API key with SHA-256.
 */
async function hashApiKey(plaintext: string): Promise<string> {
	const encoder = new TextEncoder();
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(plaintext));
	return Array.from(new Uint8Array(hashBuffer))
		.map(b => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Generate a new API key. Returns the plaintext key (shown once) and the DB record ID.
 */
export async function createApiKey(
	db: D1Database,
	data: { workspaceId: string; name: string }
): Promise<{ id: string; key: string; prefix: string }> {
	const id = generateId();

	// Generate cr_live_ + 32 hex chars
	const raw = crypto.getRandomValues(new Uint8Array(16));
	const hex = Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join('');
	const plaintext = `cr_live_${hex}`;
	const prefix = plaintext.slice(0, 16); // cr_live_ + 8 hex chars

	const keyHash = await hashApiKey(plaintext);

	await db
		.prepare(
			`INSERT INTO api_keys (id, workspace_id, name, key_prefix, key_hash)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(id, data.workspaceId, data.name, prefix, keyHash)
		.run();

	return { id, key: plaintext, prefix };
}

/**
 * List active (non-revoked) API keys for a workspace. Never returns the hash.
 */
export async function getApiKeysForWorkspace(
	db: D1Database,
	workspaceId: string
): Promise<ApiKeyDisplay[]> {
	const result = await db
		.prepare(
			`SELECT id, name, key_prefix, last_used_at, created_at
			 FROM api_keys
			 WHERE workspace_id = ? AND revoked_at IS NULL
			 ORDER BY created_at DESC`
		)
		.bind(workspaceId)
		.all<{ id: string; name: string; key_prefix: string; last_used_at: string | null; created_at: string }>();

	return result.results.map(row => ({
		id: row.id,
		name: row.name,
		keyPrefix: row.key_prefix,
		lastUsedAt: row.last_used_at,
		createdAt: row.created_at
	}));
}

/**
 * Look up a workspace by API key hash. Used by auth middleware.
 * Returns null if the key doesn't exist or is revoked.
 */
export async function getWorkspaceByApiKeyHash(
	db: D1Database,
	keyHash: string
): Promise<{ id: string; workspaceId: string } | null> {
	const row = await db
		.prepare(
			`SELECT id, workspace_id FROM api_keys
			 WHERE key_hash = ? AND revoked_at IS NULL`
		)
		.bind(keyHash)
		.first<{ id: string; workspace_id: string }>();

	if (!row) return null;
	return { id: row.id, workspaceId: row.workspace_id };
}

/**
 * Revoke an API key by setting revoked_at.
 */
export async function revokeApiKey(
	db: D1Database,
	keyId: string,
	workspaceId: string
): Promise<boolean> {
	const result = await db
		.prepare(
			`UPDATE api_keys SET revoked_at = datetime('now')
			 WHERE id = ? AND workspace_id = ? AND revoked_at IS NULL`
		)
		.bind(keyId, workspaceId)
		.run();

	return (result.meta?.changes ?? 0) > 0;
}

/**
 * Update last_used_at timestamp. Called by auth middleware on each API request.
 */
export async function updateApiKeyLastUsed(
	db: D1Database,
	keyId: string
): Promise<void> {
	await db
		.prepare("UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?")
		.bind(keyId)
		.run();
}

/**
 * Hash a plaintext API key for lookup. Exported for use in auth middleware.
 */
export { hashApiKey };
