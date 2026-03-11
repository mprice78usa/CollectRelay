/**
 * Push subscription DB helpers for Web Push notifications.
 */

export interface PushSubscription {
	id: string;
	workspaceId: string;
	transactionId: string | null;
	clientEmail: string | null;
	endpoint: string;
	p256dh: string;
	auth: string;
	createdAt: string;
}

export async function savePushSubscription(
	db: D1Database,
	params: {
		workspaceId: string;
		transactionId?: string;
		clientEmail?: string;
		endpoint: string;
		p256dh: string;
		auth: string;
	}
): Promise<string> {
	// Upsert by endpoint — if same browser re-subscribes, update keys
	const existing = await db
		.prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?')
		.bind(params.endpoint)
		.first<{ id: string }>();

	if (existing) {
		await db
			.prepare(
				'UPDATE push_subscriptions SET p256dh = ?, auth = ?, workspace_id = ?, transaction_id = ?, client_email = ? WHERE id = ?'
			)
			.bind(
				params.p256dh,
				params.auth,
				params.workspaceId,
				params.transactionId || null,
				params.clientEmail || null,
				existing.id
			)
			.run();
		return existing.id;
	}

	const id = crypto.randomUUID();
	await db
		.prepare(
			'INSERT INTO push_subscriptions (id, workspace_id, transaction_id, client_email, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?, ?, ?)'
		)
		.bind(
			id,
			params.workspaceId,
			params.transactionId || null,
			params.clientEmail || null,
			params.endpoint,
			params.p256dh,
			params.auth
		)
		.run();
	return id;
}

export async function getPushSubscriptionsForTransaction(
	db: D1Database,
	transactionId: string
): Promise<PushSubscription[]> {
	const result = await db
		.prepare('SELECT * FROM push_subscriptions WHERE transaction_id = ?')
		.bind(transactionId)
		.all<{
			id: string;
			workspace_id: string;
			transaction_id: string | null;
			client_email: string | null;
			endpoint: string;
			p256dh: string;
			auth: string;
			created_at: string;
		}>();

	return result.results.map((r) => ({
		id: r.id,
		workspaceId: r.workspace_id,
		transactionId: r.transaction_id,
		clientEmail: r.client_email,
		endpoint: r.endpoint,
		p256dh: r.p256dh,
		auth: r.auth,
		createdAt: r.created_at
	}));
}

export async function deletePushSubscription(
	db: D1Database,
	endpoint: string
): Promise<void> {
	await db
		.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?')
		.bind(endpoint)
		.run();
}
