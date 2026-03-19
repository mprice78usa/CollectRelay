<script lang="ts">
</script>

<section class="hero">
	<div class="container hero-inner">
		<div class="hero-content">
			<div class="hero-text">
				<h1>Stop Chasing Paperwork.<br />Start Closing Projects.</h1>
				<p class="hero-description">
					CollectRelay turns document chaos into organized checklists.
					Your clients upload, you stay on track — no accounts, no confusion, no back-and-forth.
				</p>
				<div class="hero-actions">
					<a href="/register" class="btn-primary">Get started free</a>
					<a href="#how-it-works" class="btn-secondary">See how it works</a>
				</div>
			</div>
			<div class="hero-visual">
				<div class="phone-frame">
					<video
						autoplay
						loop
						muted
						playsinline
						poster="/images/screenshots/client-portal-poster.png"
						class="phone-video"
					>
						<source src="/images/screenshots/client-portal-mobile.mp4" type="video/mp4" />
					</video>
				</div>
				<span class="phone-caption">What your client sees</span>
			</div>
		</div>
	</div>
	<div class="hero-glow" aria-hidden="true"></div>
</section>

<style>
	.hero {
		position: relative;
		padding: calc(var(--space-4xl) + 60px) 0 var(--space-3xl);
		overflow: hidden;
	}

	.hero-inner {
		position: relative;
		z-index: 1;
	}

	.hero-content {
		display: flex;
		align-items: center;
		gap: var(--space-4xl);
	}

	.hero-text {
		flex: 1;
		min-width: 0;
	}

	h1 {
		font-size: clamp(var(--font-size-3xl), 4.5vw, var(--font-size-5xl));
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
		max-width: 540px;
		margin-bottom: var(--space-xxl);
		line-height: 1.7;
	}

	.hero-actions {
		display: flex;
		align-items: center;
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

	/* Phone mockup */
	.hero-visual {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
	}

	.phone-frame {
		position: relative;
		width: 280px;
		height: 570px;
		background: #1a1a2e;
		border-radius: 40px;
		padding: 12px;
		box-shadow:
			0 0 0 2px rgba(255, 255, 255, 0.08),
			0 20px 60px rgba(0, 0, 0, 0.5),
			0 0 80px rgba(16, 185, 129, 0.08);
		overflow: hidden;
	}

	.phone-video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 28px;
	}

	.phone-caption {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		font-weight: 500;
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
			padding: calc(var(--space-3xl) + 60px) 0 var(--space-xxl);
		}

		.hero-content {
			flex-direction: column;
			text-align: center;
		}

		.hero-description {
			font-size: var(--font-size-md);
			margin-left: auto;
			margin-right: auto;
		}

		.hero-actions {
			justify-content: center;
		}

		.phone-frame {
			width: 220px;
			height: 450px;
			border-radius: 32px;
			padding: 10px;
		}

		.phone-notch {
			width: 100px;
			height: 24px;
			top: 10px;
		}

		.phone-video {
			border-radius: 22px;
		}
	}
</style>
