<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>Contractors — CollectRelay</title>
	<meta name="description" content="Document collection built for contractors. Permits, insurance, lien waivers — all in one place." />
</svelte:head>

<Navbar />

<main class="coming-soon-page">
	<div class="container">
		<span class="badge">Coming Soon</span>
		<h1>CollectRelay for Contractors</h1>
		<p class="lead">
			Permits, insurance certs, lien waivers, change orders — stop chasing subcontractors
			and clients for paperwork. CollectRelay gives contractors a single portal to request,
			track, and organize every document across every project.
		</p>

		<div class="features-preview">
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
				</svg>
				<h3>Permit & License Tracking</h3>
				<p>Collect permits, licenses, and certifications from subs before they step on site.</p>
			</div>
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
				</svg>
				<h3>Insurance Certificates</h3>
				<p>Request COIs and W-9s from every subcontractor with automated reminders.</p>
			</div>
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
				</svg>
				<h3>Lien Waivers & Change Orders</h3>
				<p>Get signatures on lien waivers and change orders without the paper chase.</p>
			</div>
		</div>

		<div class="cta-section">
			<a href="/register" class="btn-primary">Get early access</a>
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
		background-color: rgba(245, 158, 11, 0.15);
		color: var(--color-warning);
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
