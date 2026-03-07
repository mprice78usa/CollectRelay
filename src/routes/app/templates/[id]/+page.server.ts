import {
	getTemplateById,
	updateTemplate,
	addTemplateItem,
	updateTemplateItem,
	deleteTemplateItem
} from '$lib/server/db/templates';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mode: return mock template
		return {
			template: {
				id: params.id,
				workspace_id: 'dev-workspace',
				name: 'Sample Template',
				description: 'This is a mock template for development.',
				category: 'custom',
				is_default: 0,
				created_by: 'dev-user',
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				items: [
					{
						id: 'item-1',
						template_id: params.id,
						name: 'Government-issued ID',
						description: 'Driver license, passport, or state ID',
						item_type: 'document',
						required: 1,
						sort_order: 0,
						allowed_file_types: null,
						max_file_size: null,
						example_text: null
					},
					{
						id: 'item-2',
						template_id: params.id,
						name: 'Proof of income',
						description: 'Pay stubs or tax returns',
						item_type: 'document',
						required: 1,
						sort_order: 1,
						allowed_file_types: null,
						max_file_size: null,
						example_text: null
					}
				]
			}
		};
	}

	const template = await getTemplateById(db, params.id, workspaceId);
	if (!template) throw error(404, 'Template not found');

	return { template };
};

export const actions: Actions = {
	update: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const description = data.get('description')?.toString().trim();
		const category = data.get('category')?.toString().trim();

		if (!name) return fail(400, { error: 'Name is required' });

		await updateTemplate(db, params.id, user.workspaceId, { name, description, category });
		return { success: true };
	},

	addItem: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'Item name is required' });

		const description = data.get('description')?.toString().trim() || undefined;
		const itemType = data.get('item_type')?.toString() || 'document';
		const required = data.get('required') !== 'false';

		// Get next sort order
		const template = await getTemplateById(db, params.id, user.workspaceId);
		const nextOrder = template ? template.items.length : 0;

		await addTemplateItem(db, {
			templateId: params.id,
			name,
			description,
			itemType,
			required,
			sortOrder: nextOrder
		});

		return { success: true };
	},

	updateItem: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const itemId = data.get('itemId')?.toString();
		if (!itemId) return fail(400, { error: 'Item ID required' });

		const name = data.get('name')?.toString().trim();
		const description = data.get('description')?.toString().trim();
		const itemType = data.get('item_type')?.toString();
		const requiredStr = data.get('required')?.toString();

		await updateTemplateItem(db, itemId, {
			name: name || undefined,
			description: description !== undefined ? description : undefined,
			itemType: itemType || undefined,
			required: requiredStr !== undefined ? requiredStr !== 'false' : undefined
		});

		return { success: true };
	},

	moveItem: async ({ request, params, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const itemId = data.get('itemId')?.toString();
		const direction = data.get('direction')?.toString();
		if (!itemId || !direction) return fail(400, { error: 'Item ID and direction required' });

		const template = await getTemplateById(db, params.id, user.workspaceId);
		if (!template) return fail(404, { error: 'Template not found' });

		const items = template.items;
		const idx = items.findIndex((i) => i.id === itemId);
		if (idx === -1) return fail(400, { error: 'Item not found' });

		const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
		if (swapIdx < 0 || swapIdx >= items.length) return fail(400, { error: 'Cannot move further' });

		// Swap sort_order values
		await updateTemplateItem(db, items[idx].id, { sortOrder: items[swapIdx].sort_order });
		await updateTemplateItem(db, items[swapIdx].id, { sortOrder: items[idx].sort_order });

		return { success: true };
	},

	deleteItem: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const itemId = data.get('itemId')?.toString();
		if (!itemId) return fail(400, { error: 'Item ID required' });

		await deleteTemplateItem(db, itemId);
		return { success: true };
	}
};
