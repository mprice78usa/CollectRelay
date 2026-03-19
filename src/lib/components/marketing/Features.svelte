<section class="features" id="features">
	<div class="container">
		<h2>Everything you need to collect docs</h2>
		<p class="section-subtitle">Simple tools that keep your pipeline moving.</p>

		<div class="feature-grid">
			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
						<rect x="9" y="3" width="6" height="4" rx="1"/>
						<path d="M9 14l2 2 4-4"/>
					</svg>
				</div>
				<h3>Checklists that don't break</h3>
				<p>Templates, required items, due dates, and clear "what's missing" status.</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
						<polyline points="17 8 12 3 7 8"/>
						<line x1="12" y1="3" x2="12" y2="15"/>
					</svg>
				</div>
				<span class="card-badge popular">Popular</span>
				<h3>Client-friendly uploads</h3>
				<p>Drag-and-drop on desktop, camera scan to PDF on mobile, and automatic organization.</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
						<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
					</svg>
				</div>
				<h3>Review and request fixes</h3>
				<p>Reject blurry docs with a note, and get the replacement in the same item thread.</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
					</svg>
				</div>
				<span class="card-badge popular">Popular</span>
				<h3>Built-in e-signatures</h3>
				<p>Send only what needs signing. Store signed copies automatically back in the packet.</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
						<circle cx="9" cy="7" r="4"/>
						<path d="M23 21v-2a4 4 0 00-3-3.87"/>
						<path d="M16 3.13a4 4 0 010 7.75"/>
					</svg>
				</div>
				<h3>Shared visibility</h3>
				<p>Invite partners (agent, processor, escrow, title) with the right permissions.</p>
			</div>

			<div class="feature-card">
				<div class="feature-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/>
						<polyline points="12 6 12 12 16 14"/>
					</svg>
				</div>
				<span class="card-badge new">New</span>
				<h3>Audit trail and correspondence log</h3>
				<p>Every request, upload, reminder, and approval is recorded.</p>
			</div>
		</div>
	</div>
</section>

<style>
	.features {
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

	.feature-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-xl);
	}

	.feature-card {
		padding: var(--space-xxl);
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
	}

	.feature-card:hover {
		border-color: var(--border-color-light);
		box-shadow: var(--shadow-md);
	}

	.feature-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		height: 44px;
		background-color: var(--color-accent-bg);
		border-radius: var(--radius-lg);
		color: var(--color-accent);
		margin-bottom: var(--space-lg);
	}

	.card-badge {
		display: inline-block;
		padding: 2px 10px;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-sm);
	}

	.card-badge.popular {
		background: rgba(16, 185, 129, 0.12);
		color: #10b981;
	}

	.card-badge.new {
		background: rgba(74, 122, 245, 0.12);
		color: #4a7af5;
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

	@media (max-width: 900px) {
		.feature-grid {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.feature-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
