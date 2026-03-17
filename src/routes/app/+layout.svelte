<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { getTerms } from '$lib/terminology';
	import OfflineBanner from '$lib/components/ui/OfflineBanner.svelte';
	import { initOnlineListeners } from '$lib/offline/status.svelte';
	import { setupOnlineListener, registerBackgroundSync } from '$lib/offline/sync';

	let { data, children } = $props();

	let terms = $derived(getTerms(data.industry));

	onMount(() => {
		const cleanupOnline = initOnlineListeners();
		const cleanupSync = setupOnlineListener();
		registerBackgroundSync();
		return () => {
			cleanupOnline?.();
			cleanupSync();
		};
	});

	let navItems = $derived([
		{ href: '/app', label: 'Dashboard', exact: true, icon: 'dashboard' },
		{ href: '/app/transactions', label: terms.transactions, exact: false, icon: 'transactions' },
		{ href: '/app/notifications', label: 'Activity', exact: false, icon: 'activity' },
		{ href: '/app/templates', label: 'Templates', exact: false, icon: 'templates' },
		{ href: '/app/documents', label: 'Documents', exact: false, icon: 'documents' },
		{ href: '/app/reports', label: 'Reports', exact: false, icon: 'reports' },
		{ href: '/app/settings', label: 'Settings', exact: false, icon: 'settings' }
	]);

	function isActive(href: string, exact: boolean): boolean {
		if (exact) return page.url.pathname === href;
		return page.url.pathname.startsWith(href);
	}

	let billing = $derived(data.billing);
	let isAdmin = $derived(data.isAdmin);
	let totalUnseenCount = $derived(data.totalUnseenCount || 0);
	let unreadNotificationCount = $derived(data.unreadNotificationCount || 0);
	let isOnboarding = $derived(page.url.pathname.startsWith('/app/onboarding'));
</script>

<div class="app-shell" class:onboarding-mode={isOnboarding}>
	<aside class="sidebar">
		<div class="sidebar-header">
			<a href="/" class="logo">
				<svg viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
					<rect width="32" height="32" rx="6" fill="var(--bg-tertiary)"/>
					<path d="M8 10h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
					<path d="M8 16h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-hover)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
					<path d="M8 22h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-dim)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
				</svg>
				<span>CollectRelay</span>
			</a>
		</div>

		<nav class="sidebar-nav">
			{#each navItems as item}
				<a href={item.href} class="nav-item" class:active={isActive(item.href, item.exact)}>
					{#if item.icon === 'dashboard'}
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
						</svg>
					{:else if item.icon === 'transactions'}
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
						</svg>
					{:else if item.icon === 'activity'}
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
						</svg>
					{:else if item.icon === 'templates'}
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>
						</svg>
					{:else if item.icon === 'documents'}
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
						</svg>
					{:else if item.icon === 'reports'}
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
						</svg>
					{:else if item.icon === 'settings'}
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
						</svg>
					{/if}
					<span class="nav-label">{item.label}</span>
					{#if item.icon === 'transactions' && totalUnseenCount > 0}
						<span class="nav-badge">{totalUnseenCount}</span>
					{:else if item.icon === 'activity' && unreadNotificationCount > 0}
						<span class="nav-badge">{unreadNotificationCount}</span>
					{/if}
				</a>
			{/each}

			{#if isAdmin}
				<div class="nav-divider"></div>
				<a href="/app/admin" class="nav-item" class:active={isActive('/app/admin', false)}>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
					</svg>
					Admin
				</a>
			{/if}
		</nav>

		<div class="sidebar-footer">
			<form method="POST" action="/logout">
				<button type="submit" class="logout-btn">
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
					</svg>
					Log out
				</button>
			</form>
		</div>
	</aside>

	<main class="content">
		<OfflineBanner />
		{#if billing?.isTrialActive}
			<div class="trial-banner">
				<span>You have <strong>{billing.trialDaysLeft} day{billing.trialDaysLeft === 1 ? '' : 's'}</strong> left in your free trial.</span>
				<a href="/pricing" class="trial-cta">Choose a plan</a>
			</div>
		{:else if billing?.isTrialExpired}
			<div class="trial-banner expired">
				<span>Your free trial has ended.</span>
				<a href="/pricing" class="trial-cta">Subscribe now to continue</a>
			</div>
		{/if}
		{@render children()}
	</main>
</div>

<style>
	.app-shell {
		display: flex;
		min-height: 100vh;
	}

	.sidebar {
		width: var(--sidebar-width);
		background: var(--sidebar-bg);
		border-right: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		position: fixed;
		top: 0;
		left: 0;
		bottom: 0;
		z-index: var(--z-panel);
	}

	.sidebar-header {
		padding: var(--space-lg) var(--space-xl);
		border-bottom: 1px solid var(--border-color);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-primary);
		font-size: var(--font-size-md);
		font-weight: 700;
	}

	.logo:hover { color: var(--text-primary); }

	.sidebar-nav {
		flex: 1;
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
		border-right: 2px solid transparent;
	}

	.nav-item:hover {
		background: var(--sidebar-item-hover);
		color: var(--text-primary);
	}

	.nav-item.active {
		background: var(--sidebar-item-active-bg);
		color: var(--color-accent);
		border-right-color: var(--sidebar-item-active-border);
	}

	.nav-label {
		flex: 1;
	}

	.nav-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		background: #f59e0b;
		color: #fff;
		font-size: 11px;
		font-weight: 700;
		border-radius: 10px;
		line-height: 1;
	}

	.nav-divider {
		height: 1px;
		background: var(--border-color);
		margin: var(--space-sm) var(--space-md);
	}

	.sidebar-footer {
		padding: var(--space-md) var(--space-xl);
		border-top: 1px solid var(--border-color);
	}

	.logout-btn {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		padding: var(--space-sm) 0;
		transition: color var(--transition-fast);
	}

	.logout-btn:hover { color: var(--text-primary); }

	.content {
		flex: 1;
		margin-left: var(--sidebar-width);
		padding: var(--space-xxl);
		height: 100vh;
		overflow-y: auto;
	}

	/* Trial banner */
	.trial-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-lg);
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.2);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-xl);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.trial-banner.expired {
		background: rgba(245, 158, 11, 0.08);
		border-color: rgba(245, 158, 11, 0.25);
	}

	.trial-cta {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-accent);
		white-space: nowrap;
	}

	.trial-cta:hover {
		text-decoration: underline;
	}

	.trial-banner.expired .trial-cta {
		color: #f59e0b;
	}

	/* Hide sidebar during onboarding */
	.app-shell.onboarding-mode .sidebar { display: none; }
	.app-shell.onboarding-mode .content { margin-left: 0; max-width: 100%; padding: 0; }

	@media (max-width: 768px) {
		.sidebar { display: none; }
		.content { margin-left: 0; }
	}
</style>
