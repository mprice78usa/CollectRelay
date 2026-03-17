<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>CollectRelay for Real Estate — Streamline Every Transaction</title>
	<meta name="description" content="Document collection built for real estate professionals. Mortgage docs, title packages, and closing paperwork — streamlined with AI." />
</svelte:head>

<Navbar />

<main class="industry-page">
	<div class="container">
		<section class="hero-section">
			<span class="badge">Real Estate</span>
			<h1>Stop Chasing Paperwork.<br />Start Closing Deals.</h1>
			<p class="lead">
				Mortgage applications, title documents, closing disclosures, proof of funds — real estate
				transactions generate mountains of paperwork. CollectRelay replaces the email chains and
				shared folders with a single, organized portal for every deal.
			</p>
			<div class="hero-actions">
				<a href="/register" class="btn-primary">Get started free</a>
				<a href="#how-it-works" class="btn-secondary">See how it works</a>
			</div>
		</section>

		<section class="features-section">
			<h2 class="section-title">Built for Real Estate Professionals</h2>
			<p class="section-sub">From pre-approval to closing, keep every document organized and every party aligned.</p>

			<div class="features-grid">
				<div class="feature-card">
					<div class="feature-icon green">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
						</svg>
					</div>
					<h3>Mortgage Document Collection</h3>
					<p>Request pay stubs, bank statements, tax returns, and employment verification with a single link per borrower. Clients upload on their schedule — you track progress in real time.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon blue">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15l2 2 4-4"/>
						</svg>
					</div>
					<h3>Title & Closing Packages</h3>
					<p>Organize title commitments, surveys, HOA docs, and closing disclosures by transaction. Review and approve documents with built-in status tracking.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon amber">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>
						</svg>
					</div>
					<h3>Multi-Party Coordination</h3>
					<p>Buyers, sellers, agents, lenders, title companies — everyone involved gets their own view. No more forwarding docs between parties or wondering who has the latest version.</p>
				</div>
			</div>
		</section>

		<!-- AI-Powered Tools -->
		<section class="features-section">
			<div class="ai-badge-wrap"><span class="ai-badge">AI-Powered</span></div>
			<h2 class="section-title">Smart Tools for Modern Agents</h2>
			<p class="section-sub">AI that works behind the scenes so you can focus on closing deals.</p>

			<div class="features-grid grid-2">
				<div class="feature-card ai-card">
					<div class="feature-icon accent">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
						</svg>
					</div>
					<h3>Voice-to-Task (Field Reports)</h3>
					<p>Record voice notes after showings or inspections. AI transcribes your words and extracts action items with priorities. Review and edit before adding to your transaction. Full transcript stays linked for complete context.</p>
				</div>
				<div class="feature-card ai-card">
					<div class="feature-icon amber">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
						</svg>
					</div>
					<h3>Quick Add</h3>
					<p>Capture ideas instantly from your dashboard. Record a voice memo or type a note, then assign to any active transaction or save to your document library. No context switching needed.</p>
				</div>
			</div>
		</section>

		<!-- Complete Transaction Platform -->
		<section class="features-section">
			<h2 class="section-title">Complete Transaction Platform</h2>
			<p class="section-sub">Everything you need to manage documents from listing to closing.</p>

			<div class="features-grid">
				<div class="feature-card">
					<div class="feature-icon green">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
						</svg>
					</div>
					<h3>Transaction Management</h3>
					<p>Create and track deals with checklists, milestones, partners, and status workflows. Move transactions from Draft to Completed with full visibility at every stage.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon blue">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
						</svg>
					</div>
					<h3>Document Collection</h3>
					<p>Secure client portal for uploading, reviewing, and approving documents. Clients get a magic link — no login required. Drag-and-drop on desktop, camera on mobile.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon purple">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
						</svg>
					</div>
					<h3>Templates</h3>
					<p>Pre-built templates for pre-approval, purchase, refinance, and seller packages. Create custom templates for your specific workflows.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon amber">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
					<h3>Client Portal</h3>
					<p>Branded, mobile-friendly portal where clients upload documents, answer questions, and sign electronically. Progress tracker shows them exactly what remains.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon pink">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
						</svg>
					</div>
					<h3>E-Signatures</h3>
					<p>Built-in signature collection for disclosures, agreements, and closing docs. Clients draw or type their signature directly in the portal.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon red">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
						</svg>
					</div>
					<h3>Milestones & Key Dates</h3>
					<p>Track inspection, appraisal, financing contingency, and closing dates. Check off completed milestones and keep every party on the same page.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon green">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
						</svg>
					</div>
					<h3>Pipeline & Reports</h3>
					<p>Pipeline funnel, commission tracking, completion metrics, and activity trends. Filter by date range and export all data to CSV.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon purple">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
						</svg>
					</div>
					<h3>Team Management</h3>
					<p>Invite team members by email and assign roles — owner, admin, or member. Manage workspace access with role-based permissions.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon blue">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
						</svg>
					</div>
					<h3>Webhooks & API</h3>
					<p>Connect CollectRelay to your CRM, LOS, or other tools with REST API and real-time webhooks. Automate your transaction workflows.</p>
				</div>
			</div>
		</section>

		<section class="how-it-works" id="how-it-works">
			<h2 class="section-title">Three Steps. Zero Email Chains.</h2>
			<div class="steps-grid">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Send a Link</h3>
					<p>Create a transaction checklist and send your client a secure magic link. No accounts needed — they just click and start uploading.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>They Upload</h3>
					<p>Your client uploads pay stubs, bank statements, signs disclosures — all from their phone or desktop. Automatic reminders if they forget.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>You Stay Organized</h3>
					<p>Every document lands in your dashboard, organized by transaction. Review, approve, or request resubmissions with a single click.</p>
				</div>
			</div>
		</section>

		<section class="cta-section">
			<h2>Ready to Streamline Your Transactions?</h2>
			<p>Join real estate professionals who stopped chasing paperwork and started closing faster.</p>
			<div class="cta-actions">
				<a href="/register" class="btn-primary">Get started free</a>
				<a href="/" class="btn-outline">Back to home</a>
			</div>
		</section>
	</div>
</main>

<Footer />

<style>
	.industry-page {
		padding-top: calc(80px + var(--space-4xl));
		padding-bottom: var(--section-gap);
	}

	/* Hero */
	.hero-section {
		text-align: center;
		margin-bottom: var(--space-5xl);
	}

	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-md);
		background-color: rgba(74, 122, 245, 0.12);
		color: #4a7af5;
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-lg);
	}

	h1 {
		font-size: clamp(var(--font-size-xxl), 4.5vw, var(--font-size-5xl));
		font-weight: 800;
		letter-spacing: -0.03em;
		line-height: 1.1;
		margin-bottom: var(--space-xl);
		background: linear-gradient(135deg, var(--text-primary) 0%, var(--color-accent-hover) 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}

	.lead {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		line-height: 1.7;
		max-width: 640px;
		margin: 0 auto var(--space-xxl);
	}

	.hero-actions {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-lg);
		flex-wrap: wrap;
	}

	/* Sections */
	.features-section {
		margin-bottom: var(--space-5xl);
	}

	.section-title {
		font-size: clamp(var(--font-size-xl), 3vw, var(--font-size-3xl));
		font-weight: 700;
		text-align: center;
		letter-spacing: -0.02em;
		margin-bottom: var(--space-md);
	}

	.section-sub {
		text-align: center;
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		max-width: 600px;
		margin: 0 auto var(--space-3xl);
	}

	/* Feature Grid */
	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-xl);
	}

	.features-grid.grid-2 {
		grid-template-columns: repeat(2, 1fr);
	}

	.feature-card {
		padding: var(--space-xl);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		transition: border-color var(--transition-fast), transform var(--transition-fast);
	}

	.feature-card:hover {
		border-color: var(--border-color-light);
		transform: translateY(-2px);
	}

	.feature-card.ai-card {
		border-color: rgba(74, 122, 245, 0.2);
		background: linear-gradient(135deg, rgba(74, 122, 245, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%);
	}

	.feature-card.ai-card:hover {
		border-color: rgba(74, 122, 245, 0.4);
	}

	.feature-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		margin-bottom: var(--space-lg);
	}

	.feature-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
	.feature-icon.blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
	.feature-icon.purple { background: rgba(168, 85, 247, 0.1); color: #a855f7; }
	.feature-icon.amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
	.feature-icon.pink { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
	.feature-icon.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
	.feature-icon.accent { background: rgba(74, 122, 245, 0.12); color: #4a7af5; }

	.feature-card h3 {
		font-size: var(--font-size-md);
		font-weight: 600;
		margin-bottom: var(--space-sm);
	}

	.feature-card p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.7;
	}

	/* AI Badge */
	.ai-badge-wrap {
		text-align: center;
		margin-bottom: var(--space-lg);
	}

	.ai-badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-md);
		background: rgba(74, 122, 245, 0.15);
		color: #4a7af5;
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-full);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	/* How it works */
	.how-it-works {
		margin-bottom: var(--space-5xl);
	}

	.steps-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-xl);
	}

	.step {
		text-align: center;
		padding: var(--space-xl);
	}

	.step-number {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-accent);
		color: white;
		font-weight: 700;
		font-size: var(--font-size-md);
		border-radius: var(--radius-full);
		margin: 0 auto var(--space-lg);
	}

	.step h3 {
		font-size: var(--font-size-md);
		font-weight: 600;
		margin-bottom: var(--space-sm);
	}

	.step p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.6;
	}

	/* CTA */
	.cta-section {
		text-align: center;
	}

	.cta-section h2 {
		font-size: clamp(var(--font-size-xl), 3vw, var(--font-size-3xl));
		font-weight: 700;
		margin-bottom: var(--space-md);
	}

	.cta-section p {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		margin-bottom: var(--space-xxl);
	}

	.cta-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
	}

	/* Buttons */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xxl);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-lg);
		font-weight: 600;
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
		box-shadow: var(--shadow-glow);
	}

	.btn-primary:hover {
		background: var(--color-accent-hover);
		color: var(--text-inverse);
		transform: translateY(-1px);
	}

	.btn-secondary, .btn-outline {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xxl);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		font-weight: 500;
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
	}

	.btn-secondary:hover, .btn-outline:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	@media (max-width: 768px) {
		.features-grid, .features-grid.grid-2, .steps-grid { grid-template-columns: 1fr; }
	}
</style>
