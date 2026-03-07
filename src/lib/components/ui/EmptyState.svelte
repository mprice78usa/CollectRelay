<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		message?: string;
		children?: Snippet;
	}

	let { message = 'No items found', children }: Props = $props();
</script>

<div class="empty-state">
	<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
		<path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" stroke-linecap="round" stroke-linejoin="round" />
	</svg>
	<p>{message}</p>
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-3xl);
		color: var(--text-muted);
		gap: var(--space-md);
	}

	p { font-size: var(--font-size-md); }
</style>
