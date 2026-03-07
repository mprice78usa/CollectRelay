<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		title?: string;
		onclose?: () => void;
		children: Snippet;
		footer?: Snippet;
	}

	let { open = $bindable(false), title, onclose, children, footer }: Props = $props();

	function close() {
		open = false;
		onclose?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={open ? handleKeydown : undefined} />

{#if open}
	<div class="modal-backdrop" onclick={close} role="presentation">
		<div class="modal" onclick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
			{#if title}
				<div class="modal-header">
					<h3>{title}</h3>
					<button class="close-btn" onclick={close}>&times;</button>
				</div>
			{/if}
			<div class="modal-body">
				{@render children()}
			</div>
			{#if footer}
				<div class="modal-footer">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--z-modal);
		padding: var(--space-lg);
	}

	.modal {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		box-shadow: var(--shadow-lg);
		width: 100%;
		max-width: 500px;
		max-height: 80vh;
		overflow-y: auto;
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg) var(--space-xl);
		border-bottom: 1px solid var(--border-color);
	}

	h3 { font-size: var(--font-size-lg); font-weight: 600; }

	.close-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: var(--font-size-xl);
		padding: 0;
		line-height: 1;
	}

	.close-btn:hover { color: var(--text-primary); }

	.modal-body { padding: var(--space-xl); }

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding: var(--space-lg) var(--space-xl);
		border-top: 1px solid var(--border-color);
	}
</style>
