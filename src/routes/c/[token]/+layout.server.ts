import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getWorkspaceBranding } from '$lib/server/db/users';

export const load: LayoutServerLoad = async ({ locals, platform }) => {
	const session = locals.clientSession;

	if (!session) {
		throw error(403, 'This link is invalid or has expired. Please contact the sender for a new link.');
	}

	// Load workspace branding for the client portal
	let branding: { brand_logo_r2_key: string | null; brand_color: string | null; brand_name: string | null } | null = null;
	const db = platform?.env?.DB;

	let workspaceId: string | null = null;

	if (db && session.transactionId) {
		const txn = await db
			.prepare('SELECT workspace_id FROM transactions WHERE id = ?')
			.bind(session.transactionId)
			.first<{ workspace_id: string }>();

		if (txn?.workspace_id) {
			workspaceId = txn.workspace_id;
			branding = await getWorkspaceBranding(db, txn.workspace_id);
		}
	}

	return {
		clientSession: {
			clientName: session.clientName,
			clientEmail: session.clientEmail,
			transactionId: session.transactionId
		},
		workspaceId,
		branding: branding ?? { brand_logo_r2_key: null, brand_color: null, brand_name: null }
	};
};
