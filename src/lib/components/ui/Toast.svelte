<script lang="ts">
	import { getToasts, removeToast } from '$stores/toast.svelte';

	let toasts = $derived(getToasts());
</script>

{#if toasts.length > 0}
	<div class="toast-container">
		{#each toasts as toast (toast.id)}
			<div class="toast toast-{toast.type}">
				<span class="toast-message">{toast.message}</span>
				<button class="toast-close" onclick={() => removeToast(toast.id)}>&times;</button>
			</div>
		{/each}
	</div>
{/if}

<style>
	.toast-container {
		position: fixed;
		bottom: var(--space-xl);
		right: var(--space-xl);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		z-index: var(--z-toast);
		max-width: 400px;
	}

	.toast {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-radius: var(--radius-md);
		background: var(--bg-elevated);
		border: 1px solid var(--border-color);
		box-shadow: var(--shadow-lg);
		animation: slide-in 0.2s ease-out;
	}

	.toast-success { border-left: 3px solid var(--color-success); }
	.toast-error { border-left: 3px solid var(--color-error); }
	.toast-warning { border-left: 3px solid var(--color-warning); }
	.toast-info { border-left: 3px solid var(--color-info); }

	.toast-message {
		flex: 1;
		font-size: var(--font-size-sm);
		color: var(--text-primary);
	}

	.toast-close {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: var(--font-size-lg);
		padding: 0;
		line-height: 1;
	}

	.toast-close:hover { color: var(--text-primary); }

	@keyframes slide-in {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}
</style>
