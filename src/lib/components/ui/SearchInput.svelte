<script lang="ts">
	interface Props {
		value?: string;
		placeholder?: string;
		onchange?: (value: string) => void;
	}

	let { value = $bindable(''), placeholder = 'Search...', onchange }: Props = $props();

	let timeout: ReturnType<typeof setTimeout>;

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		clearTimeout(timeout);
		timeout = setTimeout(() => onchange?.(value), 300);
	}
</script>

<div class="search-input">
	<svg class="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
		<path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
	</svg>
	<input type="text" {value} {placeholder} oninput={handleInput} />
</div>

<style>
	.search-input {
		position: relative;
		display: flex;
		align-items: center;
	}

	.icon {
		position: absolute;
		left: var(--space-md);
		color: var(--text-muted);
		pointer-events: none;
	}

	input {
		width: 100%;
		padding: var(--space-sm) var(--space-lg);
		padding-left: 36px;
		background: var(--bg-input);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		outline: none;
		transition: border-color var(--transition-fast);
	}

	input:focus { border-color: var(--color-accent); }
	input::placeholder { color: var(--text-muted); }
</style>
