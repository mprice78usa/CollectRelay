<script lang="ts">
	let context = $state<'real_estate' | 'construction'>('real_estate');

	const mockItems = {
		real_estate: [
			{ name: 'Bank Statement', status: 'accepted' },
			{ name: 'Pay Stub', status: 'pending' },
			{ name: 'Tax Return', status: 'missing' },
		],
		construction: [
			{ name: 'Foundation Pour', status: 'accepted' },
			{ name: 'Electrical Rough-in Note', status: 'pending' },
			{ name: 'Certificate of Insurance', status: 'missing' },
		],
	};

	const statusColors: Record<string, { bg: string; color: string; label: string }> = {
		accepted: { bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981', label: 'Accepted' },
		pending: { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', label: 'Pending' },
		missing: { bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', label: 'Missing' },
	};
</script>

<section class="hero">
	<div class="container hero-inner">
		<h1>Stop Chasing Paperwork.<br />Start Closing Projects.</h1>
		<p class="hero-description">
			CollectRelay turns document chaos into organized checklists.
			Your clients upload, you stay on track — no accounts, no confusion, no back-and-forth.
		</p>
		<div class="hero-actions">
			<a href="/register" class="btn-primary">Get started free</a>
			<a href="#how-it-works" class="btn-secondary">See how it works</a>
		</div>

		<div class="context-swapper">
			<div class="context-tabs">
				<button class="context-tab" class:active={context === 'real_estate'} onclick={() => context = 'real_estate'}>Real Estate</button>
				<button class="context-tab" class:active={context === 'construction'} onclick={() => context = 'construction'}>Construction</button>
			</div>
			<div class="context-card">
				{#each mockItems[context] as item}
					<div class="context-item">
						<span class="context-item-name">{item.name}</span>
						<span class="context-item-status" style="background: {statusColors[item.status].bg}; color: {statusColors[item.status].color}">
							{statusColors[item.status].label}
						</span>
					</div>
				{/each}
			</div>
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

	/* Context Swapper */
	.context-swapper {
		margin-top: var(--space-3xl);
		max-width: 420px;
		margin-left: auto;
		margin-right: auto;
	}

	.context-tabs {
		display: flex;
		justify-content: center;
		gap: 4px;
		margin-bottom: var(--space-md);
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
		padding: 3px;
	}

	.context-tab {
		flex: 1;
		padding: var(--space-xs) var(--space-md);
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.context-tab.active {
		background: var(--color-accent);
		color: var(--text-inverse);
	}

	.context-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.context-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
	}

	.context-item-name {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.context-item-status {
		font-size: var(--font-size-xs);
		font-weight: 600;
		padding: 2px 10px;
		border-radius: var(--radius-full);
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
