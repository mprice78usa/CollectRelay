<script lang="ts">
	let activeTab = $state('real-estate');

	const tabs = [
		{ id: 'real-estate', label: 'Real Estate' },
		{ id: 'contractors', label: 'Contractors' }
	];

	const industries: Record<string, {
		badge: string;
		heading: string;
		description: string;
		useCases: string[];
		ctaLabel: string;
		ctaHref: string;
		mock: { title: string; progress: string; items: { name: string; status: string; state: string }[] };
	}> = {
		'real-estate': {
			badge: 'Real Estate',
			heading: 'Made for real estate transactions',
			description: 'Pre-approvals, purchases, refinances, disclosures, and closeout packets. CollectRelay keeps borrowers moving and keeps your pipeline clean.',
			useCases: [
				'Borrower document collection (income, assets, ID)',
				'Contract and disclosure packets',
				'Missing item follow-ups without back-and-forth',
				'E-sign forms and acknowledgements'
			],
			ctaLabel: 'View real estate templates',
			ctaHref: '/register',
			mock: {
				title: 'Purchase — Smith Residence',
				progress: '5 of 8',
				items: [
					{ name: 'Government ID', status: 'Accepted', state: 'accepted' },
					{ name: 'Paystubs (30 days)', status: 'Accepted', state: 'accepted' },
					{ name: 'W-2s (2 years)', status: 'In review', state: 'submitted' },
					{ name: 'Bank statements', status: 'Missing', state: 'missing' },
					{ name: 'Purchase contract', status: 'Missing', state: 'missing' }
				]
			}
		},
		contractors: {
			badge: 'Contractors',
			heading: 'Built for construction projects',
			description: 'Permits, insurance certs, lien waivers, and change orders. Stop chasing subcontractors for paperwork and keep your jobs compliant.',
			useCases: [
				'Subcontractor insurance certificates (COI)',
				'Permits and license verification',
				'Lien waivers and change order signatures',
				'Safety compliance documentation'
			],
			ctaLabel: 'Explore contractor features',
			ctaHref: '/industries/contractors',
			mock: {
				title: 'Renovation — 412 Oak Ave',
				progress: '3 of 6',
				items: [
					{ name: 'General liability COI', status: 'Accepted', state: 'accepted' },
					{ name: 'W-9 form', status: 'Accepted', state: 'accepted' },
					{ name: 'Building permit', status: 'In review', state: 'submitted' },
					{ name: 'Lien waiver', status: 'Missing', state: 'missing' },
					{ name: 'Workers comp cert', status: 'Missing', state: 'missing' }
				]
			}
		},
	};

	$effect(() => {
		// Reactive reference to keep industry data in sync
		activeTab;
	});
</script>

<section class="industries" id="industries">
	<div class="container">
		<div class="section-header">
			<h2>Built for your industry</h2>
			<p>Purpose-built workflows for the professionals who need them most.</p>
		</div>

		<div class="tab-bar">
			{#each tabs as tab}
				<button
					class="tab-btn"
					class:active={activeTab === tab.id}
					onclick={() => (activeTab = tab.id)}
				>
					{tab.label}
				</button>
			{/each}
		</div>

		{#key activeTab}
			{@const industry = industries[activeTab]}
			<div class="industry-content">
				<div class="industry-text">
					<span class="badge">{industry.badge}</span>
					<h3>{industry.heading}</h3>
					<p class="industry-desc">{industry.description}</p>

					<ul class="use-cases">
						{#each industry.useCases as useCase}
							<li>
								<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-accent)" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
								{useCase}
							</li>
						{/each}
					</ul>

					<a href={industry.ctaHref} class="btn-outline">{industry.ctaLabel}</a>
				</div>

				<div class="industry-visual">
					{#if activeTab === 'real-estate'}
						<div class="industry-screenshot browser-frame">
							<div class="browser-bar"><span></span><span></span><span></span></div>
							<img src="/images/screenshots/project-detail.png" alt="Real estate project with document checklist" loading="lazy" />
						</div>
					{:else}
						<div class="industry-screenshot browser-frame">
							<div class="browser-bar"><span></span><span></span><span></span></div>
							<img src="/images/screenshots/documents.png" alt="Document center with construction forms" loading="lazy" />
						</div>
					{/if}
				</div>
			</div>
		{/key}
	</div>
</section>

<style>
	.industries {
		padding: var(--section-gap) 0;
		background-color: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
		border-bottom: 1px solid var(--border-color);
	}

	.section-header {
		text-align: center;
		margin-bottom: var(--space-xxl);
	}

	.section-header h2 {
		font-size: clamp(var(--font-size-xxl), 3vw, var(--font-size-3xl));
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-sm);
	}

	.section-header p {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
	}

	/* Tab bar */
	.tab-bar {
		display: flex;
		justify-content: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-4xl);
	}

	.tab-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-xl);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.tab-btn:hover {
		border-color: var(--color-accent);
		color: var(--text-primary);
	}

	.tab-btn.active {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--text-inverse);
	}

	.tab-btn.active .soon-tag {
		background: rgba(255, 255, 255, 0.2);
		color: var(--text-inverse);
	}

	.soon-tag {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		padding: 1px 6px;
		background: rgba(245, 158, 11, 0.15);
		color: var(--color-warning);
		border-radius: var(--radius-full);
	}

	/* Industry content */
	.industry-content {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-4xl);
		align-items: center;
		animation: fadeSlide 0.3s ease-out;
	}

	@keyframes fadeSlide {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-md);
		background-color: var(--color-accent-bg);
		color: var(--color-accent);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-lg);
	}

	h3 {
		font-size: clamp(var(--font-size-xl), 2.5vw, var(--font-size-xxl));
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-lg);
	}

	.industry-desc {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		line-height: 1.7;
		margin-bottom: var(--space-xxl);
	}

	.use-cases {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		margin-bottom: var(--space-xxl);
	}

	.use-cases li {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		color: var(--text-secondary);
		font-size: var(--font-size-md);
	}

	.btn-outline {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xl);
		border: 1px solid var(--color-accent);
		color: var(--color-accent);
		font-size: var(--font-size-md);
		font-weight: 600;
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
	}

	.btn-outline:hover {
		background-color: var(--color-accent-bg);
		color: var(--color-accent-hover);
	}

	/* Mock checklist visual */
	.industry-visual {
		display: flex;
		justify-content: center;
	}

	.industry-screenshot {
		width: 100%;
		max-width: 100%;
		border-radius: var(--radius-xl);
		overflow: hidden;
	}

	.industry-screenshot img {
		display: block;
		width: 100%;
		height: auto;
	}

	/* Browser chrome frame */
	.browser-frame {
		background: #1e2030;
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(16, 185, 129, 0.06);
	}

	.browser-bar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px 14px;
		background: #161825;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.browser-bar span {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.browser-bar span:first-child { background: #ff5f57; }
	.browser-bar span:nth-child(2) { background: #febc2e; }
	.browser-bar span:nth-child(3) { background: #28c840; }

	@media (max-width: 768px) {
		.industry-content {
			grid-template-columns: 1fr;
		}

		.industry-visual {
			order: -1;
		}

		.tab-bar {
			flex-wrap: wrap;
		}
	}
</style>
