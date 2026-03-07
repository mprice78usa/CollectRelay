<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { startActivityPoller, getNotificationPermission, requestNotificationPermission, type ActivityItem } from '$lib/activity-poller';

	let { transactionId = undefined }: { transactionId?: string } = $props();

	let toastItems = $state<ActivityItem[]>([]);
	let showToast = $state(false);
	let stopPoller: (() => void) | null = null;
	let notifPermission = $state<string>('default');
	let notifPromptDismissed = $state(false);

	function handleActivityUpdate(e: Event) {
		const items = (e as CustomEvent<ActivityItem[]>).detail;
		toastItems = items;
		showToast = true;

		// Auto-dismiss after 5 seconds
		setTimeout(() => {
			showToast = false;
		}, 5000);

		// Auto-refresh page data
		invalidateAll();
	}

	function dismiss() {
		showToast = false;
	}

	async function enableNotifications() {
		const result = await requestNotificationPermission();
		notifPermission = result;
		if (result !== 'default') notifPromptDismissed = true;
	}

	function dismissNotifPrompt() {
		notifPromptDismissed = true;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('cr-notif-dismissed-pro', '1');
		}
	}

	onMount(() => {
		stopPoller = startActivityPoller(transactionId);
		window.addEventListener('activity-update', handleActivityUpdate);
		notifPermission = getNotificationPermission();
		notifPromptDismissed = localStorage.getItem('cr-notif-dismissed-pro') === '1';
	});

	onDestroy(() => {
		if (stopPoller) stopPoller();
		if (typeof window !== 'undefined') {
			window.removeEventListener('activity-update', handleActivityUpdate);
		}
	});

	function getActionText(item: ActivityItem): string {
		const actor = item.lastActorName || 'Someone';
		switch (item.lastActivityType) {
			case 'file_uploaded': return `${actor} uploaded a document`;
			case 'comment_added': return `${actor} added a comment`;
			case 'answer_submitted': return `${actor} submitted an answer`;
			case 'item_reviewed': return `${actor} reviewed an item`;
			case 'item_added': return `${actor} added a new item`;
			default: return `${actor} made an update`;
		}
	}
</script>

{#if notifPermission === 'default' && !notifPromptDismissed}
	<div class="notif-prompt">
		<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
		</svg>
		<span>Get desktop notifications for client activity.</span>
		<button class="notif-enable-btn" onclick={enableNotifications}>Enable</button>
		<button class="notif-close-btn" onclick={dismissNotifPrompt} aria-label="Dismiss">
			<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
		</button>
	</div>
{/if}

{#if showToast && toastItems.length > 0}
	<div class="activity-toast" role="alert">
		<div class="toast-content">
			<div class="toast-icon">
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
					<path d="M13.73 21a2 2 0 01-3.46 0"/>
				</svg>
			</div>
			<div class="toast-text">
				<span class="toast-message">{getActionText(toastItems[0])}</span>
				{#if toastItems.length > 1}
					<span class="toast-more">+{toastItems.length - 1} more</span>
				{/if}
			</div>
			<button class="toast-dismiss" onclick={dismiss} aria-label="Dismiss">
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
				</svg>
			</button>
		</div>
	</div>
{/if}

<style>
	/* Desktop notification prompt */
	.notif-prompt {
		position: fixed;
		bottom: var(--space-lg);
		right: var(--space-lg);
		z-index: 999;
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		animation: slide-up 0.3s ease-out;
	}

	@keyframes slide-up {
		from { transform: translateY(20px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	.notif-prompt svg {
		color: #f59e0b;
		flex-shrink: 0;
	}

	.notif-enable-btn {
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.3);
		color: #f59e0b;
		font-weight: 600;
		font-size: var(--font-size-xs);
		padding: 2px 10px;
		border-radius: var(--radius-md);
		cursor: pointer;
		white-space: nowrap;
	}

	.notif-enable-btn:hover {
		background: rgba(245, 158, 11, 0.2);
	}

	.notif-close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		background: none;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.notif-close-btn:hover {
		color: var(--text-primary);
	}

	/* Activity toast */
	.activity-toast {
		position: fixed;
		top: var(--space-lg);
		right: var(--space-lg);
		z-index: 1000;
		animation: slide-in 0.3s ease-out;
	}

	@keyframes slide-in {
		from { transform: translateY(-20px); opacity: 0; }
		to { transform: translateY(0); opacity: 1; }
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: var(--radius-lg);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-width: 400px;
	}

	.toast-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: rgba(245, 158, 11, 0.1);
		border-radius: var(--radius-full);
		color: #f59e0b;
		flex-shrink: 0;
	}

	.toast-text {
		flex: 1;
		min-width: 0;
	}

	.toast-message {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		font-weight: 500;
	}

	.toast-more {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
		margin-left: var(--space-xs);
	}

	.toast-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: none;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.toast-dismiss:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}
</style>
