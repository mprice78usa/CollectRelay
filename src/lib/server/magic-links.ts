/** Magic link generation and validation */

interface MagicLinkData {
	transactionId: string;
	clientEmail: string;
	clientName: string;
}

export async function generateMagicLink(
	env: App.Platform['env'],
	data: MagicLinkData
): Promise<string> {
	// Generate 64-char hex token
	const bytes = new Uint8Array(32);
	crypto.getRandomValues(bytes);
	const token = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	// Store in KV with 72h TTL
	const kvData = JSON.stringify({
		transactionId: data.transactionId,
		clientEmail: data.clientEmail,
		clientName: data.clientName,
		createdAt: new Date().toISOString()
	});

	await env.MAGIC_LINKS.put(token, kvData, {
		expirationTtl: 72 * 60 * 60 // 72 hours
	});

	// Also store in D1 for audit trail
	const { generateId } = await import('$server/auth');
	const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

	await env.DB.prepare(
		`INSERT INTO client_sessions (token, transaction_id, client_email, expires_at)
		 VALUES (?, ?, ?, ?)`
	)
		.bind(token, data.transactionId, data.clientEmail, expiresAt)
		.run();

	return token;
}

export interface ClientSession {
	transactionId: string;
	clientEmail: string;
	clientName: string;
	createdAt: string;
}

export async function validateMagicLink(
	env: App.Platform['env'],
	token: string
): Promise<ClientSession | null> {
	const kvData = await env.MAGIC_LINKS.get(token);
	if (!kvData) return null;

	try {
		return JSON.parse(kvData) as ClientSession;
	} catch {
		return null;
	}
}
