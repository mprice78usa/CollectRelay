import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getWebhookById, createDeliveryLog } from '$lib/server/db/webhooks';
import { generateId } from '$lib/server/auth';

export const POST: RequestHandler = async ({ params, platform, locals }) => {
	const db = platform?.env?.DB;
	if (!db || !locals.user) throw error(401, 'Unauthorized');

	const webhook = await getWebhookById(db, params.id, locals.user.workspaceId);
	if (!webhook) throw error(404, 'Webhook not found');

	// Build test payload
	const timestamp = Math.floor(Date.now() / 1000);
	const payload = {
		id: `evt_${generateId()}`,
		type: 'test',
		created_at: new Date().toISOString(),
		data: {
			transaction_id: 'test-txn',
			checklist_item_id: null,
			actor: { type: 'system', name: 'CollectRelay' },
			detail: 'This is a test webhook delivery.'
		}
	};
	const payloadJson = JSON.stringify(payload);

	// Sign it
	const signedPayload = `${timestamp}.${payloadJson}`;
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw', encoder.encode(webhook.secret),
		{ name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
	);
	const sigBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
	const signature = Array.from(new Uint8Array(sigBytes)).map((b) => b.toString(16).padStart(2, '0')).join('');

	// Send
	const start = Date.now();
	let responseStatus: number | null = null;
	let responseBody: string | null = null;
	let success = false;

	try {
		const response = await fetch(webhook.url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-CollectRelay-Signature': `t=${timestamp},v1=${signature}`,
				'X-CollectRelay-Event': 'test',
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

	await createDeliveryLog(db, {
		webhookId: webhook.id,
		eventType: 'test',
		payload: payloadJson,
		responseStatus,
		responseBody,
		success,
		durationMs
	});

	return json({ success, responseStatus, durationMs });
};
