/** Webhook dispatch — sign and send event payloads to registered webhook URLs */
import { getActiveWebhooksForEvent, createDeliveryLog } from '$lib/server/db/webhooks';
import { generateId } from '$server/auth';

interface AuditEventData {
	transactionId: string;
	checklistItemId?: string;
	actorType: string;
	actorName: string;
	action: string;
	detail?: string;
}

interface WebhookPayload {
	id: string;
	type: string;
	created_at: string;
	data: {
		transaction_id: string;
		checklist_item_id: string | null;
		actor: { type: string; name: string };
		detail: string | null;
	};
}

/** Sign a payload using HMAC-SHA256 (mirrors Stripe's signature pattern) */
async function signPayload(payload: string, secret: string, timestamp: number): Promise<string> {
	const signedPayload = `${timestamp}.${payload}`;
	const encoder = new TextEncoder();

	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);

	const signatureBytes = await crypto.subtle.sign(
		'HMAC',
		key,
		encoder.encode(signedPayload)
	);

	return Array.from(new Uint8Array(signatureBytes))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function buildPayload(event: AuditEventData): WebhookPayload {
	return {
		id: `evt_${generateId()}`,
		type: event.action,
		created_at: new Date().toISOString(),
		data: {
			transaction_id: event.transactionId,
			checklist_item_id: event.checklistItemId || null,
			actor: { type: event.actorType, name: event.actorName },
			detail: event.detail || null
		}
	};
}

/** Dispatch webhooks for an audit event — fire-and-forget, logs results */
export async function dispatchWebhooks(
	env: App.Platform['env'],
	db: D1Database,
	workspaceId: string,
	event: AuditEventData
): Promise<void> {
	const webhooks = await getActiveWebhooksForEvent(db, workspaceId, event.action);
	if (webhooks.length === 0) return;

	const payload = buildPayload(event);
	const payloadJson = JSON.stringify(payload);
	const timestamp = Math.floor(Date.now() / 1000);

	await Promise.allSettled(
		webhooks.map(async (webhook) => {
			const start = Date.now();
			let responseStatus: number | null = null;
			let responseBody: string | null = null;
			let success = false;

			try {
				const signature = await signPayload(payloadJson, webhook.secret, timestamp);

				const response = await fetch(webhook.url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-CollectRelay-Signature': `t=${timestamp},v1=${signature}`,
						'X-CollectRelay-Event': event.action,
						'User-Agent': 'CollectRelay-Webhooks/1.0'
					},
					body: payloadJson,
					signal: AbortSignal.timeout(10000)
				});

				responseStatus = response.status;
				responseBody = await response.text().catch(() => null);
				success = response.ok;
			} catch (err) {
				responseBody = err instanceof Error ? err.message : 'Unknown error';
			}

			const durationMs = Date.now() - start;

			try {
				await createDeliveryLog(db, {
					webhookId: webhook.id,
					eventType: event.action,
					payload: payloadJson,
					responseStatus,
					responseBody,
					success,
					durationMs
				});
			} catch (logErr) {
				console.error('Failed to log webhook delivery:', logErr);
			}
		})
	);
}
