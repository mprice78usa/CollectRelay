<script lang="ts">
	interface Props {
		size?: number;
	}

	let { size = 20 }: Props = $props();
</script>

<svg
	class="spinner"
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width="2.5"
>
	<circle cx="12" cy="12" r="10" stroke-opacity="0.2" />
	<path d="M12 2a10 10 0 019.95 9" stroke-linecap="round" />
</svg>

<style>
	.spinner {
		animation: spin 0.8s linear infinite;
		color: var(--color-accent);
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
