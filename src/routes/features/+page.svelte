<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>Features — CollectRelay</title>
	<meta name="description" content="Explore every feature of CollectRelay — transaction management, document collection, templates, reports, team management, API integrations, and more." />
</svelte:head>

<Navbar />

<main class="features-page">
	<!-- Hero -->
	<section class="hero">
		<div class="container">
			<span class="badge">Platform</span>
			<h1>Everything you need to collect documents</h1>
			<p class="hero-sub">One platform for checklists, uploads, e-signatures, reporting, and team collaboration — built for professionals who manage client paperwork.</p>
		</div>
	</section>

	<!-- Core Platform -->
	<section class="feature-section">
		<div class="container">
			<div class="section-header">
				<h2>Core Platform</h2>
				<p>The foundation for every transaction</p>
			</div>
			<div class="grid grid-3">
				<div class="feature-card">
					<div class="icon-wrap accent-green">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
						</svg>
					</div>
					<h3>Transaction Management</h3>
					<p>Create and track deals with checklists, milestones, partners, and status workflows. Move transactions from Draft to Completed with full visibility at every stage.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-blue">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
						</svg>
					</div>
					<h3>Document Collection</h3>
					<p>Secure client portal for uploading, reviewing, and approving documents. Clients get a magic link — no login required. Drag-and-drop uploads with mobile support.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-purple">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
						</svg>
					</div>
					<h3>Templates</h3>
					<p>Save and reuse transaction templates with pre-built checklists and milestones. Start with four included templates or create custom ones for your workflow.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-amber">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
					<h3>Client Portal</h3>
					<p>Branded, mobile-friendly portal where clients upload documents, answer questions, and sign electronically. Progress tracker shows them exactly what remains.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-pink">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
						</svg>
					</div>
					<h3>E-Signatures</h3>
					<p>Built-in electronic signature collection. Clients can draw or type their signature directly in the portal. Signed documents are auto-stored with timestamps.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-red">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
						</svg>
					</div>
					<h3>Milestones &amp; Key Dates</h3>
					<p>Track critical deadlines like inspection, appraisal, financing contingency, and closing. Check off completed milestones and export to calendar.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Analytics & Insights -->
	<section class="feature-section alt-bg">
		<div class="container">
			<div class="section-header">
				<h2>Analytics &amp; Insights</h2>
				<p>Data-driven decision making for your pipeline</p>
			</div>
			<div class="grid grid-2">
				<div class="feature-card">
					<div class="icon-wrap accent-green">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
						</svg>
					</div>
					<h3>Pipeline Funnel</h3>
					<p>Visualize your transaction pipeline from Draft through Active, In Review, Completed, and Cancelled stages. See counts and dollar values at each stage with horizontal bar charts.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-amber">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
						</svg>
					</div>
					<h3>Commission Tracker</h3>
					<p>Track earned, pending, and forecasted commissions with a proportional breakdown bar. Know exactly where your revenue stands at any given moment.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-blue">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
						</svg>
					</div>
					<h3>Completion Metrics</h3>
					<p>Average days to close, average items per transaction, and total completed count. Measure efficiency and identify bottlenecks in your process.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-red">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
						</svg>
					</div>
					<h3>Activity Trends &amp; CSV Export</h3>
					<p>Weekly and monthly activity charts showing transaction volume. Filter by date range (7d, 30d, 90d, all time). Export all report data to CSV for external analysis.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Team & Integrations -->
	<section class="feature-section">
		<div class="container">
			<div class="section-header">
				<h2>Team &amp; Integrations</h2>
				<p>Collaborate with your team and connect your tools</p>
			</div>
			<div class="grid grid-3">
				<div class="feature-card">
					<div class="icon-wrap accent-purple">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
						</svg>
					</div>
					<h3>Team Management</h3>
					<p>Invite team members by email and assign roles — owner, admin, or member. Manage workspace access with role-based permissions and pending invitation tracking.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-green">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>
						</svg>
					</div>
					<h3>Webhooks</h3>
					<p>Connect CollectRelay to any external service. Subscribe to events like file uploads, answer submissions, signature completions, status changes, and more.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-blue">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
						</svg>
					</div>
					<h3>REST API &amp; Keys</h3>
					<p>Public API with key management for integrating CollectRelay into your existing tools and workflows. Create, rotate, and revoke API keys from settings.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-amber">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
						</svg>
					</div>
					<h3>Bulk Actions</h3>
					<p>Select multiple transactions to archive, export, change status, or delete in batch. Save time on routine operations with a single click.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-pink">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
						</svg>
					</div>
					<h3>Document Library</h3>
					<p>Searchable archive of all uploaded documents across transactions. Filter by type, date, or transaction name. Download individual files or in bulk.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-red">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
						</svg>
					</div>
					<h3>Activity Dashboard</h3>
					<p>Real-time feed of all activity across your workspace. Track submissions, reviews, approvals, status changes, and comments as they happen.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Platform -->
	<section class="feature-section alt-bg">
		<div class="container">
			<div class="section-header">
				<h2>Platform</h2>
				<p>Built for speed, security, and your brand</p>
			</div>
			<div class="grid grid-3">
				<div class="feature-card">
					<div class="icon-wrap accent-green">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>
						</svg>
					</div>
					<h3>PWA &amp; Push Notifications</h3>
					<p>Install CollectRelay as a native app on any device — desktop, tablet, or phone. Get real-time push notifications for new submissions and status updates.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-pink">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="13.5" cy="6.5" r="2.5"/><path d="M17 2H7a5 5 0 00-5 5v10a5 5 0 005 5h10a5 5 0 005-5V7a5 5 0 00-5-5z"/>
						</svg>
					</div>
					<h3>Custom Branding</h3>
					<p>White-label the client portal with your logo, brand colors, and company name. Give clients a seamless experience that looks like your own platform.</p>
				</div>
				<div class="feature-card">
					<div class="icon-wrap accent-blue">
						<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
						</svg>
					</div>
					<h3>Security &amp; Encryption</h3>
					<p>Encrypted in transit (TLS 1.3) and at rest. Files stored on Cloudflare R2 with signed URLs. Session-based auth, rate limiting, and comprehensive audit trails.</p>
				</div>
			</div>
		</div>
	</section>

	<!-- CTA -->
	<section class="cta-section">
		<div class="container">
			<h2>Ready to simplify your document collection?</h2>
			<p>Start free — no credit card required. Upgrade when you're ready.</p>
			<div class="cta-actions">
				<a href="/register" class="btn-primary">Get started free</a>
				<a href="/pricing" class="btn-secondary">View pricing</a>
			</div>
		</div>
	</section>
</main>

<Footer />

<style>
	.features-page {
		padding-top: 80px;
	}

	/* Hero */
	.hero {
		text-align: center;
		padding: var(--space-5xl) 0 var(--space-4xl);
	}

	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-lg);
		background: var(--color-accent-bg);
		color: var(--color-accent);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-xl);
		letter-spacing: 0.03em;
	}

	.hero h1 {
		font-size: clamp(32px, 5vw, 48px);
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1.15;
		max-width: 700px;
		margin: 0 auto var(--space-lg);
		letter-spacing: -0.03em;
	}

	.hero-sub {
		font-size: clamp(16px, 2vw, 20px);
		color: var(--text-secondary);
		max-width: 640px;
		margin: 0 auto;
		line-height: 1.6;
	}

	/* Sections */
	.feature-section {
		padding: var(--section-gap) 0;
	}

	.feature-section.alt-bg {
		background: var(--bg-secondary);
		border-top: 1px solid var(--border-color);
		border-bottom: 1px solid var(--border-color);
	}

	.section-header {
		text-align: center;
		margin-bottom: var(--space-4xl);
	}

	.section-header h2 {
		font-size: clamp(24px, 3.5vw, 36px);
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 var(--space-sm);
		letter-spacing: -0.02em;
	}

	.section-header p {
		font-size: var(--font-size-lg);
		color: var(--text-muted);
	}

	/* Grid */
	.grid {
		display: grid;
		gap: var(--space-xl);
	}

	.grid-3 {
		grid-template-columns: repeat(3, 1fr);
	}

	.grid-2 {
		grid-template-columns: repeat(2, 1fr);
	}

	/* Feature Cards */
	.feature-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		padding: var(--space-xxl);
		transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
	}

	.alt-bg .feature-card {
		background: var(--bg-primary);
	}

	.feature-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
		border-color: var(--border-color-light);
	}

	.icon-wrap {
		width: 44px;
		height: 44px;
		border-radius: var(--radius-lg);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: var(--space-lg);
	}

	.icon-wrap.accent-green { background: rgba(16, 185, 129, 0.12); color: #10b981; }
	.icon-wrap.accent-blue { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
	.icon-wrap.accent-purple { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
	.icon-wrap.accent-amber { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
	.icon-wrap.accent-pink { background: rgba(236, 72, 153, 0.12); color: #ec4899; }
	.icon-wrap.accent-red { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

	.feature-card h3 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 var(--space-sm);
	}

	.feature-card p {
		font-size: var(--font-size-md);
		color: var(--text-secondary);
		line-height: 1.6;
		margin: 0;
	}

	/* CTA */
	.cta-section {
		text-align: center;
		padding: var(--section-gap) 0;
		border-top: 1px solid var(--border-color);
	}

	.cta-section h2 {
		font-size: clamp(24px, 3.5vw, 36px);
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 var(--space-md);
		letter-spacing: -0.02em;
	}

	.cta-section p {
		font-size: var(--font-size-lg);
		color: var(--text-secondary);
		margin: 0 0 var(--space-xxl);
	}

	.cta-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xxl);
		background-color: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-md);
		font-weight: 600;
		border-radius: var(--radius-md);
		transition: background-color var(--transition-fast);
	}

	.btn-primary:hover {
		background-color: var(--color-accent-hover);
		color: var(--text-inverse);
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xxl);
		background: transparent;
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		font-weight: 500;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
		transition: all var(--transition-fast);
	}

	.btn-secondary:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
		border-color: var(--border-color-light);
	}

	/* Responsive */
	@media (max-width: 900px) {
		.grid-3 {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (max-width: 560px) {
		.grid-3, .grid-2 {
			grid-template-columns: 1fr;
		}

		.hero {
			padding: var(--space-3xl) 0 var(--space-xxl);
		}

		.feature-section {
			padding: var(--space-4xl) 0;
		}

		.feature-card {
			padding: var(--space-xl);
		}

		.cta-actions {
			flex-direction: column;
		}
	}
</style>
