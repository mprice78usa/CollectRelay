<script lang="ts">
	import Navbar from '$components/marketing/Navbar.svelte';
	import Footer from '$components/marketing/Footer.svelte';
</script>

<svelte:head>
	<title>Security — CollectRelay</title>
	<meta name="description" content="How CollectRelay protects your sensitive documents with encryption, access controls, and layered security infrastructure." />
</svelte:head>

<Navbar />

<main class="security-page">
	<div class="container">
		<div class="hero-section">
			<span class="badge">Security</span>
			<h1>Your documents deserve serious protection</h1>
			<p class="lead">
				CollectRelay handles sensitive financial and legal documents every day. We built security
				into every layer — not as an afterthought, but as a foundation.
			</p>
		</div>

		<!-- Encryption -->
		<section class="security-section">
			<div class="section-header">
				<div class="section-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
					</svg>
				</div>
				<h2>Encryption everywhere</h2>
			</div>
			<div class="section-body">
				<div class="detail-grid">
					<div class="detail-item">
						<h3>In transit</h3>
						<p>All connections use TLS 1.3 encryption. Every page, every API call, every file upload is encrypted between your browser and our servers. HSTS is enforced to prevent downgrade attacks.</p>
					</div>
					<div class="detail-item">
						<h3>At rest</h3>
						<p>Uploaded documents are stored in Cloudflare R2 with server-side encryption. Files are encrypted on disk and are never stored unencrypted at any point in the pipeline.</p>
					</div>
					<div class="detail-item">
						<h3>Secure file URLs</h3>
						<p>Document download links are signed with time-limited tokens. They expire automatically, so even if a link is shared accidentally, it stops working.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Access Controls -->
		<section class="security-section">
			<div class="section-header">
				<div class="section-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
					</svg>
				</div>
				<h2>Access controls</h2>
			</div>
			<div class="section-body">
				<div class="detail-grid">
					<div class="detail-item">
						<h3>Role-based access</h3>
						<p>Professionals and clients have completely separate access levels. Clients can only see and interact with their own transaction — never another client's documents.</p>
					</div>
					<div class="detail-item">
						<h3>Magic link authentication</h3>
						<p>Clients access their portal through unique, expiring magic links — no passwords to forget or reuse. Each link is tied to a specific transaction and email address.</p>
					</div>
					<div class="detail-item">
						<h3>Session management</h3>
						<p>Pro sessions are managed via secure, HTTP-only cookies with strict same-site policies. Sessions expire automatically and can be terminated at any time.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Infrastructure -->
		<section class="security-section">
			<div class="section-header">
				<div class="section-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
					</svg>
				</div>
				<h2>Infrastructure security</h2>
			</div>
			<div class="section-body">
				<p class="section-intro">
					CollectRelay runs entirely on Cloudflare's global network. Our infrastructure provider maintains the following certifications:
				</p>
				<div class="cert-grid">
					<div class="cert-item">
						<div class="cert-badge">SOC 2</div>
						<span>Type II</span>
					</div>
					<div class="cert-item">
						<div class="cert-badge">ISO</div>
						<span>27001</span>
					</div>
					<div class="cert-item">
						<div class="cert-badge">PCI</div>
						<span>DSS Level 1</span>
					</div>
					<div class="cert-item">
						<div class="cert-badge">SOC</div>
						<span>3</span>
					</div>
				</div>
				<p class="cert-note">
					These certifications are held by Cloudflare and cover the infrastructure CollectRelay runs on. They provide assurance that the underlying platform meets rigorous security and operational standards.
				</p>
				<div class="detail-grid">
					<div class="detail-item">
						<h3>DDoS protection</h3>
						<p>Cloudflare's global network automatically mitigates distributed denial-of-service attacks before they reach our application.</p>
					</div>
					<div class="detail-item">
						<h3>Web Application Firewall</h3>
						<p>A managed WAF inspects all incoming requests and blocks common attack patterns including SQL injection, XSS, and request forgery.</p>
					</div>
					<div class="detail-item">
						<h3>Global edge network</h3>
						<p>Content and application logic runs at the edge across 300+ data centers, reducing latency and providing built-in redundancy.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Application Security -->
		<section class="security-section">
			<div class="section-header">
				<div class="section-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
					</svg>
				</div>
				<h2>Application security</h2>
			</div>
			<div class="section-body">
				<div class="detail-grid">
					<div class="detail-item">
						<h3>Input sanitization</h3>
						<p>All user input is validated and sanitized server-side. We use parameterized queries to prevent injection attacks and strip potentially malicious content from uploads.</p>
					</div>
					<div class="detail-item">
						<h3>Content Security Policy</h3>
						<p>Strict CSP headers prevent cross-site scripting by controlling which scripts, styles, and resources can be loaded on each page.</p>
					</div>
					<div class="detail-item">
						<h3>Rate limiting</h3>
						<p>API endpoints are rate-limited to prevent abuse. Authentication endpoints have stricter limits to mitigate brute-force attempts.</p>
					</div>
					<div class="detail-item">
						<h3>File type validation</h3>
						<p>Uploaded files are validated by type and size. We check actual file content, not just extensions, to prevent disguised malicious files.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Audit & Monitoring -->
		<section class="security-section">
			<div class="section-header">
				<div class="section-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
					</svg>
				</div>
				<h2>Audit trail & monitoring</h2>
			</div>
			<div class="section-body">
				<div class="detail-grid">
					<div class="detail-item">
						<h3>Complete audit log</h3>
						<p>Every document upload, download, comment, review, and status change is logged with a timestamp and actor. You always know who did what and when.</p>
					</div>
					<div class="detail-item">
						<h3>Activity notifications</h3>
						<p>Real-time in-app and optional desktop notifications alert you when clients upload documents or when your agent reviews items — so nothing falls through the cracks.</p>
					</div>
					<div class="detail-item">
						<h3>Transaction history</h3>
						<p>A full timeline of every action is available on each transaction. This creates an auditable record for compliance and dispute resolution.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Privacy & Compliance -->
		<section class="security-section">
			<div class="section-header">
				<div class="section-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
					</svg>
				</div>
				<h2>Privacy & compliance</h2>
			</div>
			<div class="section-body">
				<div class="detail-grid">
					<div class="detail-item">
						<h3>Data minimization</h3>
						<p>We collect only what's necessary to operate the service. We don't sell user data, don't run ads, and don't share documents with third parties.</p>
					</div>
					<div class="detail-item">
						<h3>CCPA ready</h3>
						<p>California residents can request access to, deletion of, or information about their personal data. We honor all CCPA data subject requests.</p>
					</div>
					<div class="detail-item">
						<h3>GLBA aware</h3>
						<p>Many of our customers — accountants, mortgage brokers, financial advisors — are subject to the Gramm-Leach-Bliley Act. Our security controls are designed to help them meet their obligations.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Roadmap -->
		<section class="security-section roadmap-section">
			<div class="section-header">
				<div class="section-icon">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
					</svg>
				</div>
				<h2>Compliance roadmap</h2>
			</div>
			<div class="section-body">
				<p class="section-intro">
					We're committed to continuously raising the bar. Here's what's on our roadmap:
				</p>
				<div class="roadmap-grid">
					<div class="roadmap-item">
						<span class="roadmap-status planned">Planned</span>
						<h3>SOC 2 Type II (Application)</h3>
						<p>Pursuing our own SOC 2 Type II certification to provide customers with independent assurance of our security controls.</p>
					</div>
					<div class="roadmap-item">
						<span class="roadmap-status planned">Planned</span>
						<h3>GDPR compliance</h3>
						<p>Full GDPR compliance for customers with European clients, including data processing agreements and EU data residency options.</p>
					</div>
					<div class="roadmap-item">
						<span class="roadmap-status future">Future</span>
						<h3>Penetration testing</h3>
						<p>Engaging third-party security firms for regular penetration testing and publishing summary results.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- CTA -->
		<section class="security-cta">
			<h2>Questions about security?</h2>
			<p>We take security seriously and are happy to discuss our practices in detail.</p>
			<div class="cta-buttons">
				<a href="mailto:security@collectrelay.com" class="btn-primary">Contact security team</a>
				<a href="/register" class="btn-outline">Get started free</a>
			</div>
		</section>
	</div>
</main>

<Footer />

<style>
	.security-page {
		padding-top: calc(80px + var(--space-4xl));
		padding-bottom: var(--section-gap);
		min-height: 100vh;
	}

	.hero-section {
		margin-bottom: var(--space-4xl);
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
		font-size: clamp(var(--font-size-xxl), 4vw, var(--font-size-4xl));
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: var(--space-lg);
	}

	.lead {
		color: var(--text-secondary);
		font-size: var(--font-size-lg);
		line-height: 1.7;
		max-width: 640px;
	}

	/* Sections */
	.security-section {
		margin-bottom: var(--space-4xl);
		padding-bottom: var(--space-4xl);
		border-bottom: 1px solid var(--border-color);
	}

	.section-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.section-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background: rgba(16, 185, 129, 0.1);
		border-radius: var(--radius-lg);
		color: #10b981;
		flex-shrink: 0;
	}

	.section-header h2 {
		font-size: var(--font-size-xl);
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.section-intro {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		line-height: 1.6;
		margin-bottom: var(--space-xl);
		max-width: 640px;
	}

	.detail-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-xl);
	}

	.detail-item {
		padding: var(--space-xl);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
	}

	.detail-item h3 {
		font-size: var(--font-size-md);
		font-weight: 600;
		margin-bottom: var(--space-sm);
	}

	.detail-item p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.7;
	}

	/* Certifications */
	.cert-grid {
		display: flex;
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
		flex-wrap: wrap;
	}

	.cert-item {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid rgba(16, 185, 129, 0.2);
		border-radius: var(--radius-lg);
	}

	.cert-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 2px 8px;
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
		font-size: var(--font-size-xs);
		font-weight: 700;
		border-radius: var(--radius-sm);
		letter-spacing: 0.05em;
	}

	.cert-item span {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
	}

	.cert-note {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		line-height: 1.6;
		margin-bottom: var(--space-xl);
		font-style: italic;
	}

	/* Roadmap */
	.roadmap-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: var(--space-xl);
	}

	.roadmap-item {
		padding: var(--space-xl);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
	}

	.roadmap-status {
		display: inline-block;
		padding: 2px 10px;
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-full);
		margin-bottom: var(--space-sm);
	}

	.roadmap-status.planned {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
	}

	.roadmap-status.future {
		background: rgba(99, 102, 241, 0.15);
		color: #818cf8;
	}

	.roadmap-item h3 {
		font-size: var(--font-size-md);
		font-weight: 600;
		margin-bottom: var(--space-sm);
	}

	.roadmap-item p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.6;
	}

	/* CTA */
	.security-cta {
		text-align: center;
		padding: var(--space-4xl) 0;
	}

	.security-cta h2 {
		font-size: var(--font-size-xl);
		font-weight: 700;
		margin-bottom: var(--space-sm);
	}

	.security-cta p {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		margin-bottom: var(--space-xl);
	}

	.cta-buttons {
		display: flex;
		gap: var(--space-md);
		justify-content: center;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xl);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-md);
		font-weight: 600;
		border-radius: var(--radius-lg);
		transition: background var(--transition-fast);
	}

	.btn-primary:hover { background: var(--color-accent-hover); color: var(--text-inverse); }

	.btn-outline {
		display: inline-flex;
		align-items: center;
		padding: var(--space-md) var(--space-xl);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		font-weight: 500;
		border-radius: var(--radius-lg);
		transition: all var(--transition-fast);
	}

	.btn-outline:hover { background: var(--bg-secondary); color: var(--text-primary); }

	.roadmap-section {
		border-bottom: none;
	}

	@media (max-width: 768px) {
		.detail-grid, .roadmap-grid {
			grid-template-columns: 1fr;
		}

		.cert-grid {
			flex-direction: column;
		}
	}
</style>
