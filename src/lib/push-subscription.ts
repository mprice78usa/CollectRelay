/**
 * Client-side helpers for service worker registration and push subscription.
 * Used in the client portal (/c/[token]) to enable real push notifications.
 */

/**
 * Check if push notifications are supported in this browser.
 */
export function isPushSupported(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'PushManager' in window
	);
}

/**
 * Register the service worker. Returns the registration if successful.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
	if (!('serviceWorker' in navigator)) return null;

	try {
		const registration = await navigator.serviceWorker.register('/sw.js');
		return registration;
	} catch {
		console.warn('Service worker registration failed');
		return null;
	}
}

/**
 * Subscribe to push notifications.
 * 1. Fetches the VAPID public key from the server
 * 2. Calls pushManager.subscribe() (triggers browser permission prompt)
 * 3. Sends the subscription to /api/push/subscribe
 *
 * Returns 'granted' if successful, 'denied' if user declined, 'default' if not decided.
 */
export async function subscribeToPush(
	registration: ServiceWorkerRegistration
): Promise<NotificationPermission> {
	try {
		// Check existing subscription
		const existing = await registration.pushManager.getSubscription();
		if (existing) {
			// Already subscribed — just re-send to server in case it was lost
			await sendSubscriptionToServer(existing);
			return 'granted';
		}

		// Fetch VAPID public key
		const response = await fetch('/api/push/vapid-key');
		const { key } = await response.json();

		if (!key) {
			// VAPID not configured (dev mode) — fall back to basic notification
			if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
				return await Notification.requestPermission();
			}
			return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
		}

		// Convert VAPID key from base64url to Uint8Array
		const applicationServerKey = urlBase64ToUint8Array(key);

		// Subscribe — this triggers the browser permission prompt
		const subscription = await registration.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey
		});

		// Send subscription to server
		await sendSubscriptionToServer(subscription);

		return 'granted';
	} catch (err: any) {
		// User denied permission
		if (err?.name === 'NotAllowedError') {
			return 'denied';
		}
		console.warn('Push subscription failed:', err);
		return 'default';
	}
}

/**
 * Check if push is already subscribed.
 */
export async function isPushSubscribed(
	registration: ServiceWorkerRegistration
): Promise<boolean> {
	try {
		const subscription = await registration.pushManager.getSubscription();
		return !!subscription;
	} catch {
		return false;
	}
}

/**
 * Send the push subscription object to our server.
 */
async function sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
	const json = subscription.toJSON();

	await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			endpoint: json.endpoint,
			keys: {
				p256dh: json.keys?.p256dh,
				auth: json.keys?.auth
			}
		})
	});
}

/**
 * Convert a base64url-encoded string to a Uint8Array.
 * Used for applicationServerKey in pushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; i++) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}
