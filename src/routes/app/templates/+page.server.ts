import { getTemplatesForWorkspace, createTemplate, deleteTemplate, duplicateTemplate } from '$lib/server/db/templates';
import type { DbTemplate } from '$lib/server/db/templates';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mode: return mock templates
		const mockTemplates: DbTemplate[] = [
			{
				id: 'mock-tpl-1',
				workspace_id: 'dev-workspace',
				name: 'Pre-Approval Package',
				description: 'Standard docs needed for mortgage pre-approval',
				category: 'pre-approval',
				is_default: 0,
				created_by: 'dev-user',
				created_at: '2026-02-20T10:00:00Z',
				updated_at: '2026-02-20T10:00:00Z'
			},
			{
				id: 'mock-tpl-2',
				workspace_id: 'dev-workspace',
				name: 'Buyer Purchase Checklist',
				description: 'Full document checklist for buyer side of a purchase transaction',
				category: 'purchase',
				is_default: 0,
				created_by: 'dev-user',
				created_at: '2026-02-22T14:00:00Z',
				updated_at: '2026-02-22T14:00:00Z'
			},
			{
				id: 'mock-tpl-3',
				workspace_id: 'dev-workspace',
				name: 'Refinance Document Set',
				description: 'Docs required for refinance applications',
				category: 'refinance',
				is_default: 0,
				created_by: 'dev-user',
				created_at: '2026-02-25T09:00:00Z',
				updated_at: '2026-02-25T09:00:00Z'
			},
			{
				id: 'mock-tpl-4',
				workspace_id: 'dev-workspace',
				name: 'Seller Disclosure Package',
				description: 'Disclosure and listing documents for sellers',
				category: 'seller',
				is_default: 0,
				created_by: 'dev-user',
				created_at: '2026-03-01T11:00:00Z',
				updated_at: '2026-03-01T11:00:00Z'
			}
		];
		return { templates: mockTemplates };
	}

	const templates = await getTemplatesForWorkspace(db, workspaceId);
	return { templates };
};

export const actions: Actions = {
	create: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		if (!name) return fail(400, { error: 'Name is required' });

		const description = data.get('description')?.toString().trim() || undefined;
		const category = data.get('category')?.toString().trim() || 'custom';

		if (!db || !user) {
			// Dev mode: redirect to mock template editor
			throw redirect(303, '/app/templates/mock-tpl-new');
		}

		const id = await createTemplate(db, {
			workspaceId: user.workspaceId,
			name,
			description,
			category,
			createdBy: user.id
		});

		throw redirect(303, `/app/templates/${id}`);
	},

	delete: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) {
			// Dev mode: return success (no real DB to delete from)
			return { success: true };
		}

		const data = await request.formData();
		const templateId = data.get('id')?.toString();
		if (!templateId) return fail(400, { error: 'Template ID required' });

		await deleteTemplate(db, templateId, user.workspaceId);
		return { success: true };
	},

	duplicate: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) {
			// Dev mode: return success
			return { success: true };
		}

		const data = await request.formData();
		const templateId = data.get('id')?.toString();
		if (!templateId) return fail(400, { error: 'Template ID required' });

		await duplicateTemplate(db, templateId, user.workspaceId, user.id);
		return { success: true };
	}
};
