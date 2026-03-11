import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactionsByIds } from '$lib/server/db/transactions';
import { getFilesForTransaction } from '$lib/server/db/files';
import { zipSync } from 'fflate';

const MAX_FILES = 50;
const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB
const MAX_TRANSACTIONS = 50;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket || !user?.workspaceId) throw error(401, 'Unauthorized');

	const body = await request.json();
	const { transactionIds } = body as { transactionIds: string[] };

	if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
		throw error(400, 'No transactions selected');
	}

	if (transactionIds.length > MAX_TRANSACTIONS) {
		throw error(400, `Maximum ${MAX_TRANSACTIONS} transactions per download`);
	}

	// Fetch all transactions and verify ownership
	const transactions = await getTransactionsByIds(db, transactionIds, user.workspaceId);
	if (transactions.length === 0) throw error(404, 'No transactions found');

	// Build item name lookups per transaction
	const zipData: Record<string, Uint8Array> = {};
	const indexLines: string[] = [
		`CollectRelay Bulk Document Package`,
		`Exported: ${new Date().toISOString().split('T')[0]}`,
		`Transactions: ${transactions.length}`,
		``
	];

	let totalSize = 0;
	let totalFileCount = 0;

	for (const txn of transactions) {
		const files = await getFilesForTransaction(db, txn.id);
		if (files.length === 0) continue;

		const safeTxnName = txn.title.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'Transaction';

		// Get checklist items for folder names
		const items = await db
			.prepare('SELECT id, name FROM checklist_items WHERE transaction_id = ? ORDER BY sort_order')
			.bind(txn.id)
			.all<{ id: string; name: string }>();

		const itemNameMap = new Map<string, string>();
		for (const item of items.results) {
			itemNameMap.set(item.id, item.name.replace(/[^a-zA-Z0-9 _-]/g, '').trim() || 'item');
		}

		indexLines.push(`--- ${txn.title} (${txn.client_name}) ---`);

		for (const file of files) {
			totalFileCount++;
			if (totalFileCount > MAX_FILES) {
				throw error(413, `Too many files across all transactions (max ${MAX_FILES})`);
			}

			totalSize += file.file_size;
			if (totalSize > MAX_TOTAL_SIZE) {
				throw error(413, 'Total file size exceeds 500MB limit');
			}

			const r2Object = await bucket.get(file.r2_key);
			if (!r2Object) continue;

			const data = new Uint8Array(await r2Object.arrayBuffer());
			const folderName = itemNameMap.get(file.checklist_item_id) || 'General';
			const filePath = `${safeTxnName}/${folderName}/${file.filename}`;

			zipData[filePath] = data;
			indexLines.push(`  ${filePath} (${formatSize(file.file_size)})`);
		}

		indexLines.push('');
	}

	if (Object.keys(zipData).length === 0) {
		throw error(400, 'No files to download across selected transactions');
	}

	// Add index file
	zipData['_index.txt'] = new TextEncoder().encode(indexLines.join('\n'));

	// Create ZIP (store mode for speed)
	const zipped = zipSync(zipData, { level: 0 });

	return new Response(zipped, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="CollectRelay_Documents.zip"`,
			'Content-Length': zipped.length.toString()
		}
	});
};

function formatSize(bytes: number): string {
	if (bytes < 1024) return bytes + ' B';
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
	return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
