<script lang="ts">
	import Navbar from '$lib/components/marketing/Navbar.svelte';
	import Footer from '$lib/components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>Checkout Cancelled — CollectRelay</title>
</svelte:head>

<Navbar />

<main class="checkout-result">
	<div class="card">
		<div class="icon cancelled">←</div>
		<h1>Checkout cancelled</h1>
		<p>No worries — no charges were made. You can pick a plan whenever you're ready.</p>
		<div class="actions">
			<a href="/pricing" class="btn-primary">View Plans</a>
			<a href="/app" class="btn-secondary">Back to Dashboard</a>
		</div>
	</div>
</main>

<Footer />

<style>
	.checkout-result {
		min-height: 80vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
		background: var(--bg-secondary);
	}
	.card {
		background: var(--bg-primary);
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-xl);
		padding: var(--space-2xl) var(--space-xl);
		text-align: center;
		max-width: 480px;
		width: 100%;
	}
	.icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28px;
		font-weight: 700;
		margin: 0 auto var(--space-lg);
	}
	.icon.cancelled {
		background: rgba(161, 161, 170, 0.15);
		color: var(--text-secondary);
	}
	h1 {
		font-size: 1.5rem;
		color: var(--text-primary);
		margin-bottom: var(--space-sm);
	}
	p {
		color: var(--text-secondary);
		margin-bottom: var(--space-xl);
		line-height: 1.6;
	}
	.actions {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.btn-primary {
		display: block;
		padding: var(--space-sm) var(--space-lg);
		background: var(--accent);
		color: white;
		text-decoration: none;
		border-radius: var(--radius-lg);
		font-weight: 600;
		font-size: 0.95rem;
		transition: background 0.2s;
	}
	.btn-primary:hover { background: var(--accent-hover); }
	.btn-secondary {
		display: block;
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		color: var(--text-secondary);
		text-decoration: none;
		border-radius: var(--radius-lg);
		font-weight: 500;
		font-size: 0.9rem;
		border: 1px solid var(--border-primary);
		transition: border-color 0.2s;
	}
	.btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
</style>
