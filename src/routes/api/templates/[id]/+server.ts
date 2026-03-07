import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTemplateById } from '$lib/server/db/templates';
import type { DbTemplateItem } from '$lib/server/db/templates';

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mode: return mock items
		const mockItems: DbTemplateItem[] = [
			{
				id: 'mock-item-1',
				template_id: params.id,
				name: 'Government-issued ID',
				description: 'Drivers license or passport',
				item_type: 'document',
				required: 1,
				sort_order: 0,
				allowed_file_types: null,
				max_file_size: null,
				example_text: null
			},
			{
				id: 'mock-item-2',
				template_id: params.id,
				name: 'Proof of income',
				description: 'Recent pay stubs or tax return',
				item_type: 'document',
				required: 1,
				sort_order: 1,
				allowed_file_types: null,
				max_file_size: null,
				example_text: null
			},
			{
				id: 'mock-item-3',
				template_id: params.id,
				name: 'Confirm mailing address',
				description: 'Your current mailing address',
				item_type: 'question',
				required: 1,
				sort_order: 2,
				allowed_file_types: null,
				max_file_size: null,
				example_text: null
			}
		];
		return json({ items: mockItems });
	}

	const template = await getTemplateById(db, params.id, workspaceId);
	if (!template) {
		throw error(404, 'Template not found');
	}

	return json({ items: template.items });
};
