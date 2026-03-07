<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>Real Estate — CollectRelay</title>
	<meta name="description" content="Document collection built for real estate professionals. Mortgage docs, title packages, and closing paperwork — streamlined." />
</svelte:head>

<Navbar />

<main class="coming-soon-page">
	<div class="container">
		<span class="badge">Industry</span>
		<h1>CollectRelay for Real Estate</h1>
		<p class="lead">
			Mortgage applications, title documents, closing disclosures, proof of funds — real estate
			transactions generate mountains of paperwork. CollectRelay replaces the email chains and
			shared folders with a single, organized portal for every deal.
		</p>

		<div class="features-preview">
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
				</svg>
				<h3>Mortgage Document Collection</h3>
				<p>Request pay stubs, bank statements, tax returns, and employment verification with a single link per borrower. Clients upload on their schedule — you track progress in real time.</p>
			</div>
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/>
				</svg>
				<h3>Title & Closing Packages</h3>
				<p>Organize title commitments, surveys, HOA docs, and closing disclosures by transaction. Review and approve documents with built-in status tracking.</p>
			</div>
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
				</svg>
				<h3>Multi-Party Coordination</h3>
				<p>Buyers, sellers, agents, lenders, title companies — everyone involved gets their own view. No more forwarding docs between parties or wondering who has the latest version.</p>
			</div>
		</div>

		<div class="cta-section">
			<a href="/register" class="btn-primary">Get started free</a>
			<a href="/" class="btn-outline">Back to home</a>
		</div>
	</div>
</main>

<Footer />

<style>
	.coming-soon-page {
		padding-top: calc(80px + var(--section-gap));
		padding-bottom: var(--section-gap);
		min-height: 100vh;
	}

	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-md);
		background-color: rgba(16, 185, 129, 0.12);
		color: #10b981;
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-lg);
	}

	h1 {
		font-size: clamp(var(--font-size-xxl), 4vw, var(--font-size-4xl));
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: var(--space-lg);
	}

	.lead {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		line-height: 1.7;
		max-width: 640px;
		margin-bottom: var(--space-4xl);
	}

	.features-preview {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-xl);
		margin-bottom: var(--space-4xl);
	}

	.feature {
		padding: var(--space-xl);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
	}

	.feature h3 {
		font-size: var(--font-size-md);
		font-weight: 600;
		margin: var(--space-md) 0 var(--space-sm);
	}

	.feature p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.6;
	}

	.cta-section {
		display: flex;
		gap: var(--space-md);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xl);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-md);
		font-weight: 600;
		border-radius: var(--radius-lg);
		transition: background var(--transition-fast);
	}

	.btn-primary:hover { background: var(--color-accent-hover); color: var(--text-inverse); }

	.btn-outline {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xl);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		font-weight: 500;
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
	}

	.btn-outline:hover { background: var(--bg-secondary); color: var(--text-primary); }

	@media (max-width: 768px) {
		.features-preview { grid-template-columns: 1fr; }
	}
</style>
