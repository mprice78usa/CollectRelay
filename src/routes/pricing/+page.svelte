<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';

	let annual = $state(false);
	let loading = $state<string | null>(null);

	const plans = [
		{
			key: 'single',
			name: 'Single User',
			users: 1,
			storage: '500 GB',
			monthly: 49.99,
			annualMonthly: 39.99,
			popular: false
		},
		{
			key: 'team5',
			name: 'Team 5',
			users: 5,
			storage: '2.5 TB',
			monthly: 239.99,
			annualMonthly: 191.99,
			popular: true
		},
		{
			key: 'team10',
			name: 'Team 10',
			users: 10,
			storage: '5 TB',
			monthly: 449.99,
			annualMonthly: 359.99,
			popular: false
		},
		{
			key: 'team25',
			name: 'Team 25',
			users: 25,
			storage: '12.5 TB',
			monthly: 999.99,
			annualMonthly: 799.99,
			popular: false
		}
	];

	function price(plan: typeof plans[0]) {
		return annual ? plan.annualMonthly : plan.monthly;
	}

	function formatPrice(n: number) {
		return n.toFixed(2);
	}

	async function handleSubscribe(planKey: string) {
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
				// Not logged in — redirect to register with plan info so checkout resumes after signup
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
	<meta name="description" content="Simple, transparent pricing for document collection. Start with one user or scale with your team." />
</svelte:head>

<Navbar />

<main>
	<!-- Hero -->
	<section class="pricing-hero">
		<div class="container">
			<h1>Simple, transparent pricing</h1>
			<p class="hero-subtitle">Start collecting documents in minutes. Scale as your team grows.</p>

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
					<span class="save-badge">Save 20%</span>
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
							<p class="plan-detail">
								{plan.users} {plan.users === 1 ? 'user' : 'users'} · {plan.storage} pooled storage
							</p>
						</div>
						<div class="plan-price">
							<span class="dollar">$</span>
							<span class="amount">{formatPrice(price(plan))}</span>
							<span class="period">/mo</span>
						</div>
						{#if annual}
							<p class="billing-note">Billed monthly · Annual commitment</p>
						{:else}
							<p class="billing-note">Billed monthly · No commitment</p>
						{/if}
						<button
							class="plan-cta"
							class:primary={plan.popular}
							disabled={loading === plan.key}
							onclick={() => handleSubscribe(plan.key)}
						>
							{loading === plan.key ? 'Redirecting...' : 'Get started'}
						</button>
						<ul class="plan-features">
							<li>
								<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
								{plan.users} {plan.users === 1 ? 'user seat' : 'user seats'}
							</li>
							<li>
								<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
								{plan.storage} pooled storage
							</li>
							<li>
								<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
								Unlimited transactions
							</li>
							<li>
								<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
								Custom templates
							</li>
							<li>
								<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
								Client portal & magic links
							</li>
							<li>
								<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
								Email notifications
							</li>
							<li>
								<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
								Audit trail
							</li>
							{#if plan.users > 1}
								<li>
									<svg viewBox="0 0 24 24" width="16" height="16"><polyline points="20 6 9 17 4 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
									Team collaboration
								</li>
							{/if}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- Add-ons -->
	<section class="addons">
		<div class="container-narrow">
			<h2>Need more?</h2>
			<p class="section-subtitle">Simple add-ons, no surprises.</p>

			<div class="addons-grid">
				<div class="addon-card">
					<div class="addon-icon">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
							<polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
							<line x1="12" y1="22.08" x2="12" y2="12"/>
						</svg>
					</div>
					<h3>Extra storage</h3>
					<div class="addon-price">
						<span class="amount">$15</span>
						<span class="unit">/TB/mo</span>
					</div>
					<p>Add pooled storage in 1 TB increments to any plan.</p>
				</div>

				<div class="addon-card">
					<div class="addon-icon">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
							<circle cx="9" cy="7" r="4"/>
							<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
							<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
						</svg>
					</div>
					<h3>Extra user seats</h3>
					<div class="addon-price">
						<span class="amount">${annual ? '35.99' : '44.99'}</span>
						<span class="unit">/user/mo</span>
					</div>
					<p>Add seats to any team plan. {annual ? 'Annual rate applied.' : 'Or $35.99/user/mo with annual commitment.'}</p>
				</div>
			</div>
		</div>
	</section>

	<!-- FAQ -->
	<section class="faq">
		<div class="container-narrow">
			<h2>Frequently asked questions</h2>
			<div class="faq-list">
				<div class="faq-item">
					<h3>What does "pooled storage" mean?</h3>
					<p>Your storage quota is shared across your entire workspace — all users, transactions, and files draw from the same pool. No per-user limits to worry about.</p>
				</div>
				<div class="faq-item">
					<h3>Can I switch plans later?</h3>
					<p>Absolutely. Upgrade or downgrade at any time. When upgrading, you'll be prorated for the remainder of your billing period.</p>
				</div>
				<div class="faq-item">
					<h3>What happens if I exceed my storage?</h3>
					<p>We'll notify you when you're approaching your limit. You can add extra storage at $15/TB/mo, or upgrade to a higher plan.</p>
				</div>
				<div class="faq-item">
					<h3>Is there a free trial?</h3>
					<p>Yes — every plan comes with a 14-day free trial. No credit card required to start.</p>
				</div>
				<div class="faq-item">
					<h3>What's the annual commitment?</h3>
					<p>Annual plans are still billed monthly — you just commit to 12 months and save 20%. Cancel anytime during the first 30 days for a full refund.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="closing-cta">
		<div class="container-narrow">
			<h2>Ready to streamline your document collection?</h2>
			<p>Start your 14-day free trial. No credit card required.</p>
			<div class="cta-actions">
				<a href="/register" class="btn-primary">Get started free</a>
				<a href="mailto:info@collectrelay.com" class="btn-secondary">Talk to sales</a>
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

	.plan-detail {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.plan-price {
		display: flex;
		align-items: baseline;
		gap: 2px;
		margin-bottom: var(--space-xs);
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

	.billing-note {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-bottom: var(--space-xl);
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
		margin-bottom: var(--space-xl);
		cursor: pointer;

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

	.plan-features {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.plan-features li {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.plan-features li svg {
		flex-shrink: 0;
		color: var(--color-accent);
	}

	/* Add-ons */
	.addons {
		padding: 0 0 var(--section-gap);
		text-align: center;
	}

	.addons h2,
	.faq h2 {
		font-size: clamp(var(--font-size-xxl), 3.5vw, var(--font-size-3xl));
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-sm);
		color: var(--text-primary);
	}

	.section-subtitle {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		margin-bottom: var(--space-4xl);
	}

	.addons-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-xl);
		text-align: left;
	}

	.addon-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		padding: var(--space-xxl);
		transition: border-color var(--transition-normal);
	}

	.addon-card:hover {
		border-color: var(--border-color-light);
	}

	.addon-icon {
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-accent-bg);
		border-radius: var(--radius-lg);
		color: var(--color-accent);
		margin-bottom: var(--space-lg);
	}

	.addon-card h3 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-sm);
	}

	.addon-price {
		display: flex;
		align-items: baseline;
		gap: 4px;
		margin-bottom: var(--space-md);
	}

	.addon-price .amount {
		font-size: var(--font-size-xxl);
		font-weight: 800;
		color: var(--text-primary);
	}

	.addon-price .unit {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.addon-card p {
		font-size: var(--font-size-md);
		color: var(--text-secondary);
		line-height: 1.6;
	}

	/* FAQ */
	.faq {
		padding: 0 0 var(--section-gap);
	}

	.faq h2 {
		text-align: center;
		margin-bottom: var(--space-4xl);
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

		.addons-grid {
			grid-template-columns: 1fr;
		}

		.cta-actions {
			flex-direction: column;
		}

		.billing-toggle {
			gap: var(--space-sm);
		}
	}
</style>
