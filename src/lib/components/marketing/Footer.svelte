<footer class="footer">
	<div class="container">
		<div class="footer-inner">
			<div class="footer-brand">
				<a href="/" class="logo">
					<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
						<rect width="32" height="32" rx="6" fill="var(--bg-tertiary)"/>
						<path d="M8 10h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
						<path d="M8 16h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-hover)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
						<path d="M8 22h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-dim)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
					</svg>
					<span>CollectRelay</span>
				</a>
				<p>&copy; {new Date().getFullYear()} CollectRelay. All rights reserved.</p>
			</div>

			<div class="footer-links">
				<div class="footer-col">
					<h4>Product</h4>
					<a href="/features">Features</a>
					<a href="#how-it-works">How it works</a>
					<a href="/pricing">Pricing</a>
					<a href="/security">Security</a>
				</div>
				<div class="footer-col">
					<h4>Industries</h4>
					<a href="/industries/real-estate">Real Estate</a>
					<a href="/industries/contractors">Contractors</a>
					<a href="/industries/accountants">Accountants</a>
					<a href="/industries/hr">Human Resources</a>
				</div>
				<div class="footer-col">
					<h4>Company</h4>
					<a href="mailto:info@collectrelay.com">Contact</a>
				</div>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer {
		padding: var(--space-4xl) 0 var(--space-xxl);
		border-top: 1px solid var(--border-color);
	}

	.footer-inner {
		display: flex;
		justify-content: space-between;
		gap: var(--space-4xl);
	}

	.footer-brand {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-primary);
		font-size: var(--font-size-md);
		font-weight: 700;
	}

	.logo:hover {
		color: var(--text-primary);
	}

	.footer-brand p {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.footer-links {
		display: flex;
		gap: var(--space-4xl);
	}

	.footer-col {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.footer-col h4 {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-xs);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.footer-col a {
		color: var(--text-muted);
		font-size: var(--font-size-md);
		transition: color var(--transition-fast);
	}

	.footer-col a:hover {
		color: var(--text-secondary);
	}

	@media (max-width: 560px) {
		.footer-inner {
			flex-direction: column;
			gap: var(--space-xxl);
		}

		.footer-links {
			gap: var(--space-xxl);
		}
	}
</style>
