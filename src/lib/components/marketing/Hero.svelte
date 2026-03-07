<section class="hero">
	<div class="container hero-inner">
		<h1>Send requests. Collect files.<br />Stay on track.</h1>
		<p class="hero-description">
			A simple client portal for document collection, checklists, and e-signatures.
			Built for real estate pros now and designed to expand into any workflow that depends
			on getting the right files, on time.
		</p>
		<div class="hero-actions">
			<a href="/register" class="btn-primary">Create a request</a>
			<a href="#how-it-works" class="btn-secondary">See how it works</a>
		</div>
	</div>
	<div class="hero-glow" aria-hidden="true"></div>
</section>

<style>
	.hero {
		position: relative;
		padding: calc(var(--space-5xl) + 60px) 0 var(--space-5xl);
		text-align: center;
		overflow: hidden;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
	}

	h1 {
		font-size: clamp(var(--font-size-3xl), 5vw, var(--font-size-5xl));
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.03em;
		margin-bottom: var(--space-xl);
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--color-accent-hover) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.hero-description {
		font-size: var(--font-size-lg);
		color: var(--text-secondary);
		max-width: 640px;
		margin: 0 auto var(--space-xxl);
		line-height: 1.7;
	}

	.hero-actions {
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

	.hero-glow {
		position: absolute;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 600px;
		height: 400px;
		background: radial-gradient(ellipse, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
		pointer-events: none;
	}

	@media (max-width: 768px) {
		.hero {
			padding: calc(var(--space-4xl) + 60px) 0 var(--space-4xl);
		}

		.hero-description {
			font-size: var(--font-size-md);
		}
	}
</style>
