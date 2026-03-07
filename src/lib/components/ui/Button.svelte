<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		disabled?: boolean;
		type?: 'button' | 'submit';
		onclick?: () => void;
		children: Snippet;
	}

	let { variant = 'primary', size = 'md', disabled = false, type = 'button', onclick, children }: Props = $props();
</script>

<button class="btn btn-{variant} size-{size}" {disabled} {type} {onclick}>
	{@render children()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		border: 1px solid transparent;
		border-radius: var(--radius-md);
		font-weight: 500;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.size-sm { padding: var(--space-xs) var(--space-sm); font-size: var(--font-size-xs); }
	.size-md { padding: var(--space-sm) var(--space-lg); font-size: var(--font-size-sm); }
	.size-lg { padding: var(--space-md) var(--space-xl); font-size: var(--font-size-md); }

	.btn-primary {
		background: var(--color-accent);
		color: var(--text-inverse);
	}
	.btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }

	.btn-secondary {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border-color: var(--border-color);
	}
	.btn-secondary:hover:not(:disabled) { background: var(--bg-elevated); }

	.btn-danger {
		background: rgba(239, 68, 68, 0.15);
		color: var(--color-error);
		border-color: var(--color-error);
	}
	.btn-danger:hover:not(:disabled) { background: rgba(239, 68, 68, 0.25); }

	.btn-ghost {
		background: transparent;
		color: var(--text-secondary);
	}
	.btn-ghost:hover:not(:disabled) { background: var(--bg-tertiary); color: var(--text-primary); }
</style>
