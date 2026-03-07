import { dev } from '$app/environment';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, platform }) => {
	if (dev) {
		// Dev mode: mock partner session
		return {
			partnerSession: {
				partnerName: 'Mike Chen',
				partnerType: 'lender',
				transactionId: 'mock-txn-1',
				token: params.token
			}
		};
	}

	const db = platform?.env?.DB;
	if (!db) return { partnerSession: null };

	const { getPartnerLinkByToken } = await import('$lib/server/db/partner-links');
	const link = await getPartnerLinkByToken(db, params.token);

	if (!link) {
		return { partnerSession: null };
	}

	return {
		partnerSession: {
			partnerName: link.partner_name,
			partnerType: link.partner_type,
			transactionId: link.transaction_id,
			token: params.token
		}
	};
};
