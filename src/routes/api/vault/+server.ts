import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { listVaultFiles, type VaultCursor, type VaultFilters } from '$lib/server/db/vault';

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;

export const GET: RequestHandler = async ({ url, locals, platform }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const params = url.searchParams;
	const filters: VaultFilters = {};

	const transactionId = params.get('transactionId');
	if (transactionId) filters.transactionId = transactionId;

	const clientEmail = params.get('clientEmail');
	if (clientEmail) filters.clientEmail = clientEmail;

	const dateFrom = params.get('dateFrom');
	if (dateFrom) filters.dateFrom = dateFrom;

	const dateTo = params.get('dateTo');
	if (dateTo) filters.dateTo = dateTo;

	const mimePrefix = params.get('mimePrefix');
	if (mimePrefix) filters.mimePrefix = mimePrefix;

	const source = params.get('source');
	if (source === 'pro' || source === 'client') filters.source = source;

	const limitRaw = parseInt(params.get('limit') || String(DEFAULT_LIMIT), 10);
	const limit = Math.min(Math.max(1, isNaN(limitRaw) ? DEFAULT_LIMIT : limitRaw), MAX_LIMIT);

	let cursor: VaultCursor | null = null;
	const cursorParam = params.get('cursor');
	if (cursorParam) {
		try {
			const decoded = JSON.parse(atob(cursorParam));
			if (decoded?.createdAt && decoded?.id) {
				cursor = { createdAt: decoded.createdAt, id: decoded.id };
			}
		} catch {
			// invalid cursor, ignore
		}
	}

	const page = await listVaultFiles(db, user.workspaceId, filters, cursor, limit);

	const nextCursorEncoded = page.nextCursor
		? btoa(JSON.stringify(page.nextCursor))
		: null;

	return json({
		files: page.files.map((f) => ({
			id: f.id,
			filename: f.filename,
			fileSize: f.file_size,
			mimeType: f.mime_type,
			version: f.version,
			createdAt: f.created_at,
			uploadedByClient: f.uploaded_by_client === 1,
			transaction: {
				id: f.transaction_id,
				title: f.transaction_title,
				status: f.transaction_status,
				clientName: f.transaction_client_name,
				clientEmail: f.transaction_client_email
			},
			checklistItem: {
				id: f.checklist_item_id,
				name: f.checklist_item_name
			}
		})),
		nextCursor: nextCursorEncoded
	});
};
