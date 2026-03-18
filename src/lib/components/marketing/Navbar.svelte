<script lang="ts">
	import { page } from '$app/state';

	let scrolled = $state(false);
	let mobileOpen = $state(false);

	function handleScroll() {
		scrolled = window.scrollY > 20;
	}

	function sectionLink(hash: string) {
		return (e: MouseEvent) => {
			e.preventDefault();
			mobileOpen = false;
			if (page.url.pathname === '/') {
				document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' });
			} else {
				window.location.href = '/#' + hash;
			}
		};
	}
</script>

<svelte:window onscroll={handleScroll} />

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
			<a href="/industries/real-estate" onclick={() => mobileOpen = false}>Real Estate</a>
			<a href="/industries/contractors" onclick={() => mobileOpen = false}>Contractors</a>
			<a href="/pro" onclick={() => mobileOpen = false}>Pro</a>
			<a href="/security" onclick={() => mobileOpen = false}>Security</a>
			<a href="/pricing" onclick={() => mobileOpen = false}>Pricing</a>

			<div class="mobile-auth">
				<a href="/login" class="mobile-login" onclick={() => mobileOpen = false}>Log in</a>
				<a href="/register" class="mobile-cta" onclick={() => mobileOpen = false}>Get started free</a>
			</div>
		</div>

		<div class="nav-actions">
			<a href="/login" class="nav-link-login">Log in</a>
			<a href="/register" class="btn-primary-sm">Get started free</a>
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
		gap: var(--space-xl);
	}

	.nav-links a {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		transition: color var(--transition-fast);
		white-space: nowrap;
	}

	.nav-links a:hover {
		color: var(--text-primary);
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

	.mobile-auth {
		display: none;
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

		.nav-links a {
			font-size: var(--font-size-md);
		}

		.nav-actions {
			display: none;
		}

		.mobile-toggle {
			display: block;
		}

		.mobile-auth {
			display: flex;
			flex-direction: column;
			gap: var(--space-md);
			padding-top: var(--space-lg);
			border-top: 1px solid var(--border-color);
			margin-top: var(--space-sm);
		}

		.mobile-login {
			color: var(--text-secondary);
			font-size: var(--font-size-md);
			text-align: center;
			padding: var(--space-sm) 0;
		}

		.mobile-login:hover {
			color: var(--text-primary);
		}

		.mobile-cta {
			display: block;
			text-align: center;
			padding: var(--space-md) var(--space-lg);
			background-color: var(--color-accent);
			color: var(--text-inverse);
			font-size: var(--font-size-md);
			font-weight: 600;
			border-radius: var(--radius-md);
			transition: background-color var(--transition-fast);
		}

		.mobile-cta:hover {
			background-color: var(--color-accent-hover);
			color: var(--text-inverse);
		}
	}
</style>
