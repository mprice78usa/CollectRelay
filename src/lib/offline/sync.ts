/** Offline sync engine — replays queued captures when connectivity returns */
import { getSyncQueue, updateSyncItem, removeSyncItem, getSyncQueueCount, getClientId, type SyncQueueItem } from './db';
import { setPendingSyncCount, setSyncing, setLastSyncAt } from './status.svelte';

const MAX_RETRIES = 5;

/** Sync all pending/failed items in the queue */
export async function syncAll(): Promise<void> {
	if (!navigator.onLine) return;

	setSyncing(true);

	try {
		const queue = await getSyncQueue();
		const pending = queue.filter(item => item.status === 'pending' || item.status === 'failed');

		if (pending.length === 0) {
			setSyncing(false);
			return;
		}

		const clientId = await getClientId();

		for (const item of pending) {
			if (!navigator.onLine) break;
			if (item.retryCount >= MAX_RETRIES) continue;

			try {
				await updateSyncItem(item.id!, { status: 'syncing' });
				await syncItem(item, clientId);
				await removeSyncItem(item.id!);
			} catch (err) {
				console.error(`Sync failed for item ${item.id}:`, err);
				await updateSyncItem(item.id!, {
					status: 'failed',
					retryCount: item.retryCount + 1
				});
			}

			// Update count after each item
			const count = await getSyncQueueCount();
			setPendingSyncCount(count);
		}

		setLastSyncAt(Date.now());
	} finally {
		setSyncing(false);
		const count = await getSyncQueueCount();
		setPendingSyncCount(count);
	}
}

/** Sync a single queue item to the server */
async function syncItem(item: SyncQueueItem, clientId: string): Promise<void> {
	const syncId = `${clientId}:${item.id}`;
	const headers: Record<string, string> = { 'X-Sync-Id': syncId };

	if (item.type === 'photo') {
		const formData = new FormData();
		formData.append('transactionId', item.payload.transactionId || item.transactionId);
		if (item.payload.title) formData.append('title', item.payload.title);
		if (item.payload.notes) formData.append('notes', item.payload.notes);
		if (item.payload.analyzeWithAI) formData.append('analyzeWithAI', 'true');

		if (item.fileData && item.fileName && item.mimeType) {
			const blob = new Blob([item.fileData], { type: item.mimeType });
			formData.append('photo', blob, item.fileName);
		}

		const res = await fetch('/api/photo-note', {
			method: 'POST',
			headers,
			body: formData
		});
		if (!res.ok && res.status !== 200) throw new Error(`Photo sync failed: ${res.status}`);

	} else if (item.type === 'voice') {
		const formData = new FormData();
		formData.append('transactionId', item.payload.transactionId || item.transactionId);
		if (item.payload.duration) formData.append('duration', String(item.payload.duration));

		if (item.fileData && item.fileName && item.mimeType) {
			const blob = new Blob([item.fileData], { type: item.mimeType });
			formData.append('audio', blob, item.fileName);
		}

		const res = await fetch('/api/voice-note', {
			method: 'POST',
			headers,
			body: formData
		});
		if (!res.ok && res.status !== 200) throw new Error(`Voice sync failed: ${res.status}`);

	} else if (item.type === 'text') {
		const res = await fetch('/api/text-note', {
			method: 'POST',
			headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				destination: item.payload.destination || 'project',
				transactionId: item.payload.transactionId || item.transactionId,
				title: item.payload.title,
				content: item.payload.content || ''
			})
		});
		if (!res.ok && res.status !== 200) throw new Error(`Text sync failed: ${res.status}`);
	}
}

/** Register Background Sync API (Chrome/Edge). Falls back gracefully. */
export async function registerBackgroundSync(): Promise<void> {
	if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

	try {
		const reg = await navigator.serviceWorker.ready;
		if ('sync' in reg) {
			await (reg as any).sync.register('cr-sync-queue');
		}
	} catch {
		// Background Sync not supported — online listener handles it
	}
}

/** Listen for online events and trigger sync. Call in onMount. */
export function setupOnlineListener(): () => void {
	if (typeof window === 'undefined') return () => {};

	const handleOnline = () => {
		syncAll().catch(err => console.error('Auto-sync failed:', err));
	};

	// Listen for SW messages requesting sync
	const handleMessage = (event: MessageEvent) => {
		if (event.data?.type === 'SYNC_REQUESTED') {
			syncAll().catch(err => console.error('SW-triggered sync failed:', err));
		}
	};

	window.addEventListener('online', handleOnline);
	navigator.serviceWorker?.addEventListener('message', handleMessage);

	// Sync on startup if online and items are pending
	if (navigator.onLine) {
		getSyncQueueCount().then(count => {
			if (count > 0) syncAll().catch(err => console.error('Startup sync failed:', err));
		});
	}

	return () => {
		window.removeEventListener('online', handleOnline);
		navigator.serviceWorker?.removeEventListener('message', handleMessage);
	};
}

/** Refresh the pending count from IndexedDB into reactive state */
export async function refreshPendingCount(): Promise<void> {
	const count = await getSyncQueueCount();
	setPendingSyncCount(count);
}
