import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getVaultFilesByIds } from '$lib/server/db/vault';
import { zipSync } from 'fflate';

const MAX_FILES = 100;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket || !user?.workspaceId) throw error(401, 'Unauthorized');

	const body = await request.json().catch(() => null);
	const fileIds = Array.isArray(body?.fileIds) ? (body.fileIds as string[]) : [];

	if (fileIds.length === 0) throw error(400, 'No fileIds provided');
	if (fileIds.length > MAX_FILES) throw error(413, `Too many files (max ${MAX_FILES})`);

	const files = await getVaultFilesByIds(db, user.workspaceId, fileIds);
	if (files.length === 0) throw error(404, 'No matching files');

	let totalSize = 0;
	const zipData: Record<string, Uint8Array> = {};
	const indexLines: string[] = [
		`CollectRelay Vault Export`,
		`Workspace: ${user.workspaceId}`,
		`Exported by: ${user.name} <${user.email}>`,
		`Exported: ${new Date().toISOString()}`,
		``,
		`Files (${files.length}):`,
		`------`
	];

	const usedNames = new Set<string>();

	for (const file of files) {
		totalSize += file.file_size;
		if (totalSize > MAX_TOTAL_SIZE) {
			throw error(413, 'Total file size exceeds 500MB limit');
		}

		const r2Object = await bucket.get(file.r2_key);
		if (!r2Object) continue;

		const data = new Uint8Array(await r2Object.arrayBuffer());
		const txnFolder = sanitizeFolder(file.transaction_title) || 'Transaction';
		const itemFolder = sanitizeFolder(file.checklist_item_name || 'General');

		let path = `${txnFolder}/${itemFolder}/${file.filename}`;
		if (usedNames.has(path)) {
			const dot = file.filename.lastIndexOf('.');
			const stem = dot > 0 ? file.filename.slice(0, dot) : file.filename;
			const ext = dot > 0 ? file.filename.slice(dot) : '';
			path = `${txnFolder}/${itemFolder}/${stem}_v${file.version}${ext}`;
		}
		usedNames.add(path);

		zipData[path] = data;
		indexLines.push(`  ${path} (${formatSize(file.file_size)}, v${file.version})`);
	}

	zipData['_index.txt'] = new TextEncoder().encode(indexLines.join('\n'));

	const zipped = zipSync(zipData, { level: 0 });
	const filename = `vault-export-${new Date().toISOString().slice(0, 10)}.zip`;

	return new Response(zipped, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${filename}"`,
			'Content-Length': zipped.length.toString()
		}
	});
};

function sanitizeFolder(name: string): string {
	return name.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 80);
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
