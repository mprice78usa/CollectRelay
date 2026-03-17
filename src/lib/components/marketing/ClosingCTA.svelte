<section class="closing-cta">
	<div class="container-narrow">
		<h2>Ready to stop chasing documents?</h2>
		<p>Send requests. Collect files. Stay on track.</p>
		<div class="cta-actions">
			<a href="/register" class="btn-primary">Get started free</a>
			<a href="mailto:info@collectrelay.com" class="btn-secondary">Contact us</a>
		</div>
		<div class="trust-signals">
			<span>No credit card required</span>
			<span class="dot"></span>
			<span>No client accounts needed</span>
			<span class="dot"></span>
			<span>Encrypted in transit &amp; at rest</span>
			<span class="dot"></span>
			<span>Full audit trail</span>
		</div>
	</div>
</section>

<style>
	.closing-cta {
		padding: var(--section-gap) 0;
		text-align: center;
		background: linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
		border-top: 1px solid var(--border-color);
	}

	h2 {
		font-size: clamp(var(--font-size-xxl), 3.5vw, var(--font-size-3xl));
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-md);
	}

	p {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		margin-bottom: var(--space-xxl);
	}

	.cta-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		flex-wrap: wrap;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xxl);
		background-color: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-lg);
		font-weight: 600;
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
		box-shadow: var(--shadow-glow);
	}

	.btn-primary:hover {
		background-color: var(--color-accent-hover);
		color: var(--text-inverse);
		transform: translateY(-1px);
		box-shadow: 0 0 30px rgba(16, 185, 129, 0.25);
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xxl);
		background-color: transparent;
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		font-weight: 500;
		border: 1px solid var(--border-color-light);
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
	}

	.btn-secondary:hover {
		color: var(--text-primary);
		border-color: var(--text-muted);
	}

	.trust-signals {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		margin-top: var(--space-xxl);
		flex-wrap: wrap;
	}

	.trust-signals span {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.trust-signals .dot {
		width: 4px;
		height: 4px;
		background: var(--text-muted);
		border-radius: 50%;
		opacity: 0.5;
	}
</style>
