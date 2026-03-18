<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>Terms of Service — CollectRelay</title>
	<meta name="description" content="CollectRelay Terms of Service. Read our terms governing use of the CollectRelay platform." />
</svelte:head>

<Navbar />

<main class="legal-page">
	<div class="container">
		<div class="hero-section">
			<span class="badge">Legal</span>
			<h1>Terms of Service</h1>
			<p class="updated">Last updated: March 2026</p>
		</div>

		<div class="legal-content">
			<section>
				<h2>1. Acceptance of Terms</h2>
				<p>By accessing or using CollectRelay ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.</p>
			</section>

			<section>
				<h2>2. Description of Service</h2>
				<p>CollectRelay is a document collection and management platform that enables professionals to request, collect, review, and organize documents from clients through secure, shareable portals.</p>
			</section>

			<section>
				<h2>3. User Accounts</h2>
				<p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.</p>
			</section>

			<section>
				<h2>4. Acceptable Use</h2>
				<p>You agree not to use the Service for any unlawful purpose, to upload malicious content, or to interfere with the operation of the Service. We reserve the right to suspend accounts that violate these terms.</p>
			</section>

			<section>
				<h2>5. Data and Privacy</h2>
				<p>Your use of the Service is also governed by our <a href="/privacy">Privacy Policy</a>. You retain ownership of all documents uploaded to the Service.</p>
			</section>

			<section>
				<h2>6. Service Availability</h2>
				<p>We strive to maintain high availability but do not guarantee uninterrupted access to the Service. We may perform maintenance or updates that temporarily affect availability.</p>
			</section>

			<section>
				<h2>7. Limitation of Liability</h2>
				<p>To the maximum extent permitted by law, CollectRelay shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.</p>
			</section>

			<section>
				<h2>8. Changes to Terms</h2>
				<p>We may update these terms from time to time. We will notify you of material changes by posting the updated terms on this page with a revised "Last updated" date.</p>
			</section>

			<section>
				<h2>9. Contact</h2>
				<p>Questions about these terms? <a href="/contact">Contact us</a> or email <a href="mailto:info@collectrelay.com">info@collectrelay.com</a>.</p>
			</section>
		</div>
	</div>
</main>

<Footer />

<style>
	.legal-page {
		padding-top: calc(80px + var(--space-4xl));
		padding-bottom: var(--section-gap);
		min-height: 100vh;
	}

	.hero-section {
		margin-bottom: var(--space-4xl);
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
		margin-bottom: var(--space-md);
	}

	.updated {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.legal-content {
		max-width: 720px;
	}

	.legal-content section {
		margin-bottom: var(--space-xxl);
		padding-bottom: var(--space-xxl);
		border-bottom: 1px solid var(--border-color);
	}

	.legal-content section:last-child {
		border-bottom: none;
	}

	.legal-content h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin-bottom: var(--space-md);
	}

	.legal-content p {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		line-height: 1.7;
	}

	.legal-content a {
		color: var(--color-accent);
	}

	.legal-content a:hover {
		text-decoration: underline;
	}
</style>
