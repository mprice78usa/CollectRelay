<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>HR & Human Resources — CollectRelay</title>
	<meta name="description" content="Document collection built for HR teams. Employee onboarding, I-9 verification, benefits enrollment — all in one secure portal." />
</svelte:head>

<Navbar />

<main class="coming-soon-page">
	<div class="container">
		<span class="badge">Industry</span>
		<h1>CollectRelay for HR</h1>
		<p class="lead">
			New hire paperwork, I-9 documents, benefits enrollment, performance reviews — HR teams
			collect sensitive employee documents constantly. CollectRelay gives your team a secure,
			organized way to request and track every document.
		</p>

		<div class="features-preview">
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
				</svg>
				<h3>Employee Onboarding</h3>
				<p>Send new hires a single link to upload their ID, tax forms, direct deposit info, and emergency contacts. Track who's completed onboarding and who needs a nudge.</p>
			</div>
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
				</svg>
				<h3>I-9 & Compliance Documents</h3>
				<p>Collect identity verification documents, work authorization, and compliance paperwork with a clear checklist that employees can complete from any device.</p>
			</div>
			<div class="feature">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
				</svg>
				<h3>Benefits Enrollment</h3>
				<p>During open enrollment, collect insurance forms, beneficiary designations, and dependent documentation without drowning in email attachments.</p>
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
