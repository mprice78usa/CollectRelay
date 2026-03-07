<script lang="ts">
	let { data, children } = $props();
</script>

{#if data.partnerSession}
	<div class="partner-shell">
		<header class="partner-header">
			<div class="partner-logo">
				<svg viewBox="0 0 32 32" width="20" height="20" aria-hidden="true">
					<rect width="32" height="32" rx="6" fill="#1e293b"/>
					<path d="M8 10h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" fill="none"/>
					<path d="M8 16h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" fill="none"/>
				</svg>
				<span>CollectRelay</span>
			</div>
			<div class="partner-badge">
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
				</svg>
				{data.partnerSession.partnerName} · {data.partnerSession.partnerType}
			</div>
		</header>
		<main class="partner-content">
			{@render children()}
		</main>
	</div>
{:else}
	<div class="partner-error">
		<div class="error-card">
			<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ef4444" stroke-width="1.5" stroke-linecap="round">
				<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			<h1>Link Expired or Invalid</h1>
			<p>This partner portal link is no longer valid. Please contact the agent who shared it with you for a new link.</p>
		</div>
	</div>
{/if}

<style>
	.partner-shell {
		min-height: 100vh;
		background: #f8fafc;
	}

	.partner-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 24px;
		background: white;
		border-bottom: 1px solid #e2e8f0;
	}

	.partner-logo {
		display: flex;
		align-items: center;
		gap: 8px;
		font-weight: 700;
		font-size: 15px;
		color: #18181b;
	}

	.partner-badge {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		color: #64748b;
		background: #f1f5f9;
		padding: 4px 12px;
		border-radius: 20px;
		text-transform: capitalize;
	}

	.partner-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 32px 24px;
	}

	.partner-error {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8fafc;
		padding: 24px;
	}

	.error-card {
		text-align: center;
		background: white;
		padding: 48px;
		border-radius: 16px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		max-width: 400px;
	}

	.error-card h1 {
		font-size: 20px;
		font-weight: 700;
		color: #18181b;
		margin: 16px 0 8px;
	}

	.error-card p {
		color: #64748b;
		font-size: 14px;
		line-height: 1.5;
	}
</style>
