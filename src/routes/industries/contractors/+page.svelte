<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>CollectRelay for Construction — Close Projects Faster</title>
	<meta name="description" content="Stop losing project time to paperwork. CollectRelay turns field chaos into organized submittals, change orders, and closeout docs — powered by AI." />
</svelte:head>

<Navbar />

<main class="industry-page">
	<div class="container">
		<section class="hero-section">
			<span class="badge">Construction</span>
			<h1>Stop Losing Project Time<br />to Paperwork</h1>
			<p class="lead">
				COIs, lien waivers, change orders, submittals — stop chasing subs and clients
				for documents. CollectRelay gives every project a single portal where everyone
				uploads what's needed, and AI keeps it organized.
			</p>
			<div class="hero-actions">
				<a href="/register" class="btn-primary">Get started free</a>
				<a href="#how-it-works" class="btn-secondary">See how it works</a>
			</div>
		</section>

		<section class="features-section">
			<h2 class="section-title">Built for the Field-to-Office Gap</h2>
			<p class="section-sub">From submittals to closeout, CollectRelay keeps every project document organized and on schedule.</p>

			<div class="features-grid">
				<div class="feature-card">
					<div class="feature-icon green">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
					<h3>Submittals & Compliance</h3>
					<p>Collect COIs, W-9s, workers' comp certs, and building permits from every sub before they step on site. Automated reminders chase them so you don't have to.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon blue">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
						</svg>
					</div>
					<h3>Change Orders & Lien Waivers</h3>
					<p>Get e-signatures on change orders and lien waivers without the paper chase. Milestone tracking keeps every project phase organized from permitting to final inspection.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon amber">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
						</svg>
					</div>
					<h3>Closeout Documentation</h3>
					<p>Warranties, as-builts, final inspections, punch lists — organize everything needed for project closeout in one place. Get paid faster with bulletproof documentation.</p>
				</div>
			</div>
		</section>

		<!-- AI-Powered Field Tools -->
		<section class="features-section">
			<div class="ai-badge-wrap"><span class="ai-badge">AI-Powered</span></div>
			<h2 class="section-title">Field Tools That Work as Hard as You Do</h2>
			<p class="section-sub">Voice memos from the field become structured task lists. Notes become action items. AI does the organizing.</p>

			<div class="features-grid grid-2">
				<div class="feature-card ai-card">
					<div class="feature-icon accent">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
						</svg>
					</div>
					<h3>Voice-to-Task (Field Reports)</h3>
					<p>Record voice memos from the job site. AI transcribes your words and extracts actionable tasks with priorities. Review and edit before adding to your project. Full transcript stays linked to each task for complete context.</p>
				</div>
				<div class="feature-card ai-card">
					<div class="feature-icon amber">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
						</svg>
					</div>
					<h3>Quick Add</h3>
					<p>Capture ideas instantly from your dashboard. Record a voice memo or type a note, then assign to any active project or save to your document library. No context switching — just capture and go.</p>
				</div>
			</div>
		</section>

		<!-- Complete Project Platform -->
		<section class="features-section">
			<h2 class="section-title">Complete Project Platform</h2>
			<p class="section-sub">Everything you need to manage project documentation from start to closeout.</p>

			<div class="features-grid">
				<div class="feature-card">
					<div class="feature-icon green">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
						</svg>
					</div>
					<h3>Project Management</h3>
					<p>Create and track projects with task checklists, milestones, and status workflows. Move projects from setup through active work to closeout with full visibility.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon blue">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
						</svg>
					</div>
					<h3>Document Collection</h3>
					<p>Secure portal where subs and clients upload via magic link — no account needed. Drag-and-drop on desktop, camera capture on mobile.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon purple">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
						</svg>
					</div>
					<h3>Templates</h3>
					<p>Pre-built templates for project setup, sub onboarding, and draw requests. Create custom templates for your specific workflows.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon amber">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
					<h3>Client Portal</h3>
					<p>Branded, mobile-friendly portal with progress tracking. Clients and subs see exactly what's needed and upload on their schedule.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon pink">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
						</svg>
					</div>
					<h3>E-Signatures</h3>
					<p>Collect signatures on change orders, lien waivers, and contracts directly in the portal. Signed copies stored automatically with timestamps.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon red">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
						</svg>
					</div>
					<h3>Milestones & Key Dates</h3>
					<p>Track permitting, inspections, substantial completion, and final closeout. Check off completed milestones and keep every stakeholder aligned.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon green">
						<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>
						</svg>
					</div>
					<h3>Pipeline & Reports</h3>
					<p>Pipeline funnel, project cost tracking, completion metrics, and activity trends. Export all data to CSV for external analysis.</p>
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
					<p>Connect CollectRelay to your existing tools with REST API and real-time webhooks. Automate workflows and integrate with project management platforms.</p>
				</div>
			</div>
		</section>

		<section class="how-it-works" id="how-it-works">
			<h2 class="section-title">Three Steps. Zero Chasing.</h2>
			<div class="steps-grid">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Send a Link</h3>
					<p>Create a project checklist and send your sub or client a secure link. No accounts needed — they just click and upload.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>They Upload</h3>
					<p>Your sub snaps a photo of their COI, uploads the lien waiver, signs the change order — all from their phone. Automatic reminders if they forget.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>You Stay Organized</h3>
					<p>Every document lands in your dashboard, organized by project and trade. AI flags missing items and keeps your audit trail clean.</p>
				</div>
			</div>
		</section>

		<section class="ai-section">
			<div class="ai-highlight-card">
				<div class="ai-badge">AI-Powered</div>
				<h2>Your Project Assistant That Never Sleeps</h2>
				<p>CollectRelay AI transcribes voice memos into structured tasks, summarizes documents, flags incomplete submissions, and auto-organizes files by trade and category.</p>
				<div class="ai-features">
					<div class="ai-feature">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
						<span>Voice-to-Task from the field</span>
					</div>
					<div class="ai-feature">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
						<span>Smart task extraction with priorities</span>
					</div>
					<div class="ai-feature">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
						<span>Auto-categorize uploaded docs</span>
					</div>
					<div class="ai-feature">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
						<span>Flag missing or expired items</span>
					</div>
				</div>
			</div>
		</section>

		<section class="cta-section">
			<h2>Ready to Close Projects Faster?</h2>
			<p>Join contractors who stopped chasing paperwork and started getting paid on time.</p>
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
		background-color: rgba(16, 185, 129, 0.12);
		color: #10b981;
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

	/* AI Section */
	.ai-section {
		margin-bottom: var(--space-5xl);
	}

	.ai-highlight-card {
		background: linear-gradient(135deg, rgba(74, 122, 245, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%);
		border: 1px solid rgba(74, 122, 245, 0.2);
		border-radius: var(--radius-xl);
		padding: var(--space-3xl);
		text-align: center;
	}

	.ai-badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-md);
		background: rgba(74, 122, 245, 0.15);
		color: #4a7af5;
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-lg);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.ai-highlight-card h2 {
		font-size: clamp(var(--font-size-lg), 2.5vw, var(--font-size-xxl));
		font-weight: 700;
		margin-bottom: var(--space-md);
	}

	.ai-highlight-card > p {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		line-height: 1.7;
		max-width: 600px;
		margin: 0 auto var(--space-xl);
	}

	.ai-features {
		display: flex;
		justify-content: center;
		gap: var(--space-xl);
		flex-wrap: wrap;
	}

	.ai-feature {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: #10b981;
		font-size: var(--font-size-sm);
		font-weight: 500;
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
		.ai-features { flex-direction: column; align-items: center; }
	}
</style>
