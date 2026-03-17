/** Reactive offline state using Svelte 5 runes */

let isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);
let pendingSyncCount = $state(0);
let isSyncing = $state(false);
let lastSyncAt = $state<number | null>(null);

export function getOfflineState() {
	return {
		get isOnline() { return isOnline; },
		get pendingSyncCount() { return pendingSyncCount; },
		get isSyncing() { return isSyncing; },
		get lastSyncAt() { return lastSyncAt; },
	};
}

export function setOnline(value: boolean) {
	isOnline = value;
}

export function setPendingSyncCount(count: number) {
	pendingSyncCount = count;
}

export function setSyncing(value: boolean) {
	isSyncing = value;
}

export function setLastSyncAt(time: number) {
	lastSyncAt = time;
}

/** Initialize online/offline event listeners. Call in onMount. */
export function initOnlineListeners() {
	if (typeof window === 'undefined') return;

	const handleOnline = () => { isOnline = true; };
	const handleOffline = () => { isOnline = false; };

	window.addEventListener('online', handleOnline);
	window.addEventListener('offline', handleOffline);

	// Set initial state
	isOnline = navigator.onLine;

	return () => {
		window.removeEventListener('online', handleOnline);
		window.removeEventListener('offline', handleOffline);
	};
}
