<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
		children: Snippet;
	}

	let { variant = 'default', children }: Props = $props();
</script>

<span class="badge badge-{variant}">
	{@render children()}
</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		padding: 2px var(--space-sm);
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.badge-default { background: var(--bg-tertiary); color: var(--text-secondary); }
	.badge-success { background: rgba(16, 185, 129, 0.15); color: var(--color-success); }
	.badge-warning { background: rgba(245, 158, 11, 0.15); color: var(--color-warning); }
	.badge-error { background: rgba(239, 68, 68, 0.15); color: var(--color-error); }
	.badge-info { background: rgba(59, 130, 246, 0.15); color: var(--color-info); }
</style>
