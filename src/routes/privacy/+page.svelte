<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>Privacy Policy — CollectRelay</title>
	<meta name="description" content="CollectRelay Privacy Policy. Learn how we collect, use, and protect your data." />
</svelte:head>

<Navbar />

<main class="legal-page">
	<div class="container">
		<div class="hero-section">
			<span class="badge">Legal</span>
			<h1>Privacy Policy</h1>
			<p class="updated">Last updated: March 2026</p>
		</div>

		<div class="legal-content">
			<section>
				<h2>1. Information We Collect</h2>
				<p>We collect information you provide directly: name, email address, company name, and documents uploaded to the platform. We also collect usage data such as pages visited, features used, and device information to improve the Service.</p>
			</section>

			<section>
				<h2>2. How We Use Your Information</h2>
				<p>We use your information to operate and improve the Service, communicate with you about your account, provide customer support, and send service-related notifications. We do not sell your personal data to third parties.</p>
			</section>

			<section>
				<h2>3. Document Storage and Security</h2>
				<p>Documents uploaded to CollectRelay are stored in Cloudflare R2 with server-side encryption. All data is transmitted over TLS 1.3. Access to documents is restricted to authorized users through signed, time-limited URLs. See our <a href="/security">Security page</a> for full details.</p>
			</section>

			<section>
				<h2>4. Data Sharing</h2>
				<p>We do not sell, rent, or trade your personal information. We may share data with service providers who help us operate the platform (e.g., cloud infrastructure, email delivery), subject to strict data processing agreements.</p>
			</section>

			<section>
				<h2>5. Data Retention</h2>
				<p>We retain your account data for as long as your account is active. Documents are retained according to your workspace settings. You can request deletion of your data at any time by contacting us.</p>
			</section>

			<section>
				<h2>6. Your Rights</h2>
				<p>You have the right to access, correct, or delete your personal information. California residents have additional rights under the CCPA, including the right to know what data we collect and the right to opt out of data sales (we do not sell data).</p>
			</section>

			<section>
				<h2>7. Cookies</h2>
				<p>We use essential cookies for authentication and session management. We do not use advertising or tracking cookies. Analytics cookies are used only to understand aggregate usage patterns.</p>
			</section>

			<section>
				<h2>8. Changes to This Policy</h2>
				<p>We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page.</p>
			</section>

			<section>
				<h2>9. Contact</h2>
				<p>Questions about privacy? <a href="/contact">Contact us</a> or email <a href="mailto:info@collectrelay.com">info@collectrelay.com</a>.</p>
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
