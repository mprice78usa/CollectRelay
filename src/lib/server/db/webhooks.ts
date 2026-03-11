/** Webhook database operations */
import { generateId } from '$server/auth';

export interface DbWebhook {
	id: string;
	workspace_id: string;
	url: string;
	secret: string;
	events: string; // JSON array
	enabled: number;
	description: string | null;
	created_at: string;
	updated_at: string;
}

export interface DbWebhookDelivery {
	id: string;
	webhook_id: string;
	event_type: string;
	payload: string;
	response_status: number | null;
	response_body: string | null;
	success: number;
	duration_ms: number | null;
	created_at: string;
}

export async function getWebhooksForWorkspace(
	db: D1Database,
	workspaceId: string
): Promise<DbWebhook[]> {
	const result = await db
		.prepare('SELECT * FROM webhooks WHERE workspace_id = ? ORDER BY created_at DESC')
		.bind(workspaceId)
		.all<DbWebhook>();
	return result.results;
}

export async function getActiveWebhooksForEvent(
	db: D1Database,
	workspaceId: string,
	eventType: string
): Promise<DbWebhook[]> {
	// Filter enabled webhooks whose events JSON array contains the event type
	const result = await db
		.prepare(
			`SELECT * FROM webhooks
			 WHERE workspace_id = ? AND enabled = 1
			 AND events LIKE ?`
		)
		.bind(workspaceId, `%"${eventType}"%`)
		.all<DbWebhook>();
	return result.results;
}

export async function getWebhookById(
	db: D1Database,
	webhookId: string,
	workspaceId: string
): Promise<DbWebhook | null> {
	return db
		.prepare('SELECT * FROM webhooks WHERE id = ? AND workspace_id = ?')
		.bind(webhookId, workspaceId)
		.first<DbWebhook>();
}

export async function createWebhook(
	db: D1Database,
	data: {
		workspaceId: string;
		url: string;
		events: string[];
		description?: string;
		source?: string;
	}
): Promise<{ id: string; secret: string }> {
	const id = generateId();
	const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;

	await db
		.prepare(
			`INSERT INTO webhooks (id, workspace_id, url, secret, events, description, source)
			 VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(id, data.workspaceId, data.url, secret, JSON.stringify(data.events), data.description || null, data.source || null)
		.run();

	return { id, secret };
}

export async function updateWebhook(
	db: D1Database,
	webhookId: string,
	workspaceId: string,
	data: { url?: string; events?: string[]; enabled?: number; description?: string }
): Promise<void> {
	const sets: string[] = ["updated_at = datetime('now')"];
	const values: (string | number)[] = [];

	if (data.url !== undefined) {
		sets.push('url = ?');
		values.push(data.url);
	}
	if (data.events !== undefined) {
		sets.push('events = ?');
		values.push(JSON.stringify(data.events));
	}
	if (data.enabled !== undefined) {
		sets.push('enabled = ?');
		values.push(data.enabled);
	}
	if (data.description !== undefined) {
		sets.push('description = ?');
		values.push(data.description);
	}

	values.push(webhookId, workspaceId);

	await db
		.prepare(`UPDATE webhooks SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`)
		.bind(...values)
		.run();
}

export async function deleteWebhook(
	db: D1Database,
	webhookId: string,
	workspaceId: string
): Promise<void> {
	await db
		.prepare('DELETE FROM webhooks WHERE id = ? AND workspace_id = ?')
		.bind(webhookId, workspaceId)
		.run();
}

export async function regenerateWebhookSecret(
	db: D1Database,
	webhookId: string,
	workspaceId: string
): Promise<string> {
	const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`;
	await db
		.prepare("UPDATE webhooks SET secret = ?, updated_at = datetime('now') WHERE id = ? AND workspace_id = ?")
		.bind(secret, webhookId, workspaceId)
		.run();
	return secret;
}

export async function createDeliveryLog(
	db: D1Database,
	data: {
		webhookId: string;
		eventType: string;
		payload: string;
		responseStatus: number | null;
		responseBody: string | null;
		success: boolean;
		durationMs: number | null;
	}
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO webhook_deliveries (id, webhook_id, event_type, payload, response_status, response_body, success, duration_ms)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			generateId(),
			data.webhookId,
			data.eventType,
			data.payload,
			data.responseStatus,
			data.responseBody?.slice(0, 1000) || null,
			data.success ? 1 : 0,
			data.durationMs
		)
		.run();
}

export async function getRecentDeliveries(
	db: D1Database,
	webhookId: string,
	limit = 20
): Promise<DbWebhookDelivery[]> {
	const result = await db
		.prepare('SELECT * FROM webhook_deliveries WHERE webhook_id = ? ORDER BY created_at DESC LIMIT ?')
		.bind(webhookId, limit)
		.all<DbWebhookDelivery>();
	return result.results;
}
