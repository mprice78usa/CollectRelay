/**
 * Client-side activity polling + browser desktop notifications.
 *
 * Polls /api/activity/poll every 30 seconds for new activity.
 * When new activity is found:
 *   1. Fires a browser Notification if permission is granted
 *   2. Dispatches a custom 'activity-update' event on the window for UI refreshes
 */

export interface ActivityItem {
	checklistItemId: string;
	lastActivityAt: string;
	lastActivityType: string;
	lastActorType: string;
	lastActorName: string | null;
	transactionId?: string;
	transactionTitle?: string;
}

export interface ActivityPollResult {
	hasNew: boolean;
	items: ActivityItem[];
}

const POLL_INTERVAL = 30_000; // 30 seconds

/**
 * Start polling for new activity.
 *
 * @param transactionId — If provided, polls only this transaction. Otherwise polls all workspace transactions.
 * @returns A cleanup function to stop polling.
 */
export function startActivityPoller(transactionId?: string): () => void {
	let since = new Date().toISOString();
	let timer: ReturnType<typeof setInterval> | null = null;
	let stopped = false;

	async function poll() {
		if (stopped) return;

		try {
			const params = new URLSearchParams({ since });
			if (transactionId) params.set('transactionId', transactionId);

			const response = await fetch(`/api/activity/poll?${params}`);
			if (!response.ok) return;

			const result: ActivityPollResult = await response.json();

			if (result.hasNew && result.items.length > 0) {
				// Update since to latest activity timestamp
				const latestTimestamp = result.items.reduce(
					(max, item) => (item.lastActivityAt > max ? item.lastActivityAt : max),
					since
				);
				since = latestTimestamp;

				// Dispatch custom event for UI components to react
				window.dispatchEvent(
					new CustomEvent('activity-update', { detail: result.items })
				);

				// Show browser desktop notification if permitted
				showDesktopNotification(result.items);
			}
		} catch {
			// Silent fail — polling is best-effort
		}
	}

	// Start polling
	timer = setInterval(poll, POLL_INTERVAL);

	// Return cleanup function
	return () => {
		stopped = true;
		if (timer) clearInterval(timer);
	};
}

/**
 * Show a browser desktop notification for new activity.
 */
function showDesktopNotification(items: ActivityItem[]) {
	if (typeof Notification === 'undefined') return;
	if (Notification.permission !== 'granted') return;

	// Use the most recent item for the notification
	const item = items[0];
	if (!item) return;

	const actorName = item.lastActorName || 'Someone';
	const actionLabel = getActionLabel(item.lastActivityType);
	const title = item.transactionTitle
		? `${actorName} — ${item.transactionTitle}`
		: actorName;

	try {
		new Notification(title, {
			body: actionLabel,
			icon: '/favicon.png',
			tag: 'collectrelay-activity', // Replaces previous notification
			silent: false
		});
	} catch {
		// Notifications may fail in some contexts
	}
}

function getActionLabel(activityType: string): string {
	switch (activityType) {
		case 'file_uploaded':
			return 'Uploaded a document';
		case 'comment_added':
			return 'Added a comment';
		case 'answer_submitted':
			return 'Submitted an answer';
		case 'item_reviewed':
			return 'Reviewed an item';
		case 'item_added':
			return 'Added a new item';
		default:
			return 'New activity';
	}
}

/**
 * Request notification permission from the user.
 * Returns the permission state.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (typeof Notification === 'undefined') return 'denied';
	if (Notification.permission !== 'default') return Notification.permission;
	return await Notification.requestPermission();
}

/**
 * Get current notification permission state.
 */
export function getNotificationPermission(): NotificationPermission {
	if (typeof Notification === 'undefined') return 'denied';
	return Notification.permission;
}
