<section class="how-it-works" id="how-it-works">
	<div class="container">
		<h2>How it works</h2>
		<p class="section-subtitle">Three steps to organized document collection.</p>

		<div class="steps">
			<div class="step">
				<div class="step-number">1</div>
				<div class="step-icon">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
						<rect x="9" y="3" width="6" height="4" rx="1"/>
						<path d="M9 12h6M9 16h4"/>
					</svg>
				</div>
				<h3>Build your request</h3>
				<p>Start from a template or create your own checklist in minutes.</p>
			</div>

			<div class="step-connector" aria-hidden="true">
				<svg viewBox="0 0 40 12" width="40" height="12">
					<path d="M0 6h32l-4-4M32 6l-4 4" stroke="var(--border-color-light)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
				</svg>
			</div>

			<div class="step">
				<div class="step-number">2</div>
				<div class="step-icon">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M22 2L11 13"/>
						<path d="M22 2L15 22l-4-9-9-4z"/>
					</svg>
				</div>
				<h3>Send one link</h3>
				<p>Clients upload, scan, and e-sign from their phone or computer. No accounts. No confusion.</p>
			</div>

			<div class="step-connector" aria-hidden="true">
				<svg viewBox="0 0 40 12" width="40" height="12">
					<path d="M0 6h32l-4-4M32 6l-4 4" stroke="var(--border-color-light)" stroke-width="1.5" fill="none" stroke-linecap="round"/>
				</svg>
			</div>

			<div class="step">
				<div class="step-number">3</div>
				<div class="step-icon">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
						<polyline points="22 4 12 14.01 9 11.01"/>
					</svg>
				</div>
				<h3>Stay in control</h3>
				<p>Accept, reject, or request a fix. Track every change with a full timeline.</p>
			</div>
		</div>
	</div>
</section>

<style>
	.how-it-works {
		padding: var(--section-gap) 0;
	}

	h2 {
		font-size: clamp(var(--font-size-xxl), 3.5vw, var(--font-size-3xl));
		font-weight: 700;
		text-align: center;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-sm);
	}

	.section-subtitle {
		text-align: center;
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		margin-bottom: var(--space-4xl);
	}

	.steps {
		display: flex;
		align-items: flex-start;
		justify-content: center;
		gap: var(--space-xl);
	}

	.step {
		flex: 1;
		max-width: 280px;
		text-align: center;
	}

	.step-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background-color: var(--color-accent-bg);
		color: var(--color-accent);
		font-size: var(--font-size-sm);
		font-weight: 700;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-lg);
	}

	.step-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 64px;
		height: 64px;
		margin: 0 auto var(--space-lg);
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		color: var(--color-accent);
	}

	.step h3 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin-bottom: var(--space-sm);
	}

	.step p {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		line-height: 1.6;
	}

	.step-connector {
		display: flex;
		align-items: center;
		padding-top: 88px;
	}

	@media (max-width: 768px) {
		.steps {
			flex-direction: column;
			align-items: center;
		}

		.step-connector {
			display: none;
		}

		.step {
			max-width: 400px;
		}
	}
</style>
