<script lang="ts">
	import { getOfflineState } from '$lib/offline/status.svelte';

	const state = getOfflineState();
</script>

{#if !state.isOnline}
	<div class="offline-banner">
		<span class="offline-icon">&#9888;</span>
		<span>You're offline</span>
		{#if state.pendingSyncCount > 0}
			<span class="offline-badge">{state.pendingSyncCount} pending</span>
		{/if}
		<span class="offline-hint">Items will sync when reconnected</span>
	</div>
{/if}

{#if state.isOnline && state.isSyncing}
	<div class="sync-banner">
		<span class="sync-spinner"></span>
		<span>Syncing {state.pendingSyncCount} item{state.pendingSyncCount !== 1 ? 's' : ''}...</span>
	</div>
{/if}

<style>
	.offline-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: #b45309;
		color: #fff;
		font-size: 13px;
		font-weight: 500;
		z-index: 1000;
	}

	.offline-icon {
		font-size: 16px;
	}

	.offline-badge {
		background: rgba(255,255,255,0.2);
		padding: 2px 8px;
		border-radius: 10px;
		font-size: 12px;
	}

	.offline-hint {
		margin-left: auto;
		opacity: 0.8;
		font-size: 12px;
	}

	.sync-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 16px;
		background: #1e40af;
		color: #fff;
		font-size: 13px;
		z-index: 1000;
	}

	.sync-spinner {
		width: 14px;
		height: 14px;
		border: 2px solid rgba(255,255,255,0.3);
		border-top-color: #fff;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
