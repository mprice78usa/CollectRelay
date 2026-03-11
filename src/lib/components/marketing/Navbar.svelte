<script lang="ts">
	import { page } from '$app/state';

	let scrolled = $state(false);
	let mobileOpen = $state(false);
	let industriesOpen = $state(false);

	function handleScroll() {
		scrolled = window.scrollY > 20;
	}

	function sectionLink(hash: string) {
		return (e: MouseEvent) => {
			e.preventDefault();
			mobileOpen = false;
			if (page.url.pathname === '/') {
				// On homepage: smooth scroll to section
				document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
			} else {
				// On other pages: hard navigate to homepage + anchor
				window.location.href = '/#' + hash;
			}
		};
	}

	function closeAll() {
		mobileOpen = false;
		industriesOpen = false;
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.dropdown')) {
			industriesOpen = false;
		}
	}
</script>

<svelte:window onscroll={handleScroll} onclick={handleClickOutside} />

<nav class="navbar" class:scrolled>
	<div class="navbar-inner container">
		<a href="/" class="logo">
			<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
				<rect width="32" height="32" rx="6" fill="var(--bg-secondary)"/>
				<path d="M8 10h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
				<path d="M8 16h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-hover)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
				<path d="M8 22h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-dim)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
			</svg>
			<span>CollectRelay</span>
		</a>

		<div class="nav-links" class:open={mobileOpen}>
			<a href="/#how-it-works" onclick={sectionLink('how-it-works')}>How it works</a>
			<a href="/features" onclick={() => mobileOpen = false}>Features</a>

			<!-- Industries dropdown -->
			<div class="dropdown">
				<button
					class="dropdown-trigger"
					onclick={() => industriesOpen = !industriesOpen}
					aria-expanded={industriesOpen}
				>
					Industries
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron" class:rotated={industriesOpen}>
						<polyline points="6 9 12 15 18 9"/>
					</svg>
				</button>
				{#if industriesOpen}
					<div class="dropdown-menu">
						<a href="/industries/real-estate" onclick={closeAll}>
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
							</svg>
							Real Estate
						</a>
						<a href="/industries/contractors" onclick={closeAll}>
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
							</svg>
							Contractors
						</a>
						<a href="/industries/accountants" onclick={closeAll}>
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
							</svg>
							Accountants
						</a>
						<a href="/industries/hr" onclick={closeAll}>
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
							</svg>
							Human Resources
						</a>
					</div>
				{/if}
			</div>

			<a href="/security" onclick={() => mobileOpen = false}>Security</a>
			<a href="/pricing" onclick={() => mobileOpen = false}>Pricing</a>
		</div>

		<div class="nav-actions">
			<a href="/login" class="nav-link-login">Log in</a>
			<a href="/register" class="btn-primary-sm">Get started</a>
		</div>

		<button class="mobile-toggle" onclick={() => mobileOpen = !mobileOpen} aria-label="Toggle menu">
			<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
				{#if mobileOpen}
					<path d="M18 6L6 18M6 6l12 12"/>
				{:else}
					<path d="M3 12h18M3 6h18M3 18h18"/>
				{/if}
			</svg>
		</button>
	</div>
</nav>

<style>
	.navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		z-index: var(--z-sticky);
		padding: var(--space-lg) 0;
		transition: background-color var(--transition-normal), box-shadow var(--transition-normal);
	}

	.navbar.scrolled {
		background-color: rgba(10, 14, 23, 0.92);
		backdrop-filter: blur(12px);
		box-shadow: var(--shadow-md);
	}

	.navbar-inner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-xl);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-primary);
		font-size: var(--font-size-lg);
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.logo:hover {
		color: var(--text-primary);
	}

	.nav-links {
		display: flex;
		align-items: center;
		gap: var(--space-xxl);
	}

	.nav-links a, .dropdown-trigger {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		transition: color var(--transition-fast);
	}

	.nav-links a:hover, .dropdown-trigger:hover {
		color: var(--text-primary);
	}

	/* Dropdown */
	.dropdown {
		position: relative;
	}

	.dropdown-trigger {
		display: flex;
		align-items: center;
		gap: 4px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		font-family: inherit;
	}

	.chevron {
		transition: transform var(--transition-fast);
	}

	.chevron.rotated {
		transform: rotate(180deg);
	}

	.dropdown-menu {
		position: absolute;
		top: calc(100% + var(--space-md));
		left: 50%;
		transform: translateX(-50%);
		min-width: 200px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		padding: var(--space-sm);
		display: flex;
		flex-direction: column;
		animation: dropdown-in 0.15s ease-out;
	}

	@keyframes dropdown-in {
		from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
		to { opacity: 1; transform: translateX(-50%) translateY(0); }
	}

	.dropdown-menu a {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.dropdown-menu a:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.dropdown-menu a svg {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.dropdown-menu a:hover svg {
		color: var(--color-accent);
	}

	.nav-actions {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
	}

	.nav-link-login {
		color: var(--text-secondary);
		font-size: var(--font-size-md);
		transition: color var(--transition-fast);
	}

	.nav-link-login:hover {
		color: var(--text-primary);
	}

	.btn-primary-sm {
		display: inline-flex;
		align-items: center;
		padding: var(--space-sm) var(--space-lg);
		background-color: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-md);
		transition: background-color var(--transition-fast);
	}

	.btn-primary-sm:hover {
		background-color: var(--color-accent-hover);
		color: var(--text-inverse);
	}

	.mobile-toggle {
		display: none;
		background: none;
		border: none;
		color: var(--text-secondary);
		padding: var(--space-xs);
	}

	@media (max-width: 768px) {
		.nav-links {
			display: none;
			position: absolute;
			top: 100%;
			left: 0;
			right: 0;
			flex-direction: column;
			background-color: var(--bg-secondary);
			padding: var(--space-xl);
			gap: var(--space-lg);
			border-bottom: 1px solid var(--border-color);
		}

		.nav-links.open {
			display: flex;
		}

		.dropdown-menu {
			position: static;
			transform: none;
			box-shadow: none;
			border: none;
			background: var(--bg-tertiary);
			margin-top: var(--space-sm);
			animation: none;
		}

		@keyframes dropdown-in {
			from { opacity: 1; transform: none; }
			to { opacity: 1; transform: none; }
		}

		.nav-actions {
			display: none;
		}

		.mobile-toggle {
			display: block;
		}
	}
</style>
