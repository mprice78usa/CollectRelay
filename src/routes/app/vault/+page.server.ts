import { listVaultFiles, getVaultStats } from '$lib/server/db/vault';
import { listAllProviders } from '$lib/server/cloud';
import { listCloudConnections } from '$lib/server/db/cloud-connections';
import type { PageServerLoad } from './$types';

const PAGE_LIMIT = 50;

export const load: PageServerLoad = async ({ locals, platform, url }) => {
	const db = platform?.env?.DB;
	const user = locals.user;

	const filters = {
		transactionId: url.searchParams.get('transactionId') || undefined,
		clientEmail: url.searchParams.get('clientEmail') || undefined,
		dateFrom: url.searchParams.get('dateFrom') || undefined,
		dateTo: url.searchParams.get('dateTo') || undefined,
		mimePrefix: url.searchParams.get('mimePrefix') || undefined,
		source: (url.searchParams.get('source') as 'pro' | 'client' | null) || undefined
	};

	if (!db || !user?.workspaceId) {
		// Dev mode: mock data
		return {
			files: [],
			nextCursor: null,
			stats: { total_files: 0, total_size: 0, pro_count: 0, client_count: 0 },
			filters,
			cloudProviders: [] as Array<{ key: string; displayName: string; connected: boolean }>
		};
	}

	const cleanFilters = Object.fromEntries(
		Object.entries(filters).filter(([, v]) => v !== undefined && v !== null && v !== '')
	) as typeof filters;

	const [page, stats, connections] = await Promise.all([
		listVaultFiles(db, user.workspaceId, cleanFilters, null, PAGE_LIMIT),
		getVaultStats(db, user.workspaceId),
		listCloudConnections(db, user.workspaceId)
	]);

	const connectedKeys = new Set(connections.map((c) => c.provider));
	const cloudProviders = listAllProviders()
		.filter((p) => p.isConfigured(platform!.env))
		.map((p) => ({
			key: p.key,
			displayName: p.displayName,
			connected: connectedKeys.has(p.key)
		}));

	const nextCursorEncoded = page.nextCursor
		? btoa(JSON.stringify(page.nextCursor))
		: null;

	return {
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
		nextCursor: nextCursorEncoded,
		stats,
		filters,
		cloudProviders
	};
};
