<script lang="ts">
	let { data, children } = $props();

	const branding = data.branding;
	const hasCustomLogo = !!branding?.brand_logo_r2_key;
	const brandName = branding?.brand_name || 'CollectRelay';
	const brandColor = branding?.brand_color || null;
</script>

<div class="client-shell" style={brandColor ? `--color-accent: ${brandColor}; --color-accent-hover: ${brandColor}` : ''}>
	<header class="client-header">
		<div class="header-inner">
			<a href="/" class="client-logo">
				{#if hasCustomLogo}
					<img src="/api/files/{branding.brand_logo_r2_key}" alt="{brandName}" class="brand-logo-img" />
				{:else}
					<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
						<rect width="32" height="32" rx="6" fill="#1a1f2e"/>
						<path d="M8 10h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="{brandColor || '#10b981'}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
						<path d="M8 16h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="{brandColor || '#34d399'}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
						<path d="M8 22h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="{brandColor || '#6ee7b7'}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
					</svg>
				{/if}
				<span>{brandName}</span>
			</a>
			<span class="client-name">Hi, {data.clientSession.clientName}</span>
		</div>
	</header>

	<main class="client-content">
		{@render children()}
	</main>

	<footer class="client-footer">
		<p>Powered by <a href="/">CollectRelay</a></p>
	</footer>
</div>

<style>
	.client-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg-primary);
	}

	.client-header {
		background: var(--bg-secondary);
		border-bottom: 1px solid var(--border-color);
		padding: var(--space-md) var(--space-xl);
	}

	.header-inner {
		max-width: 720px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.client-logo {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-primary);
		font-weight: 700;
		font-size: var(--font-size-md);
	}

	.client-logo:hover { color: var(--text-primary); }

	.brand-logo-img {
		width: 28px;
		height: 28px;
		object-fit: contain;
		border-radius: 4px;
	}

	.client-name {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
	}

	.client-content {
		flex: 1;
		max-width: 720px;
		width: 100%;
		margin: 0 auto;
		padding: var(--space-xxl) var(--space-xl);
	}

	.client-footer {
		text-align: center;
		padding: var(--space-xl);
		border-top: 1px solid var(--border-color);
	}

	.client-footer p {
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
	}

	.client-footer a {
		color: var(--color-accent);
	}
</style>
