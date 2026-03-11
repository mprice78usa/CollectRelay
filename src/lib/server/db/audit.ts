/** Audit event database operations */
import { generateId } from '$server/auth';
import { dispatchWebhooks } from '$lib/server/webhook-dispatch';

export interface DispatchContext {
	env: App.Platform['env'];
	workspaceId: string;
	context?: ExecutionContext;
}

export interface DbAuditEvent {
	id: string;
	transaction_id: string;
	checklist_item_id: string | null;
	actor_type: string;
	actor_id: string | null;
	actor_name: string;
	action: string;
	detail: string | null;
	ip_address: string | null;
	user_agent: string | null;
	created_at: string;
}

export async function createAuditEvent(
	db: D1Database,
	data: {
		transactionId: string;
		checklistItemId?: string;
		actorType: 'pro' | 'client' | 'system';
		actorId?: string;
		actorName: string;
		action: string;
		detail?: string;
		ipAddress?: string;
		userAgent?: string;
	},
	dispatch?: DispatchContext
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO audit_events (id, transaction_id, checklist_item_id, actor_type, actor_id, actor_name, action, detail, ip_address, user_agent)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			generateId(),
			data.transactionId,
			data.checklistItemId || null,
			data.actorType,
			data.actorId || null,
			data.actorName,
			data.action,
			data.detail || null,
			data.ipAddress || null,
			data.userAgent || null
		)
		.run();

	// Dispatch webhooks if context provided
	if (dispatch) {
		const promise = dispatchWebhooks(dispatch.env, db, dispatch.workspaceId, data)
			.catch((err) => console.error('Webhook dispatch failed:', err));
		if (dispatch.context) {
			dispatch.context.waitUntil(promise);
		}
	}
}

export async function getAuditEventsForTransaction(
	db: D1Database,
	transactionId: string
): Promise<DbAuditEvent[]> {
	const result = await db
		.prepare('SELECT * FROM audit_events WHERE transaction_id = ? ORDER BY created_at DESC')
		.bind(transactionId)
		.all<DbAuditEvent>();
	return result.results;
}

export interface AuditEventWithTransaction extends DbAuditEvent {
	transaction_title: string;
}

export async function getRecentAuditEvents(
	db: D1Database,
	workspaceId: string,
	limit = 15
): Promise<AuditEventWithTransaction[]> {
	const result = await db
		.prepare(
			`SELECT ae.*, t.title as transaction_title
			 FROM audit_events ae
			 JOIN transactions t ON ae.transaction_id = t.id
			 WHERE t.workspace_id = ?
			 ORDER BY ae.created_at DESC
			 LIMIT ?`
		)
		.bind(workspaceId, limit)
		.all<AuditEventWithTransaction>();
	return result.results;
}
