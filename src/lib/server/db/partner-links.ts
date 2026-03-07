/** Partner link database operations */
import { generateId } from '$server/auth';

export interface DbPartnerLink {
	id: string;
	transaction_id: string;
	partner_type: string;
	partner_name: string;
	partner_email: string;
	token: string;
	scope: string;
	created_by: string;
	created_at: string;
	expires_at: string;
}

export async function getPartnerLinksForTransaction(
	db: D1Database,
	transactionId: string
): Promise<DbPartnerLink[]> {
	const result = await db
		.prepare('SELECT * FROM partner_links WHERE transaction_id = ? ORDER BY created_at DESC')
		.bind(transactionId)
		.all<DbPartnerLink>();
	return result.results;
}

export async function createPartnerLink(
	db: D1Database,
	data: {
		transactionId: string;
		partnerType: string;
		partnerName: string;
		partnerEmail: string;
		createdBy: string;
		token: string;
		expiresAt: string;
	}
): Promise<string> {
	const id = generateId();
	await db
		.prepare(
			`INSERT INTO partner_links (id, transaction_id, partner_type, partner_name, partner_email, token, created_by, expires_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			data.transactionId,
			data.partnerType,
			data.partnerName,
			data.partnerEmail,
			data.token,
			data.createdBy,
			data.expiresAt
		)
		.run();
	return id;
}

export async function getPartnerLinkByToken(
	db: D1Database,
	token: string
): Promise<DbPartnerLink | null> {
	return db
		.prepare("SELECT * FROM partner_links WHERE token = ? AND expires_at > datetime('now')")
		.bind(token)
		.first<DbPartnerLink>();
}

export async function revokePartnerLink(
	db: D1Database,
	linkId: string,
	transactionId: string
): Promise<void> {
	await db
		.prepare('DELETE FROM partner_links WHERE id = ? AND transaction_id = ?')
		.bind(linkId, transactionId)
		.run();
}
