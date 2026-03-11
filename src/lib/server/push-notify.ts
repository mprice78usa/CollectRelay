/**
 * Convenience function for sending push notifications to all subscribers
 * of a transaction. Used alongside email/SMS in review, comment, and reminder flows.
 */

import {
	getPushSubscriptionsForTransaction,
	deletePushSubscription
} from '$lib/server/db/push-subscriptions';
import { sendPushNotification, type VapidKeys } from '$lib/server/web-push';

export interface PushPayload {
	title: string;
	body: string;
	url?: string;
	tag?: string;
}

/**
 * Send a push notification to all subscribers of a transaction.
 * Automatically removes expired subscriptions (410 Gone).
 * Uses Promise.allSettled for partial failure tolerance.
 */
export async function pushNotifyTransaction(
	db: D1Database,
	transactionId: string,
	payload: PushPayload,
	vapidPublicKey: string,
	vapidPrivateKey: string
): Promise<{ sent: number; failed: number; expired: number }> {
	const subscriptions = await getPushSubscriptionsForTransaction(db, transactionId);

	if (subscriptions.length === 0) {
		return { sent: 0, failed: 0, expired: 0 };
	}

	const vapidKeys: VapidKeys = {
		publicKey: vapidPublicKey,
		privateKey: vapidPrivateKey
	};

	const results = await Promise.allSettled(
		subscriptions.map(async (sub) => {
			const result = await sendPushNotification(
				{
					endpoint: sub.endpoint,
					p256dh: sub.p256dh,
					auth: sub.auth
				},
				payload,
				vapidKeys
			);

			// Remove expired subscriptions
			if (result.gone) {
				await deletePushSubscription(db, sub.endpoint);
			}

			return result;
		})
	);

	let sent = 0;
	let failed = 0;
	let expired = 0;

	for (const result of results) {
		if (result.status === 'fulfilled') {
			if (result.value.success) {
				sent++;
			} else if (result.value.gone) {
				expired++;
			} else {
				failed++;
			}
		} else {
			failed++;
		}
	}

	return { sent, failed, expired };
}
