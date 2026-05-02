import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getProvider, getProviderConnection, getValidAccessToken } from '$lib/server/cloud';
import { logCloudExport } from '$lib/server/db/cloud-connections';
import { getVaultFilesByIds, type VaultFile } from '$lib/server/db/vault';

const MAX_FILES = 50;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024;
const ROOT_FOLDER = 'CollectRelay';

interface ExportResult {
	fileId: string;
	status: 'success' | 'failed';
	externalFileId?: string;
	externalPath?: string;
	error?: string;
}

export const POST: RequestHandler = async ({ params, request, locals, platform }) => {
	const env = platform?.env;
	const db = env?.DB;
	const bucket = env?.FILES_BUCKET;
	const user = locals.user;

	if (!env || !db || !bucket || !user?.workspaceId) throw error(401, 'Unauthorized');

	const provider = getProvider(params.provider);
	if (!provider) throw error(404, 'Unknown provider');

	const body = await request.json().catch(() => null);
	const fileIds = Array.isArray(body?.fileIds) ? (body.fileIds as string[]) : [];
	if (fileIds.length === 0) throw error(400, 'No fileIds provided');
	if (fileIds.length > MAX_FILES) throw error(413, `Too many files (max ${MAX_FILES})`);

	const connection = await getProviderConnection(db, user.workspaceId, provider.key);
	if (!connection) throw error(409, `${provider.displayName} is not connected`);

	const files = await getVaultFilesByIds(db, user.workspaceId, fileIds);
	if (files.length === 0) throw error(404, 'No matching files');

	const totalSize = files.reduce((sum, f) => sum + f.file_size, 0);
	if (totalSize > MAX_TOTAL_SIZE) {
		throw error(413, 'Total file size exceeds 500MB limit');
	}

	const accessToken = await getValidAccessToken(env, db, connection);

	const workspaceName = await db
		.prepare('SELECT name FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ name: string }>()
		.then((r) => r?.name ?? 'Workspace');

	// Group files by transaction to minimize folder lookups
	const filesByTxn = new Map<string, VaultFile[]>();
	for (const f of files) {
		const list = filesByTxn.get(f.transaction_id) ?? [];
		list.push(f);
		filesByTxn.set(f.transaction_id, list);
	}

	const results: ExportResult[] = [];

	for (const [, groupedFiles] of filesByTxn) {
		const txnTitle = groupedFiles[0].transaction_title || 'Transaction';
		let folder;
		try {
			folder = await provider.getOrCreateFolder(accessToken, [
				ROOT_FOLDER,
				workspaceName,
				txnTitle
			]);
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Folder creation failed';
			for (const f of groupedFiles) {
				results.push({ fileId: f.id, status: 'failed', error: msg });
				await logCloudExport(db, {
					workspaceId: user.workspaceId,
					provider: provider.key,
					userId: user.id,
					fileId: f.id,
					transactionId: f.transaction_id,
					externalFileId: null,
					externalPath: null,
					status: 'failed',
					error: msg
				});
			}
			continue;
		}

		for (const f of groupedFiles) {
			try {
				const r2obj = await bucket.get(f.r2_key);
				if (!r2obj) throw new Error('File missing from storage');
				const bytes = new Uint8Array(await r2obj.arrayBuffer());
				const upload = await provider.uploadFile(
					accessToken,
					folder.id,
					f.filename,
					bytes,
					f.mime_type
				);
				results.push({
					fileId: f.id,
					status: 'success',
					externalFileId: upload.externalFileId,
					externalPath: upload.externalPath
				});
				await logCloudExport(db, {
					workspaceId: user.workspaceId,
					provider: provider.key,
					userId: user.id,
					fileId: f.id,
					transactionId: f.transaction_id,
					externalFileId: upload.externalFileId,
					externalPath: upload.externalPath,
					status: 'success',
					error: null
				});
			} catch (err) {
				const msg = err instanceof Error ? err.message : 'Upload failed';
				results.push({ fileId: f.id, status: 'failed', error: msg });
				await logCloudExport(db, {
					workspaceId: user.workspaceId,
					provider: provider.key,
					userId: user.id,
					fileId: f.id,
					transactionId: f.transaction_id,
					externalFileId: null,
					externalPath: null,
					status: 'failed',
					error: msg
				});
			}
		}
	}

	const successCount = results.filter((r) => r.status === 'success').length;
	const failedCount = results.length - successCount;

	return json({
		provider: provider.key,
		successCount,
		failedCount,
		results
	});
};
