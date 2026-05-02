<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let busy = $state<string | null>(null);

	async function disconnect(provider: string) {
		if (!confirm(`Disconnect from ${provider}? Future exports will fail until you reconnect.`)) return;
		busy = provider;
		try {
			const res = await fetch(`/api/cloud/${provider}/disconnect`, { method: 'POST' });
			if (res.ok) await invalidateAll();
			else alert('Could not disconnect: ' + (await res.text()));
		} finally {
			busy = null;
		}
	}

	function formatDate(iso: string | null) {
		if (!iso) return '';
		return new Date(iso).toLocaleDateString(undefined, {
			year: 'numeric', month: 'short', day: 'numeric'
		});
	}

	function providerLogo(key: string) {
		switch (key) {
			case 'box': return '📦';
			case 'dropbox': return '🗂️';
			case 'gdrive': return '🟢';
			default: return '☁️';
		}
	}
</script>

<svelte:head>
	<title>Integrations · CollectRelay</title>
</svelte:head>

<div class="page">
	<header class="page-header">
		<a href="/app/settings" class="back-link">← Settings</a>
		<h1>Integrations</h1>
		<p class="subtitle">Connect cloud storage to push Vault files into your own folders.</p>
	</header>

	{#if data.flash}
		<div class="flash flash-{data.flash.kind}">{data.flash.text}</div>
	{/if}

	<section class="provider-list">
		{#each data.providers as p (p.key)}
			<article class="provider-card">
				<div class="provider-icon">{providerLogo(p.key)}</div>
				<div class="provider-meta">
					<h2>{p.displayName}</h2>
					{#if !p.configured}
						<p class="muted">Not configured on this server. Ask an admin to add credentials.</p>
					{:else if p.connected}
						<p>
							Connected {p.account ? `as ${p.account}` : ''}{p.connectedAt ? ` · since ${formatDate(p.connectedAt)}` : ''}
						</p>
					{:else}
						<p class="muted">Push selected Vault files into your {p.displayName} account.</p>
					{/if}
				</div>
				<div class="provider-actions">
					{#if !p.configured}
						<span class="badge-muted">Unavailable</span>
					{:else if p.connected}
						<button
							type="button"
							class="btn-ghost"
							disabled={busy === p.key}
							onclick={() => disconnect(p.key)}
						>
							{busy === p.key ? 'Disconnecting…' : 'Disconnect'}
						</button>
					{:else}
						<a href="/api/cloud/{p.key}/connect" class="btn-primary">Connect</a>
					{/if}
				</div>
			</article>
		{/each}
	</section>
</div>

<style>
	.page { max-width: 720px; }

	.page-header { margin-bottom: var(--space-xl); }
	.back-link {
		display: inline-block;
		margin-bottom: var(--space-sm);
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}
	.back-link:hover { color: var(--text-primary); }

	.page-header h1 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin: 0 0 var(--space-xs) 0;
	}
	.subtitle { color: var(--text-secondary); font-size: var(--font-size-sm); margin: 0; }

	.flash {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		margin-bottom: var(--space-md);
		font-size: var(--font-size-sm);
	}
	.flash-success { background: rgba(16, 185, 129, 0.1); color: var(--color-success); border: 1px solid rgba(16, 185, 129, 0.25); }
	.flash-error { background: rgba(239, 68, 68, 0.1); color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.25); }

	.provider-list { display: flex; flex-direction: column; gap: var(--space-md); }

	.provider-card {
		display: flex;
		gap: var(--space-md);
		align-items: center;
		padding: var(--space-md) var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
	}

	.provider-icon { font-size: 28px; line-height: 1; flex-shrink: 0; }

	.provider-meta { flex: 1; min-width: 0; }
	.provider-meta h2 {
		font-size: var(--font-size-md);
		font-weight: 600;
		margin: 0 0 4px 0;
	}
	.provider-meta p {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}
	.muted { color: var(--text-muted) !important; }

	.provider-actions { flex-shrink: 0; }

	.btn-primary {
		display: inline-block;
		background: var(--color-accent);
		color: #fff;
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		font-weight: 600;
	}
	.btn-primary:hover { background: var(--color-accent-hover); text-decoration: none; }

	.btn-ghost {
		background: transparent;
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		cursor: pointer;
	}
	.btn-ghost:hover:not(:disabled) { color: var(--text-primary); border-color: var(--text-muted); }
	.btn-ghost:disabled { opacity: 0.6; cursor: not-allowed; }

	.badge-muted {
		display: inline-block;
		padding: 4px 10px;
		background: var(--bg-tertiary);
		color: var(--text-muted);
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}
</style>
