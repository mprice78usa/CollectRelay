<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		href?: string;
		padding?: boolean;
		children: Snippet;
	}

	let { href, padding = true, children }: Props = $props();
</script>

{#if href}
	<a {href} class="card" class:padded={padding}>
		{@render children()}
	</a>
{:else}
	<div class="card" class:padded={padding}>
		{@render children()}
	</div>
{/if}

<style>
	.card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
		display: block;
		color: inherit;
		text-decoration: none;
	}

	.padded {
		padding: var(--space-xl);
	}

	a.card:hover {
		border-color: var(--color-accent);
		box-shadow: var(--shadow-md);
		text-decoration: none;
	}
</style>
