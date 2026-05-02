/** D1 access for cloud_connections + cloud_export_log */

import { generateId } from '$lib/server/auth';
import type { CloudConnection, CloudProviderKey, OAuthTokens } from '$lib/server/cloud/types';

export type { CloudConnection };

export async function getCloudConnection(
	db: D1Database,
	workspaceId: string,
	provider: CloudProviderKey
): Promise<CloudConnection | null> {
	return db
		.prepare(
			`SELECT * FROM cloud_connections WHERE workspace_id = ? AND provider = ?`
		)
		.bind(workspaceId, provider)
		.first<CloudConnection>();
}

export async function listCloudConnections(
	db: D1Database,
	workspaceId: string
): Promise<CloudConnection[]> {
	const result = await db
		.prepare(`SELECT * FROM cloud_connections WHERE workspace_id = ? ORDER BY provider`)
		.bind(workspaceId)
		.all<CloudConnection>();
	return result.results;
}

export async function upsertCloudConnection(
	db: D1Database,
	workspaceId: string,
	provider: CloudProviderKey,
	tokens: OAuthTokens,
	connectedBy: string
): Promise<void> {
	const existing = await getCloudConnection(db, workspaceId, provider);
	const now = new Date().toISOString();

	if (existing) {
		await db
			.prepare(
				`UPDATE cloud_connections
				 SET external_user_id = ?, external_account_email = ?,
				     access_token = ?, refresh_token = ?, token_expires_at = ?,
				     updated_at = ?
				 WHERE id = ?`
			)
			.bind(
				tokens.externalUserId,
				tokens.externalAccountEmail,
				tokens.accessToken,
				tokens.refreshToken,
				tokens.expiresAt,
				now,
				existing.id
			)
			.run();
		return;
	}

	await db
		.prepare(
			`INSERT INTO cloud_connections
			 (id, workspace_id, provider, external_user_id, external_account_email,
			  access_token, refresh_token, token_expires_at, connected_by, created_at, updated_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			generateId(),
			workspaceId,
			provider,
			tokens.externalUserId,
			tokens.externalAccountEmail,
			tokens.accessToken,
			tokens.refreshToken,
			tokens.expiresAt,
			connectedBy,
			now,
			now
		)
		.run();
}

export async function updateConnectionTokens(
	db: D1Database,
	connectionId: string,
	tokens: OAuthTokens
): Promise<void> {
	await db
		.prepare(
			`UPDATE cloud_connections
			 SET access_token = ?, refresh_token = ?, token_expires_at = ?, updated_at = ?
			 WHERE id = ?`
		)
		.bind(
			tokens.accessToken,
			tokens.refreshToken,
			tokens.expiresAt,
			new Date().toISOString(),
			connectionId
		)
		.run();
}

export async function deleteCloudConnection(
	db: D1Database,
	workspaceId: string,
	provider: CloudProviderKey
): Promise<boolean> {
	const result = await db
		.prepare(`DELETE FROM cloud_connections WHERE workspace_id = ? AND provider = ?`)
		.bind(workspaceId, provider)
		.run();
	return (result.meta?.changes ?? 0) > 0;
}

export async function logCloudExport(
	db: D1Database,
	row: {
		workspaceId: string;
		provider: CloudProviderKey;
		userId: string | null;
		fileId: string;
		transactionId: string;
		externalFileId: string | null;
		externalPath: string | null;
		status: 'success' | 'failed';
		error: string | null;
	}
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO cloud_export_log
			 (id, workspace_id, provider, user_id, file_id, transaction_id,
			  external_file_id, external_path, status, error)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			generateId(),
			row.workspaceId,
			row.provider,
			row.userId,
			row.fileId,
			row.transactionId,
			row.externalFileId,
			row.externalPath,
			row.status,
			row.error
		)
		.run();
}
