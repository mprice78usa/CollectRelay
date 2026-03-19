<script lang="ts">
	import { page } from '$app/state';
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';

	const sent = $derived(page.url.searchParams.get('sent') === 'true');
</script>

<svelte:head>
	<title>Contact — CollectRelay</title>
	<meta name="description" content="Get in touch with the CollectRelay team. Questions about pricing, features, or enterprise plans — we're here to help." />
</svelte:head>

<Navbar />

<main class="contact-page">
	<div class="container">
		<div class="hero-section">
			<span class="badge">Contact</span>
			<h1>Get in touch</h1>
			<p class="lead">
				Have questions about CollectRelay? Want to discuss enterprise plans or integrations?
				We'd love to hear from you.
			</p>
		</div>

		{#if sent}
			<div class="success-message">
				<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
				</svg>
				<h2>Message sent</h2>
				<p>Thanks for reaching out. We'll get back to you within one business day.</p>
				<a href="/" class="btn-primary">Back to home</a>
			</div>
		{:else}
			<form action="https://formsubmit.co/info@collectrelay.com" method="POST" class="contact-form">
				<input type="hidden" name="_next" value="https://collectrelay.com/contact?sent=true" />
				<input type="hidden" name="_captcha" value="false" />
				<input type="hidden" name="_template" value="table" />

				<div class="form-group">
					<label for="name">Name</label>
					<input type="text" id="name" name="name" required placeholder="Your name" />
				</div>

				<div class="form-group">
					<label for="email">Email</label>
					<input type="email" id="email" name="email" required placeholder="you@company.com" />
				</div>

				<div class="form-group">
					<label for="company">Company</label>
					<input type="text" id="company" name="company" placeholder="Your company (optional)" />
				</div>

				<div class="form-group">
					<label for="subject">Subject</label>
					<select id="subject" name="subject">
						<option value="General">General inquiry</option>
						<option value="Sales">Sales / Enterprise plans</option>
						<option value="Support">Support</option>
						<option value="Partnership">Partnership</option>
					</select>
				</div>

				<div class="form-group">
					<label for="message">Message</label>
					<textarea id="message" name="message" rows="5" required placeholder="How can we help?"></textarea>
				</div>

				<button type="submit" class="btn-primary">Send message</button>
			</form>

			<p class="email-fallback">
				Or email us directly at <a href="mailto:info@collectrelay.com">info@collectrelay.com</a>
			</p>

			<div class="calendly-section">
				<h3>Prefer a live conversation?</h3>
				<p>Book a 15-minute call to discuss your needs, see a demo, or talk enterprise plans.</p>
				<a href="https://calendly.com/collectrelay" target="_blank" rel="noopener" class="btn-outline">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
					Schedule a call
				</a>
			</div>
		{/if}
	</div>
</main>

<Footer />

<style>
	.contact-page {
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
		margin-bottom: var(--space-lg);
	}

	.lead {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		line-height: 1.7;
		max-width: 560px;
	}

	.contact-form {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
		max-width: 560px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.form-group label {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.form-group input,
	.form-group select,
	.form-group textarea {
		padding: var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-md);
		font-family: inherit;
		transition: border-color var(--transition-fast);
	}

	.form-group input::placeholder,
	.form-group textarea::placeholder {
		color: var(--text-muted);
	}

	.form-group input:focus,
	.form-group select:focus,
	.form-group textarea:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.form-group select {
		cursor: pointer;
	}

	.form-group textarea {
		resize: vertical;
		min-height: 120px;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-md) var(--space-xxl);
		background-color: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-md);
		font-weight: 600;
		border-radius: var(--radius-lg);
		border: none;
		cursor: pointer;
		transition: all var(--transition-fast);
		align-self: flex-start;
	}

	.btn-primary:hover {
		background-color: var(--color-accent-hover);
		color: var(--text-inverse);
		transform: translateY(-1px);
	}

	.email-fallback {
		margin-top: var(--space-xxl);
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.email-fallback a {
		color: var(--color-accent);
	}

	.email-fallback a:hover {
		text-decoration: underline;
	}

	.success-message {
		text-align: center;
		padding: var(--space-4xl) 0;
		max-width: 480px;
		margin: 0 auto;
	}

	.success-message svg {
		color: var(--color-accent);
		margin-bottom: var(--space-xl);
	}

	.success-message h2 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin-bottom: var(--space-md);
	}

	.success-message p {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		line-height: 1.6;
		margin-bottom: var(--space-xxl);
	}

	.calendly-section {
		margin-top: var(--space-4xl);
		padding-top: var(--space-4xl);
		border-top: 1px solid var(--border-color);
		max-width: 560px;
	}

	.calendly-section h3 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin-bottom: var(--space-sm);
	}

	.calendly-section p {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		line-height: 1.6;
		margin-bottom: var(--space-xl);
	}

	.btn-outline {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-xl);
		border: 1px solid var(--border-color-light);
		border-radius: var(--radius-lg);
		color: var(--text-primary);
		font-size: var(--font-size-md);
		font-weight: 500;
		transition: all var(--transition-fast);
	}

	.btn-outline:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
