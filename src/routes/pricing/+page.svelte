<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';

	let annual = $state(false);
	let loading = $state<string | null>(null);

	const plans = [
		{
			key: 'free',
			name: 'Free',
			monthly: 0,
			annualMonthly: 0,
			cta: 'Get started',
			ctaHref: '/register',
			popular: false,
			description: 'Best for trying it out',
			features: {
				transactions: '3 active',
				templates: '4 built-in',
				aiSummaries: '10/month',
				eSignatures: true,
				webhooks: false,
				teamMembers: '1',
				whiteLabel: false,
				partnerAccess: false,
				prioritySupport: false,
				zapierApi: false
			}
		},
		{
			key: 'pro',
			name: 'Pro',
			monthly: 29,
			annualMonthly: 24.17,
			annualTotal: 290,
			cta: 'Get started',
			popular: false,
			description: 'Best for solo agents & contractors',
			features: {
				transactions: 'Unlimited',
				templates: 'Unlimited custom',
				aiSummaries: '100/month',
				eSignatures: true,
				webhooks: true,
				teamMembers: '1',
				whiteLabel: false,
				partnerAccess: true,
				prioritySupport: false,
				zapierApi: true
			}
		},
		{
			key: 'team',
			name: 'Team',
			monthly: 79,
			annualMonthly: 65.83,
			annualTotal: 790,
			cta: 'Get started',
			popular: true,
			description: 'Best for small teams & brokerages',
			features: {
				transactions: 'Unlimited',
				templates: 'Unlimited',
				aiSummaries: '500/month',
				eSignatures: true,
				webhooks: true,
				teamMembers: '5',
				whiteLabel: true,
				partnerAccess: true,
				prioritySupport: true,
				zapierApi: true
			}
		},
		{
			key: 'enterprise',
			name: 'Enterprise',
			monthly: -1,
			annualMonthly: -1,
			cta: 'Talk to sales',
			ctaHref: '/contact',
			popular: false,
			description: 'Best for large organizations',
			features: {
				transactions: 'Unlimited',
				templates: 'Unlimited',
				aiSummaries: 'Unlimited',
				eSignatures: true,
				webhooks: true,
				teamMembers: 'Unlimited',
				whiteLabel: true,
				partnerAccess: true,
				prioritySupport: true,
				zapierApi: true
			}
		}
	];

	const featureRows = [
		{ key: 'transactions', label: 'Transactions', hint: 'Active deals you can manage at once' },
		{ key: 'templates', label: 'Templates', hint: 'Reusable checklists for new deals' },
		{ key: 'aiSummaries', label: 'AI summaries', hint: 'Auto-summarize uploaded documents' },
		{ key: 'eSignatures', label: 'E-signatures', hint: 'Collect signatures in the client portal' },
		{ key: 'webhooks', label: 'Webhooks', hint: 'Trigger events in your CRM or tools' },
		{ key: 'teamMembers', label: 'Team members', hint: 'Users in your workspace' },
		{ key: 'whiteLabel', label: 'White-label', hint: 'Your branding in the client portal' },
		{ key: 'partnerAccess', label: 'Partner access', hint: 'Invite agents or subs with limited access' },
		{ key: 'prioritySupport', label: 'Priority support', hint: 'Faster response from our team' },
		{ key: 'zapierApi', label: 'Zapier/API', hint: 'Connect CollectRelay to your systems' }
	];

	function displayPrice(plan: typeof plans[0]) {
		if (plan.monthly === -1) return null;
		if (plan.monthly === 0) return '0';
		return annual ? plan.annualMonthly.toFixed(0) : plan.monthly.toString();
	}

	async function handleSubscribe(planKey: string) {
		// Free tier → register
		if (planKey === 'free') {
			window.location.href = '/register';
			return;
		}
		// Enterprise → sales
		if (planKey === 'enterprise') {
			window.location.href = '/contact';
			return;
		}

		loading = planKey;
		try {
			const res = await fetch('/api/stripe/checkout', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					plan: planKey,
					billing: annual ? 'annual' : 'monthly'
				})
			});

			if (res.ok) {
				const { url } = await res.json();
				window.location.href = url;
			} else if (res.status === 401) {
				const params = new URLSearchParams({ plan: planKey, billing: annual ? 'annual' : 'monthly' });
				window.location.href = `/register?${params}`;
			} else {
				const data = await res.json().catch(() => ({}));
				alert(data.message || 'Something went wrong. Please try again.');
			}
		} catch {
			alert('Network error. Please try again.');
		} finally {
			loading = null;
		}
	}
</script>

<svelte:head>
	<title>Pricing — CollectRelay</title>
	<meta name="description" content="Start free, upgrade when you're ready. Simple pricing for document collection — Free, Pro $29/mo, Team $79/mo." />
</svelte:head>

<Navbar />

<main>
	<!-- Hero -->
	<section class="pricing-hero">
		<div class="container">
			<h1>Simple, transparent pricing</h1>
			<p class="hero-subtitle">Start free. Upgrade when you're ready. No surprises.</p>

			<div class="billing-toggle">
				<span class:active={!annual}>Monthly</span>
				<button
					class="toggle-switch"
					class:toggled={annual}
					onclick={() => annual = !annual}
					aria-label="Toggle annual billing"
				>
					<span class="toggle-thumb"></span>
				</button>
				<span class:active={annual}>
					Annual
					<span class="save-badge">2 months free</span>
				</span>
			</div>
		</div>
	</section>

	<!-- Pricing Cards -->
	<section class="pricing-cards">
		<div class="container">
			<div class="cards-grid">
				{#each plans as plan}
					<div class="plan-card" class:popular={plan.popular}>
						{#if plan.popular}
							<div class="popular-badge">Most Popular</div>
						{/if}
						<div class="plan-header">
							<h3>{plan.name}</h3>
							<p class="plan-description">{plan.description}</p>
						</div>
						<div class="plan-price">
							{#if plan.monthly === -1}
								<span class="custom-price">Custom</span>
							{:else if plan.monthly === 0}
								<span class="dollar">$</span>
								<span class="amount">0</span>
								<span class="period">/mo</span>
							{:else}
								<span class="dollar">$</span>
								<span class="amount">{displayPrice(plan)}</span>
								<span class="period">/mo</span>
							{/if}
						</div>
						{#if plan.monthly > 0}
							{#if annual}
								<p class="billing-note">${plan.annualTotal}/yr · 2 months free</p>
							{:else}
								<p class="billing-note">Billed monthly · No commitment</p>
							{/if}
						{:else if plan.monthly === 0}
							<p class="billing-note">Free forever · No credit card</p>
						{:else}
							<p class="billing-note">Custom pricing for your team</p>
						{/if}

						{#if plan.ctaHref}
							<a href={plan.ctaHref} class="plan-cta" class:primary={plan.popular}>
								{plan.cta}
							</a>
						{:else}
							<button
								class="plan-cta"
								class:primary={plan.popular}
								disabled={loading === plan.key}
								onclick={() => handleSubscribe(plan.key)}
							>
								{loading === plan.key ? 'Redirecting...' : plan.cta}
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Feature Comparison Table -->
	<section class="comparison">
		<div class="container">
			<h2>Compare plans</h2>
			<div class="table-wrapper">
				<table>
					<thead>
						<tr>
							<th class="feature-col"></th>
							{#each plans as plan}
								<th class="plan-col" class:highlight={plan.popular}>{plan.name}</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each featureRows as row}
							<tr>
								<td class="feature-label">
									{row.label}
									{#if row.hint}
										<span class="feature-hint">{row.hint}</span>
									{/if}
								</td>
								{#each plans as plan}
									{@const val = plan.features[row.key as keyof typeof plan.features]}
									<td class="feature-value" class:highlight={plan.popular}>
										{#if val === true}
											<svg class="check" viewBox="0 0 24 24" width="18" height="18"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
										{:else if val === false}
											<svg class="cross" viewBox="0 0 24 24" width="16" height="16"><line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
										{:else}
											<span class="feature-text">{val}</span>
										{/if}
									</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="faq">
		<div class="container-narrow">
			<h2>Frequently asked questions</h2>
			<div class="faq-list">
				<div class="faq-item">
					<h3>What's included in the free plan?</h3>
					<p>The free plan includes 3 active transactions, the 4 starter templates, e-signatures, and 10 AI summaries per month. It's a full-featured way to try CollectRelay with real deals.</p>
				</div>
				<div class="faq-item">
					<h3>Can I switch plans later?</h3>
					<p>Absolutely. Upgrade or downgrade at any time. When upgrading, you'll be prorated for the remainder of your billing period.</p>
				</div>
				<div class="faq-item">
					<h3>What's the annual discount?</h3>
					<p>Annual plans give you 2 months free — that's $290/yr for Pro (vs $348 monthly) and $790/yr for Team (vs $948 monthly). Cancel anytime during the first 30 days for a full refund.</p>
				</div>
				<div class="faq-item">
					<h3>What counts as an "active" transaction?</h3>
					<p>An active transaction is one that hasn't been closed or archived. On the free plan, you can have 3 active at once — close one and start another, no limits on total.</p>
				</div>
				<div class="faq-item">
					<h3>What is white-label?</h3>
					<p>Team and Enterprise plans let you replace CollectRelay branding with your own. Your clients see your logo, your colors, and your domain — not ours.</p>
				</div>
				<div class="faq-item">
					<h3>What does Enterprise include?</h3>
					<p>Enterprise adds unlimited team members, unlimited AI summaries, dedicated support, custom onboarding, SSO/SAML, and SLA guarantees. Contact us for a tailored quote.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="closing-cta">
		<div class="container-narrow">
			<h2>Ready to streamline your document collection?</h2>
			<p>Start free — no credit card required. Upgrade when you're ready.</p>
			<div class="cta-actions">
				<a href="/register" class="btn-primary">Get started free</a>
				<a href="/contact" class="btn-secondary">Talk to sales</a>
			</div>
		</div>
	</section>
</main>

<Footer />

<style>
	/* Hero */
	.pricing-hero {
		padding: calc(var(--section-gap) + 40px) 0 var(--space-4xl);
		text-align: center;
	}

	h1 {
		font-size: clamp(var(--font-size-3xl), 5vw, var(--font-size-5xl));
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin-bottom: var(--space-lg);
		background: linear-gradient(135deg, #ffffff 0%, var(--color-accent-hover) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-subtitle {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		max-width: 480px;
		margin: 0 auto var(--space-xxl);
	}

	/* Billing toggle */
	.billing-toggle {
		display: inline-flex;
		align-items: center;
		gap: var(--space-md);
		font-size: var(--font-size-md);
		color: var(--text-muted);
	}

	.billing-toggle span.active {
		color: var(--text-primary);
		font-weight: 600;
	}

	.save-badge {
		display: inline-block;
		padding: 2px var(--space-sm);
		background: var(--color-accent-bg);
		color: var(--color-accent);
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-full);
		margin-left: var(--space-xs);
	}

	.toggle-switch {
		position: relative;
		width: 48px;
		height: 26px;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color-light);
		border-radius: 13px;
		cursor: pointer;
		transition: all var(--transition-normal);
		padding: 0;
	}

	.toggle-switch.toggled {
		background: var(--color-accent);
		border-color: var(--color-accent);
	}

	.toggle-thumb {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background: white;
		border-radius: 50%;
		transition: transform var(--transition-normal);
		pointer-events: none;
	}

	.toggle-switch.toggled .toggle-thumb {
		transform: translateX(22px);
	}

	/* Pricing cards */
	.pricing-cards {
		padding: var(--space-xxl) 0 var(--section-gap);
	}

	.cards-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-xl);
		align-items: start;
	}

	.plan-card {
		position: relative;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		padding: var(--space-xxl);
		display: flex;
		flex-direction: column;
		transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
	}

	.plan-card:hover {
		border-color: var(--border-color-light);
		box-shadow: var(--shadow-md);
	}

	.plan-card.popular {
		border-color: var(--color-accent);
		box-shadow: 0 0 24px rgba(16, 185, 129, 0.12);
	}

	.popular-badge {
		position: absolute;
		top: -12px;
		left: 50%;
		transform: translateX(-50%);
		padding: var(--space-xs) var(--space-lg);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-xs);
		font-weight: 700;
		border-radius: var(--radius-full);
		white-space: nowrap;
		letter-spacing: 0.02em;
	}

	.plan-header {
		margin-bottom: var(--space-xl);
	}

	.plan-header h3 {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: var(--space-xs);
	}

	.plan-description {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		gap: 2px;
		margin-bottom: var(--space-xs);
		min-height: 52px;
	}

	.plan-price .dollar {
		font-size: var(--font-size-xl);
		font-weight: 600;
		color: var(--text-secondary);
		align-self: flex-start;
		margin-top: 4px;
	}

	.plan-price .amount {
		font-size: clamp(var(--font-size-3xl), 3vw, 42px);
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		line-height: 1;
	}

	.plan-price .period {
		font-size: var(--font-size-md);
		color: var(--text-muted);
		margin-left: 2px;
	}

	.custom-price {
		font-size: clamp(var(--font-size-xxl), 3vw, 36px);
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		line-height: 1;
	}

	.billing-note {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-bottom: var(--space-xl);
		min-height: 1.2em;
	}

	.plan-cta {
		display: block;
		width: 100%;
		text-align: center;
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-md);
		font-size: var(--font-size-md);
		font-weight: 600;
		transition: all var(--transition-fast);
		cursor: pointer;
		text-decoration: none;

		/* Default: outline style */
		background: transparent;
		border: 1px solid var(--border-color-light);
		color: var(--text-primary);
	}

	.plan-cta:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.plan-cta:hover {
		background: var(--bg-tertiary);
		border-color: var(--text-muted);
		color: var(--text-primary);
	}

	.plan-cta.primary {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--text-inverse);
		box-shadow: var(--shadow-glow);
	}

	.plan-cta.primary:hover {
		background: var(--color-accent-hover);
		border-color: var(--color-accent-hover);
		color: var(--text-inverse);
	}

	/* Comparison table */
	.comparison {
		padding: 0 0 var(--section-gap);
	}

	.comparison h2 {
		font-size: clamp(var(--font-size-xxl), 3.5vw, var(--font-size-3xl));
		font-weight: 700;
		letter-spacing: -0.02em;
		text-align: center;
		margin-bottom: var(--space-4xl);
		color: var(--text-primary);
	}

	.table-wrapper {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		min-width: 640px;
	}

	thead th {
		padding: var(--space-md) var(--space-lg);
		font-size: var(--font-size-md);
		font-weight: 700;
		color: var(--text-primary);
		text-align: center;
		border-bottom: 2px solid var(--border-color);
	}

	thead th.feature-col {
		text-align: left;
		width: 180px;
	}

	thead th.highlight {
		color: var(--color-accent);
	}

	tbody tr {
		border-bottom: 1px solid var(--border-color);
	}

	tbody tr:last-child {
		border-bottom: none;
	}

	td {
		padding: var(--space-md) var(--space-lg);
		text-align: center;
		vertical-align: middle;
	}

	.feature-label {
		text-align: left;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-secondary);
	}

	.feature-hint {
		display: block;
		font-size: var(--font-size-xs);
		font-weight: 400;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.feature-value {
		font-size: var(--font-size-sm);
	}

	.feature-value.highlight {
		background: rgba(16, 185, 129, 0.04);
	}

	.feature-text {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
	}

	.check {
		color: var(--color-accent);
		display: inline-block;
	}

	.cross {
		color: var(--text-muted);
		opacity: 0.4;
		display: inline-block;
	}

	/* FAQ */
	.faq {
		padding: 0 0 var(--section-gap);
	}

	.faq h2 {
		font-size: clamp(var(--font-size-xxl), 3.5vw, var(--font-size-3xl));
		font-weight: 700;
		letter-spacing: -0.02em;
		text-align: center;
		margin-bottom: var(--space-4xl);
		color: var(--text-primary);
	}

	.faq-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.faq-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		padding: var(--space-xl) var(--space-xxl);
	}

	.faq-item h3 {
		font-size: var(--font-size-md);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-sm);
	}

	.faq-item p {
		font-size: var(--font-size-md);
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* Closing CTA */
	.closing-cta {
		padding: var(--section-gap) 0;
		text-align: center;
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		border-top: 1px solid var(--border-color);
	}

	.closing-cta h2 {
		font-size: clamp(var(--font-size-xxl), 3.5vw, var(--font-size-3xl));
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-md);
		color: var(--text-primary);
	}

	.closing-cta p {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		margin-bottom: var(--space-xxl);
	}

	.cta-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xxl);
		background-color: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-md);
		font-weight: 600;
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
		box-shadow: var(--shadow-glow);
	}

	.btn-primary:hover {
		background-color: var(--color-accent-hover);
		color: var(--text-inverse);
		transform: translateY(-1px);
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xxl);
		background: transparent;
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		font-weight: 500;
		border: 1px solid var(--border-color-light);
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
	}

	.btn-secondary:hover {
		color: var(--text-primary);
		border-color: var(--text-muted);
	}

	/* Containers */
	.container {
		max-width: var(--container-max);
		margin: 0 auto;
		padding: 0 var(--space-xl);
	}

	.container-narrow {
		max-width: var(--container-narrow);
		margin: 0 auto;
		padding: 0 var(--space-xl);
	}

	/* Responsive */
	@media (max-width: 1100px) {
		.cards-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 640px) {
		.cards-grid {
			grid-template-columns: 1fr;
			max-width: 400px;
			margin: 0 auto;
		}

		.cta-actions {
			flex-direction: column;
		}

		.billing-toggle {
			gap: var(--space-sm);
		}

		thead th, td {
			padding: var(--space-sm) var(--space-md);
			font-size: var(--font-size-xs);
		}

		.feature-label {
			font-size: var(--font-size-xs);
		}
	}
</style>
