import type { RequestHandler } from './$types';
import { getTemplatesForWorkspace } from '$lib/server/db/templates';
import { apiSuccess, apiError } from '$lib/server/api-response';

export const GET: RequestHandler = async ({ locals, platform }) => {
	const apiKey = locals.apiKey;
	if (!apiKey) return apiError(401, 'API key required');

	const db = platform?.env?.DB;
	if (!db) return apiError(503, 'Service unavailable');

	const templates = await getTemplatesForWorkspace(db, apiKey.workspaceId);

	const data = templates.map(t => ({
		id: t.id,
		name: t.name,
		description: t.description,
		category: t.category,
		isDefault: !!t.is_default,
		createdAt: t.created_at,
		updatedAt: t.updated_at,
		items: t.items?.map(item => ({
			id: item.id,
			name: item.name,
			description: item.description,
			itemType: item.item_type,
			required: !!item.required,
			sortOrder: item.sort_order
		})) || []
	}));

	return apiSuccess(data);
};
