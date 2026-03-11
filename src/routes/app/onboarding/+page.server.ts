import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getTemplatesForWorkspace } from '$lib/server/db/templates';
import { createTransaction } from '$lib/server/db/transactions';
import { createAuditEvent } from '$lib/server/db/audit';
import { updateUser, markOnboardingComplete, getBillingInfo } from '$lib/server/db/users';
import type { DbTemplate } from '$lib/server/db/templates';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mode: mock templates
		const mockTemplates: DbTemplate[] = [
			{
				id: 'mock-tpl-1', workspace_id: 'dev-workspace', name: 'Pre-Approval (Fast)',
				description: 'Quick pre-approval document collection for borrowers.',
				category: 'pre_approval', is_default: 0, created_by: 'dev-user',
				created_at: '2026-03-01', updated_at: '2026-03-01'
			},
			{
				id: 'mock-tpl-2', workspace_id: 'dev-workspace', name: 'Purchase (Standard)',
				description: 'Full document collection for a home purchase transaction.',
				category: 'purchase', is_default: 0, created_by: 'dev-user',
				created_at: '2026-03-01', updated_at: '2026-03-01'
			},
			{
				id: 'mock-tpl-3', workspace_id: 'dev-workspace', name: 'Refinance',
				description: 'Document collection for refinance transactions.',
				category: 'refinance', is_default: 0, created_by: 'dev-user',
				created_at: '2026-03-01', updated_at: '2026-03-01'
			},
			{
				id: 'mock-tpl-4', workspace_id: 'dev-workspace', name: 'Seller Packet',
				description: 'Listing and disclosure documents for sellers.',
				category: 'seller', is_default: 0, created_by: 'dev-user',
				created_at: '2026-03-01', updated_at: '2026-03-01'
			}
		];
		return {
			templates: mockTemplates,
			userName: locals.user?.name || 'Dev User',
			userCompany: null as string | null,
			userPhone: null as string | null
		};
	}

	const templates = await getTemplatesForWorkspace(db, workspaceId);

	// Load user profile for pre-filling step 1
	const userRow = await db
		.prepare('SELECT name, company, phone FROM users WHERE id = ?')
		.bind(locals.user!.id)
		.first<{ name: string; company: string | null; phone: string | null }>();

	return {
		templates,
		userName: userRow?.name || locals.user!.name,
		userCompany: userRow?.company || null,
		userPhone: userRow?.phone || null
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user) {
			// Dev mode: skip DB write, just advance step
			const formData = await request.formData();
			const name = (formData.get('name') as string)?.trim();
			if (!name) return fail(400, { error: 'Name is required', step: 1 });
			return { success: true, step: 2 };
		}

		const formData = await request.formData();
		const name = (formData.get('name') as string)?.trim();
		const company = (formData.get('company') as string)?.trim() || undefined;
		const phone = (formData.get('phone') as string)?.trim() || undefined;

		if (!name) return fail(400, { error: 'Name is required', step: 1 });

		await updateUser(db, user.id, { name, company, phone });

		return { success: true, step: 2 };
	},

	createFirstTransaction: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) {
			// Dev mode: redirect to dashboard
			throw redirect(303, '/app');
		}

		const formData = await request.formData();
		const templateId = formData.get('templateId') as string;
		const clientName = (formData.get('clientName') as string)?.trim();
		const clientEmail = (formData.get('clientEmail') as string)?.trim();
		const title = (formData.get('title') as string)?.trim();

		if (!templateId || !clientName || !clientEmail || !title) {
			return fail(400, { error: 'All fields are required', step: 3 });
		}

		// Trial gate
		const billing = await getBillingInfo(db, user.workspaceId);
		if (billing.isTrialExpired && !billing.hasActiveSubscription) {
			return fail(403, { error: 'trial_expired', step: 3 });
		}

		const transactionId = await createTransaction(db, {
			workspaceId: user.workspaceId,
			templateId,
			title,
			clientName,
			clientEmail,
			createdBy: user.id
		});

		await createAuditEvent(db, {
			transactionId,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'transaction_created',
			detail: `Created transaction "${title}" for ${clientName} (onboarding)`
		});

		// Mark onboarding complete
		await markOnboardingComplete(db, user.workspaceId);

		throw redirect(303, `/app/transactions/${transactionId}`);
	},

	skip: async ({ locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) {
			// Dev mode: redirect to dashboard
			throw redirect(303, '/app');
		}

		await markOnboardingComplete(db, user.workspaceId);

		throw redirect(303, '/app');
	}
};
