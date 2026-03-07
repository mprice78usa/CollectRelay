import type { LayoutServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals }) => {
	const session = locals.clientSession;

	if (!session) {
		throw error(403, 'This link is invalid or has expired. Please contact the sender for a new link.');
	}

	return {
		clientSession: {
			clientName: session.clientName,
			clientEmail: session.clientEmail,
			transactionId: session.transactionId
		}
	};
};
