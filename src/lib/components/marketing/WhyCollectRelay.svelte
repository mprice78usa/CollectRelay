<section class="why">
	<div class="container">
		<h2>Why CollectRelay</h2>

		<div class="why-grid">
			<div class="why-card">
				<div class="why-icon">
					<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
						<path d="M12 8v4l3 3"/>
					</svg>
				</div>
				<h3>Simple on purpose</h3>
				<p>It does the critical path really well: request, collect, review, sign, done.</p>
			</div>

			<div class="why-card">
				<div class="why-icon">
					<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/>
						<path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
					</svg>
				</div>
				<h3>One portal per transaction</h3>
				<p>No scattered email attachments. No "which version is this?"</p>
			</div>

			<div class="why-card">
				<div class="why-icon">
					<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
						<path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
					</svg>
				</div>
				<h3>Designed to expand</h3>
				<p>Same workflow engine works for insurance, legal, HR onboarding, contractor closeout, and more.</p>
			</div>
		</div>
	</div>
</section>

<style>
	.why {
		padding: var(--section-gap) 0;
	}

	h2 {
		font-size: clamp(var(--font-size-xxl), 3.5vw, var(--font-size-3xl));
		font-weight: 700;
		text-align: center;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-4xl);
	}

	.why-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-xl);
	}

	.why-card {
		text-align: center;
		padding: var(--space-xxl) var(--space-xl);
	}

	.why-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		margin: 0 auto var(--space-lg);
		color: var(--color-accent);
	}

	h3 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin-bottom: var(--space-sm);
	}

	p {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.why-grid {
			grid-template-columns: 1fr;
			max-width: 400px;
			margin: 0 auto;
		}
	}
</style>
