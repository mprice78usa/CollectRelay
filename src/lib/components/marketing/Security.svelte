<section class="security" id="security">
	<div class="container-narrow">
		<h2>Security and privacy are built in</h2>
		<p class="subtitle">Your sensitive documents are protected by layered security controls at every level.</p>

		<div class="security-grid">
			<div class="security-item">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
					<path d="M7 11V7a5 5 0 0110 0v4"/>
				</svg>
				<span>Encrypted file storage</span>
			</div>
			<div class="security-item">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
				</svg>
				<span>Role-based access</span>
			</div>
			<div class="security-item">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10"/>
					<polyline points="12 6 12 12 16 14"/>
				</svg>
				<span>Expiring secure links</span>
			</div>
			<div class="security-item">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
					<polyline points="14 2 14 8 20 8"/>
					<line x1="16" y1="13" x2="8" y2="13"/>
					<line x1="16" y1="17" x2="8" y2="17"/>
				</svg>
				<span>Full audit trail</span>
			</div>
			<div class="security-item">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
					<path d="M13.73 21a2 2 0 01-3.46 0"/>
					<line x1="1" y1="1" x2="23" y2="23"/>
				</svg>
				<span>WAF &amp; bot protection</span>
			</div>
			<div class="security-item">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
					<line x1="3" y1="9" x2="21" y2="9"/>
					<line x1="9" y1="21" x2="9" y2="9"/>
				</svg>
				<span>HSTS &amp; Content Security Policy</span>
			</div>
			<div class="security-item">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
				</svg>
				<span>Rate limiting</span>
			</div>
			<div class="security-item">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
					<path d="M9 12l2 2 4-4"/>
				</svg>
				<span>Input sanitization</span>
			</div>
		</div>

		<a href="/security" class="learn-more">
			Learn more about our security practices
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
			</svg>
		</a>
	</div>
</section>

<style>
	.security {
		padding: var(--section-gap) 0;
		text-align: center;
	}

	h2 {
		font-size: clamp(var(--font-size-xxl), 3.5vw, var(--font-size-3xl));
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-md);
	}

	.subtitle {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		margin-bottom: var(--space-4xl);
		max-width: 520px;
		margin-left: auto;
		margin-right: auto;
	}

	.security-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-xl);
		max-width: 720px;
		margin: 0 auto;
	}

	.security-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background-color: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		font-size: var(--font-size-md);
		color: var(--text-secondary);
	}

	.learn-more {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		margin-top: var(--space-xxl);
		color: var(--color-accent);
		font-size: var(--font-size-md);
		font-weight: 500;
		transition: gap var(--transition-fast);
	}

	.learn-more:hover {
		gap: var(--space-sm);
		color: var(--color-accent-hover);
	}

	@media (max-width: 560px) {
		.security-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
