import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getTemplatesForWorkspace } from '$lib/server/db/templates';
import { createTransaction } from '$lib/server/db/transactions';
import { createAuditEvent } from '$lib/server/db/audit';
import { getBillingInfo } from '$lib/server/db/users';
import type { DbTemplate } from '$lib/server/db/templates';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mode: mock templates
		const mockTemplates: DbTemplate[] = [
			{
				id: 'mock-tpl-1',
				workspace_id: 'dev-workspace',
				name: 'Buyer Pre-Approval Package',
				description: 'Standard buyer documentation',
				category: 'real_estate',
				is_default: 0,
				created_by: 'dev-user',
				created_at: '2026-03-01',
				updated_at: '2026-03-01'
			},
			{
				id: 'mock-tpl-2',
				workspace_id: 'dev-workspace',
				name: 'Seller Listing Agreement',
				description: 'Seller documents for listing',
				category: 'real_estate',
				is_default: 0,
				created_by: 'dev-user',
				created_at: '2026-03-01',
				updated_at: '2026-03-01'
			}
		];
		return { templates: mockTemplates };
	}

	const templates = await getTemplatesForWorkspace(db, workspaceId);
	return { templates };
};

export const actions: Actions = {
	default: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;

		if (!db || !user?.workspaceId) {
			return fail(400, { error: 'Database not available' });
		}

		const formData = await request.formData();
		const templateId = formData.get('templateId') as string;
		const clientName = formData.get('clientName') as string;
		const clientEmail = formData.get('clientEmail') as string;
		const clientPhone = (formData.get('clientPhone') as string) || undefined;
		const title = formData.get('title') as string;
		const dueDate = (formData.get('dueDate') as string) || undefined;
		const salePriceStr = formData.get('salePrice') as string;
		const commissionRateStr = formData.get('commissionRate') as string;
		const commissionAmountStr = formData.get('commissionAmount') as string;
		const salePrice = salePriceStr ? parseFloat(salePriceStr) : undefined;
		const commissionRate = commissionRateStr ? parseFloat(commissionRateStr) : undefined;
		const commissionAmount = commissionAmountStr ? parseFloat(commissionAmountStr) : undefined;

		if (!templateId || !clientName || !clientEmail || !title) {
			return fail(400, { error: 'Template, client name, client email, and title are required.' });
		}

		// Trial gate: block new transactions if trial expired and no active subscription
		const billing = await getBillingInfo(db, user.workspaceId);
		if (billing.isTrialExpired && !billing.hasActiveSubscription) {
			return fail(403, { error: 'trial_expired' });
		}

		const transactionId = await createTransaction(db, {
			workspaceId: user.workspaceId,
			templateId,
			title,
			clientName,
			clientEmail,
			clientPhone,
			dueDate,
			salePrice,
			commissionRate,
			commissionAmount,
			createdBy: user.id
		});

		await createAuditEvent(db, {
			transactionId,
			actorType: 'pro',
			actorId: user.id,
			actorName: user.name,
			action: 'transaction_created',
			detail: `Created transaction "${title}" for ${clientName}`
		});

		throw redirect(303, `/app/transactions/${transactionId}`);
	}
};
