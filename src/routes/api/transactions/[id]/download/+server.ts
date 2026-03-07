import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactionById } from '$lib/server/db/transactions';
import { getFilesForTransaction } from '$lib/server/db/files';
import { zipSync } from 'fflate';

const MAX_FILES = 50;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket || !user?.workspaceId) throw error(401, 'Unauthorized');

	const transaction = await getTransactionById(db, params.id, user.workspaceId);
	if (!transaction) throw error(404, 'Transaction not found');

	const files = await getFilesForTransaction(db, params.id);
	if (files.length === 0) throw error(400, 'No files to download');
	if (files.length > MAX_FILES) throw error(413, `Too many files (max ${MAX_FILES})`);

	// Build item name lookup for folder organization
	const itemNameMap = new Map<string, string>();
	for (const item of transaction.items) {
		itemNameMap.set(item.id, item.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'item');
	}

	// Fetch all files from R2
	let totalSize = 0;
	const zipData: Record<string, Uint8Array> = {};
	const indexLines: string[] = [
		`CollectRelay Document Package`,
		`Transaction: ${transaction.title}`,
		`Client: ${transaction.client_name}`,
		`Exported: ${new Date().toISOString().split('T')[0]}`,
		``,
		`Files:`,
		`------`
	];

	for (const file of files) {
		totalSize += file.file_size;
		if (totalSize > MAX_TOTAL_SIZE) {
			throw error(413, 'Total file size exceeds 500MB limit');
		}

		const r2Object = await bucket.get(file.r2_key);
		if (!r2Object) continue;

		const data = new Uint8Array(await r2Object.arrayBuffer());
		const folderName = itemNameMap.get(file.checklist_item_id) || 'General';
		const filePath = `${folderName}/${file.filename}`;

		zipData[filePath] = data;
		indexLines.push(`  ${filePath} (${formatSize(file.file_size)})`);
	}

	// Add index file
	const indexContent = indexLines.join('\n');
	zipData['_index.txt'] = new TextEncoder().encode(indexContent);

	// Create ZIP (store mode for speed - no compression)
	const zipped = zipSync(zipData, { level: 0 });

	const safeName = transaction.title.replace(/[^a-zA-Z0-9]/g, '_');
	return new Response(zipped, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="${safeName}_documents.zip"`,
			'Content-Length': zipped.length.toString()
		}
	});
};

function formatSize(bytes: number): string {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
