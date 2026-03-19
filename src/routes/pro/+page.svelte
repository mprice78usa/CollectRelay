<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>CollectRelay Pro — AI-Powered Field Tools for Contractors</title>
	<meta name="description" content="Turn site photos and voice notes into professional project logs, punch lists, and change orders. CollectRelay Pro uses Multimodal AI to close the field-to-office gap." />
</svelte:head>

<Navbar />

<main class="pro-page">
	<div class="container">
		<!-- Hero -->
		<section class="hero-section">
			<div class="hero-content">
				<div class="hero-text">
					<span class="badge">CollectRelay Pro</span>
					<h1>Close the Gap Between<br />the Field and the Office</h1>
					<p class="lead">
						CollectRelay Pro uses Multimodal AI to turn site photos and voice notes into
						professional project logs, punch lists, and change orders — all from your phone.
					</p>
					<div class="hero-actions">
						<a href="/register" class="btn-primary">Start Free</a>
						<a href="/pricing" class="btn-secondary">View Pricing</a>
					</div>
				</div>
				<div class="hero-phone">
					<div class="phone-frame">
						<video autoplay loop muted playsinline class="phone-video">
							<source src="/images/screenshots/pro-photo-mobile.mp4" type="video/mp4" />
						</video>
					</div>
					<span class="phone-caption">AI photo capture in action</span>
				</div>
			</div>
		</section>

		<!-- How It Works — The AI Relay -->
		<section class="how-it-works" id="how-it-works">
			<h2 class="section-title">How It Works — The AI Relay</h2>
			<p class="section-sub">Three steps from field chaos to organized documentation.</p>

			<div class="steps-grid">
				<div class="step">
					<div class="step-number">1</div>
					<h3>Capture the Chaos</h3>
					<p>Record a voice memo or snap site photos while you walk the job. No forms, no typing — just talk and shoot.</p>
				</div>
				<div class="step">
					<div class="step-number">2</div>
					<h3>AI Orchestration</h3>
					<p>Our Relay Assistant listens to your audio, sees your photos, and extracts tasks, flags issues, and assigns priorities.</p>
				</div>
				<div class="step">
					<div class="step-number">3</div>
					<h3>Instant Documentation</h3>
					<p>One tap to relay AI-extracted insights to your project checklist, client portal, or daily log. Done.</p>
				</div>
			</div>
			<div class="step-result">
				<div class="browser-frame compact">
					<div class="browser-titlebar">
						<div class="browser-dots">
							<span class="dot red"></span>
							<span class="dot yellow"></span>
							<span class="dot green"></span>
						</div>
						<div class="browser-address">collectrelay.com/app/projects</div>
					</div>
					<img src="/images/screenshots/project-detail.png" alt="Project checklist showing accepted, pending, and submitted document items" class="browser-screenshot" loading="lazy" />
				</div>
				<span class="result-caption">Every note, photo, and task lands in the right project automatically.</span>
			</div>
		</section>

		<!-- Field-to-Dashboard -->
		<section class="comparison-section">
			<h2 class="section-title">Field-to-Dashboard in Seconds</h2>
			<p class="section-sub">Messy field input goes in. Clean, actionable documentation comes out.</p>

			<div class="comparison-grid">
				<div class="comparison-card">
					<div class="comparison-from">
						<span class="comparison-label">Field Input</span>
						<p>"Hey, the framing on the south wall is bowed — gonna need the crew back to fix it before drywall."</p>
					</div>
					<div class="comparison-arrow">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
					</div>
					<div class="comparison-to">
						<span class="comparison-label">Relay Output</span>
						<p><strong>Task:</strong> Reframe south wall before drywall<br /><strong>Priority:</strong> High<br /><strong>Trade:</strong> Framing</p>
					</div>
				</div>
				<div class="comparison-card">
					<div class="comparison-from">
						<span class="comparison-label">Field Input</span>
						<p>A grainy phone photo of water staining on ceiling tiles</p>
					</div>
					<div class="comparison-arrow">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
					</div>
					<div class="comparison-to">
						<span class="comparison-label">Relay Output</span>
						<p><strong>Issue:</strong> Water intrusion — ceiling tiles show active staining<br /><strong>Priority:</strong> High<br /><strong>Action:</strong> Inspect roof/HVAC for source</p>
					</div>
				</div>
				<div class="comparison-card">
					<div class="comparison-from">
						<span class="comparison-label">Field Input</span>
						<p>Handwritten notes on the back of a blueprint</p>
					</div>
					<div class="comparison-arrow">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
					</div>
					<div class="comparison-to">
						<span class="comparison-label">Relay Output</span>
						<p><strong>Document:</strong> PDF Site Observation Report with embedded photos, notes, and AI analysis per image</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Dashboard Preview -->
		<section class="dashboard-preview">
			<h2 class="section-title">Your Command Center</h2>
			<p class="section-sub">Every project, every document, every deadline — one dashboard.</p>
			<div class="browser-frame">
				<div class="browser-titlebar">
					<div class="browser-dots">
						<span class="dot red"></span>
						<span class="dot yellow"></span>
						<span class="dot green"></span>
					</div>
					<div class="browser-address">collectrelay.com/app</div>
				</div>
				<img src="/images/screenshots/dashboard-overview.png" alt="CollectRelay dashboard showing active projects, pipeline value, and recent activity" class="browser-screenshot" loading="lazy" />
			</div>
		</section>

		<!-- Core Pro Features -->
		<section class="features-section">
			<h2 class="section-title">The Pro Toolkit</h2>
			<p class="section-sub">Five AI-powered capabilities designed for the way contractors actually work.</p>

			<div class="features-grid">
				<div class="feature-card ai-card">
					<div class="feature-icon accent">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
						</svg>
					</div>
					<h3>AI Field Intelligence</h3>
					<p>Speak naturally while walking the job. AI transcribes your words and extracts tasks with priorities and trade assignments — ready to relay to your project in one tap.</p>
				</div>
				<div class="feature-card ai-card">
					<div class="feature-icon accent">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
						</svg>
					</div>
					<h3>AI Safety Scout</h3>
					<p>An extra pair of eyes on every photo. CollectRelay Pro flags potential OSHA violations and safety hazards before they become incidents — from missing hard hats to unsecured ladders.</p>
				</div>
				<div class="feature-card ai-card">
					<div class="feature-icon accent">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
						</svg>
					</div>
					<h3>One-Click Daily Logs</h3>
					<p>Stop spending 45 minutes every evening typing up what happened on-site. One tap compiles all your photos and voice notes into a branded PDF Daily Report — ready to send while you drive home.</p>
				</div>
				<div class="feature-card ai-card">
					<div class="feature-icon accent">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/>
						</svg>
					</div>
					<h3>Smart Trade Routing</h3>
					<p>When AI identifies a plumbing issue from your voice note, it doesn't just add it to a list — it prepares the message and photo snippet to relay directly to your plumber. Don't just track issues. Relay them.</p>
				</div>
				<div class="feature-card ai-card">
					<div class="feature-icon accent">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="1" y1="1" x2="23" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0119 12.55"/><path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M10.71 5.05A16 16 0 0122.56 9"/><path d="M1.42 9a15.91 15.91 0 014.7-2.88"/><path d="M8.53 16.11a6 6 0 016.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
						</svg>
					</div>
					<h3>Resilient Field Sync</h3>
					<p>Built for the basement. Record your notes and snap photos anywhere — even with zero signal. CollectRelay queues everything locally and auto-syncs the second you're back in range.</p>
				</div>
			</div>
		</section>

		<!-- Pro Package Summary -->
		<section class="pro-summary-strip">
			<div class="summary-items">
				<div class="summary-item">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/>
					</svg>
					<span>AI Field Intelligence</span>
				</div>
				<div class="summary-divider"></div>
				<div class="summary-item">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
					</svg>
					<span>Auto-Generated PDF Reports</span>
				</div>
				<div class="summary-divider"></div>
				<div class="summary-item">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 009 9"/>
					</svg>
					<span>Custom Trade Routing</span>
				</div>
				<div class="summary-divider"></div>
				<div class="summary-item">
					<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M5 12.55a10.94 10.94 0 015.17-2.39"/><path d="M12 20l.01 0"/><path d="M8.53 16.11a6 6 0 016.95 0"/>
					</svg>
					<span>Resilient Offline Sync</span>
				</div>
			</div>
		</section>

		<!-- Platform Features -->
		<section class="features-section">
			<h2 class="section-title">Complete Project Platform</h2>
			<p class="section-sub">Everything else you need to collect, organize, and close out project docs.</p>

			<div class="features-grid">
				<div class="feature-card">
					<div class="feature-icon green">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>
						</svg>
					</div>
					<h3>Smart Checklists</h3>
					<p>Custom checklists for every project type — from permitting to closeout. Required items, due dates, and real-time completion tracking.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon blue">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
						</svg>
					</div>
					<h3>Project Templates</h3>
					<p>Reusable templates for residential, commercial, renovation, and custom project types. Clone a checklist in seconds.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon purple">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
						</svg>
					</div>
					<h3>Built-in E-Signatures</h3>
					<p>Send change orders, lien waivers, and approvals for signature. Signed copies land back in the project automatically.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon amber">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
						</svg>
					</div>
					<h3>Team & Partner Access</h3>
					<p>Invite project managers, subs, and inspectors with role-based permissions. Everyone sees their slice of the project.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon pink">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
						</svg>
					</div>
					<h3>Client-Friendly Uploads</h3>
					<p>Drag-and-drop on desktop, camera-to-PDF on mobile. Clients upload docs without ever creating an account.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon green">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
						</svg>
					</div>
					<h3>Automated Reminders</h3>
					<p>Stop chasing subs for documents. Configurable email and push reminders go out automatically until items are submitted.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon blue">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
						</svg>
					</div>
					<h3>Audit Trail</h3>
					<p>Every upload, request, approval, and reminder is recorded with timestamps. Complete accountability on every project.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon purple">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
						</svg>
					</div>
					<h3>Reports & Analytics</h3>
					<p>Pipeline overview, completion rates, and activity trends. Know which projects need attention at a glance.</p>
				</div>
				<div class="feature-card">
					<div class="feature-icon red">
						<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
						</svg>
					</div>
					<h3>Zapier & API</h3>
					<p>Connect CollectRelay to your CRM, accounting software, or project management tools with webhooks and a REST API.</p>
				</div>
			</div>
		</section>

		<!-- Activity Trail -->
		<section class="activity-preview">
			<div class="activity-layout">
				<div class="activity-text">
					<h2>Full Audit Trail.<br />Zero Guesswork.</h2>
					<p>Every upload, review, reminder, and status change is recorded with timestamps. Know exactly who did what and when — across every project.</p>
					<a href="/features" class="btn-outline-sm">See all features →</a>
				</div>
				<div class="browser-frame compact">
					<div class="browser-titlebar">
						<div class="browser-dots">
							<span class="dot red"></span>
							<span class="dot yellow"></span>
							<span class="dot green"></span>
						</div>
						<div class="browser-address">collectrelay.com/app/activity</div>
					</div>
					<img src="/images/screenshots/activity-feed.png" alt="Activity feed showing file uploads, reviews, and status changes across projects" class="browser-screenshot" loading="lazy" />
				</div>
			</div>
		</section>

		<!-- CTA -->
		<section class="cta-section">
			<h2>Ready to Close the Field-to-Office Gap?</h2>
			<p>Start free — no credit card required. Upgrade when you're ready.</p>
			<div class="cta-actions">
				<a href="/register" class="btn-primary">Get started free</a>
				<a href="/pricing" class="btn-outline">View Pricing</a>
			</div>
		</section>
	</div>
</main>

<Footer />

<style>
	.pro-page {
		padding-top: var(--space-5xl);
		padding-bottom: var(--space-5xl);
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 var(--space-lg);
	}

	/* Hero */
	.hero-section {
		margin-bottom: var(--space-5xl);
		padding-top: var(--space-3xl);
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

	.hero-phone {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
	}

	.phone-frame {
		width: 260px;
		height: 530px;
		background: #1a1a2e;
		border-radius: 38px;
		padding: 11px;
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
		border-radius: 27px;
	}

	.phone-caption {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		font-weight: 500;
	}

	.badge {
		display: inline-block;
		padding: var(--space-xs) var(--space-md);
		background: linear-gradient(135deg, rgba(74, 122, 245, 0.15), rgba(16, 185, 129, 0.15));
		color: #4a7af5;
		font-size: var(--font-size-xs);
		font-weight: 700;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-xl);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	h1 {
		font-size: clamp(var(--font-size-3xl), 5vw, 3.2rem);
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.03em;
		margin-bottom: var(--space-xl);
	}

	.lead {
		font-size: var(--font-size-lg);
		color: var(--text-secondary);
		line-height: 1.7;
		max-width: 540px;
		margin-bottom: var(--space-xxl);
	}

	.hero-actions {
		display: flex;
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	/* Section Titles */
	.section-title {
		font-size: clamp(var(--font-size-xl), 3vw, var(--font-size-xxl));
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

	/* How It Works */
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

	/* Comparison */
	.comparison-section {
		margin-bottom: var(--space-5xl);
	}

	.comparison-grid {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.comparison-card {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
	}

	.comparison-from, .comparison-to {
		flex: 1;
	}

	.comparison-label {
		display: inline-block;
		font-size: var(--font-size-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-sm);
		color: var(--text-muted);
	}

	.comparison-from p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.6;
		font-style: italic;
	}

	.comparison-to p {
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		line-height: 1.7;
	}

	.comparison-arrow {
		flex-shrink: 0;
		color: var(--color-accent);
	}

	/* Features Grid */
	.features-section {
		margin-bottom: var(--space-5xl);
	}

	.features-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-xl);
	}

	/* Pro Summary Strip */
	.pro-summary-strip {
		margin-bottom: var(--space-5xl);
		padding: var(--space-xl) var(--space-xxl);
		background: linear-gradient(135deg, rgba(74, 122, 245, 0.06) 0%, rgba(16, 185, 129, 0.06) 100%);
		border-top: 1px solid rgba(74, 122, 245, 0.15);
		border-bottom: 1px solid rgba(74, 122, 245, 0.15);
		border-radius: var(--radius-lg);
	}

	.summary-items {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xl);
		flex-wrap: wrap;
	}

	.summary-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	.summary-item svg {
		color: var(--color-accent);
		flex-shrink: 0;
	}

	.summary-divider {
		width: 1px;
		height: 20px;
		background: var(--border-color);
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

	/* Dashboard Preview */
	.dashboard-preview {
		margin-bottom: var(--space-5xl);
	}

	/* Browser Frame */
	.browser-frame {
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow:
			0 20px 60px rgba(0, 0, 0, 0.4),
			0 0 40px rgba(74, 122, 245, 0.06);
		max-width: 960px;
		margin: 0 auto;
	}

	.browser-frame.compact {
		max-width: 800px;
	}

	.browser-titlebar {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: 10px 16px;
		background: #1a1a2e;
		border-bottom: 1px solid rgba(255, 255, 255, 0.06);
	}

	.browser-dots {
		display: flex;
		gap: 6px;
	}

	.browser-dots .dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.browser-dots .dot.red { background: #ff5f57; }
	.browser-dots .dot.yellow { background: #ffbd2e; }
	.browser-dots .dot.green { background: #28c840; }

	.browser-address {
		flex: 1;
		text-align: center;
		font-size: 11px;
		color: var(--text-muted);
		background: rgba(255, 255, 255, 0.04);
		padding: 4px 12px;
		border-radius: 4px;
	}

	.browser-screenshot {
		width: 100%;
		display: block;
	}

	/* Step Result */
	.step-result {
		margin-top: var(--space-3xl);
		text-align: center;
	}

	.result-caption {
		display: block;
		margin-top: var(--space-lg);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		font-weight: 500;
	}

	/* Activity Preview */
	.activity-preview {
		margin-bottom: var(--space-5xl);
	}

	.activity-layout {
		display: flex;
		align-items: center;
		gap: var(--space-4xl);
	}

	.activity-text {
		flex: 0 0 320px;
	}

	.activity-text h2 {
		font-size: clamp(var(--font-size-xl), 3vw, var(--font-size-xxl));
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: var(--space-lg);
	}

	.activity-text p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.7;
		margin-bottom: var(--space-xl);
	}

	.btn-outline-sm {
		display: inline-flex;
		align-items: center;
		padding: var(--space-sm) var(--space-lg);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
	}

	.btn-outline-sm:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
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
		.hero-content { flex-direction: column; text-align: center; }
		.hero-text { text-align: center; }
		.lead { margin-left: auto; margin-right: auto; }
		.hero-actions { justify-content: center; }
		.phone-frame { width: 210px; height: 430px; border-radius: 32px; padding: 9px; }
		.phone-video { border-radius: 23px; }
		.features-grid, .steps-grid { grid-template-columns: 1fr; }
		.comparison-card { flex-direction: column; text-align: center; }
		.comparison-arrow { transform: rotate(90deg); }
		.cta-actions, .hero-actions { flex-direction: column; align-items: center; }
		.summary-items { flex-direction: column; gap: var(--space-md); }
		.summary-divider { display: none; }
		.activity-layout { flex-direction: column; text-align: center; }
		.activity-text { flex: none; }
	}
</style>
