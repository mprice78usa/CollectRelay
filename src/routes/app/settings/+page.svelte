<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$components/ui/Card.svelte';
	import { requestNotificationPermission, getNotificationPermission } from '$lib/activity-poller';

	let { data, form } = $props();

	let savingProfile = $state(false);
	let savingWorkspace = $state(false);
	let profileSaved = $state(false);
	let workspaceSaved = $state(false);
	let loadingPortal = $state(false);
	let savingNotifs = $state(false);
	let notifsSaved = $state(false);
	let desktopNotifPermission = $state<string>('default');

	$effect(() => {
		if (typeof window !== 'undefined') {
			desktopNotifPermission = getNotificationPermission();
		}
	});

	async function toggleDesktopNotifications() {
		if (desktopNotifPermission === 'granted') {
			// Can't revoke via API — point user to browser settings
			alert('To disable desktop notifications, use your browser\'s site settings.');
			return;
		}
		const result = await requestNotificationPermission();
		desktopNotifPermission = result;
	}

	const planNames: Record<string, string> = {
		free: 'Free',
		single: 'Single User',
		team5: 'Team 5',
		team10: 'Team 10',
		team25: 'Team 25'
	};

	async function openBillingPortal() {
		loadingPortal = true;
		try {
			const res = await fetch('/api/stripe/portal', { method: 'POST' });
			if (res.ok) {
				const { url } = await res.json();
				window.location.href = url;
			} else {
				alert('Unable to open billing portal. Please try again.');
			}
		} catch {
			alert('Network error. Please try again.');
		} finally {
			loadingPortal = false;
		}
	}

	function showSavedBriefly(setter: (v: boolean) => void) {
		setter(true);
		setTimeout(() => setter(false), 2000);
	}
</script>

<svelte:head>
	<title>Settings — CollectRelay</title>
</svelte:head>

<div class="settings-page">
	<h1>Settings</h1>
	<p class="subtitle">Manage your account and workspace preferences.</p>

	<!-- Profile Section -->
	<section class="settings-section">
		<div class="section-header">
			<div class="section-icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
				</svg>
			</div>
			<div>
				<h2>Profile</h2>
				<p class="section-desc">Your personal information.</p>
			</div>
		</div>

		<Card>
			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					savingProfile = true;
					return async ({ update }) => {
						savingProfile = false;
						showSavedBriefly((v) => (profileSaved = v));
						await update();
					};
				}}
			>
				<div class="form-grid">
					<div class="form-group">
						<label for="profile-name">Full Name</label>
						<input type="text" id="profile-name" name="name" value={data.profile.name} required />
					</div>
					<div class="form-group">
						<label for="profile-email">Email Address</label>
						<input type="email" id="profile-email" value={data.profile.email} disabled />
						<span class="field-hint">Email cannot be changed.</span>
					</div>
					<div class="form-group">
						<label for="profile-company">Company <span class="optional">(optional)</span></label>
						<input type="text" id="profile-company" name="company" value={data.profile.company ?? ''} placeholder="Your company name" />
					</div>
					<div class="form-group">
						<label for="profile-phone">Phone <span class="optional">(optional)</span></label>
						<input type="tel" id="profile-phone" name="phone" value={data.profile.phone ?? ''} placeholder="555-000-0000" />
					</div>
				</div>

				{#if form?.error && form?.section !== 'workspace'}
					<p class="form-error">{form.error}</p>
				{/if}

				<div class="form-footer">
					{#if profileSaved}
						<span class="saved-indicator">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Saved
						</span>
					{/if}
					<button type="submit" class="btn-primary" disabled={savingProfile}>
						{savingProfile ? 'Saving...' : 'Save Profile'}
					</button>
				</div>
			</form>
		</Card>
	</section>

	<!-- Workspace Section -->
	<section class="settings-section">
		<div class="section-header">
			<div class="section-icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
				</svg>
			</div>
			<div>
				<h2>Workspace</h2>
				<p class="section-desc">Manage your workspace settings.</p>
			</div>
		</div>

		<Card>
			<form
				method="POST"
				action="?/updateWorkspace"
				use:enhance={() => {
					savingWorkspace = true;
					return async ({ update }) => {
						savingWorkspace = false;
						showSavedBriefly((v) => (workspaceSaved = v));
						await update();
					};
				}}
			>
				<div class="form-grid single">
					<div class="form-group">
						<label for="ws-name">Workspace Name</label>
						<input type="text" id="ws-name" name="name" value={data.workspace.name} required />
					</div>
				</div>

				<div class="workspace-meta">
					<div class="meta-item">
						<span class="meta-label">Your Role</span>
						<span class="meta-value role-badge">{data.workspace.role}</span>
					</div>
					<div class="meta-item">
						<span class="meta-label">Workspace ID</span>
						<span class="meta-value mono">{data.workspace.id}</span>
					</div>
				</div>

				{#if form?.error && form?.section === 'workspace'}
					<p class="form-error">{form.error}</p>
				{/if}

				<div class="form-footer">
					{#if workspaceSaved}
						<span class="saved-indicator">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Saved
						</span>
					{/if}
					<button type="submit" class="btn-primary" disabled={savingWorkspace}>
						{savingWorkspace ? 'Saving...' : 'Save Workspace'}
					</button>
				</div>
			</form>
		</Card>
	</section>

	<!-- Billing Section -->
	<section class="settings-section">
		<div class="section-header">
			<div class="section-icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
				</svg>
			</div>
			<div>
				<h2>Billing & Plan</h2>
				<p class="section-desc">Manage your subscription and payment method.</p>
			</div>
		</div>

		<Card>
			<div class="billing-info">
				<div class="billing-plan">
					<div class="billing-row">
						<span class="billing-label">Current Plan</span>
						<span class="billing-value plan-name">
							{#if data.billing.hasActiveSubscription}
								{planNames[data.billing.planKey] || data.billing.planKey}
							{:else}
								Free
							{/if}
						</span>
					</div>
					<div class="billing-row">
						<span class="billing-label">Status</span>
						<span class="billing-value">
							{#if data.billing.hasActiveSubscription}
								<span class="status-badge active">Active</span>
							{:else if data.billing.isTrialActive}
								<span class="status-badge trial">Trial &middot; {data.billing.trialDaysLeft} day{data.billing.trialDaysLeft === 1 ? '' : 's'} remaining</span>
							{:else if data.billing.isTrialExpired}
								<span class="status-badge expired">Trial Expired</span>
							{:else if data.billing.subscriptionStatus === 'past_due'}
								<span class="status-badge past-due">Past Due</span>
							{:else if data.billing.subscriptionStatus === 'cancelled'}
								<span class="status-badge cancelled">Cancelled</span>
							{:else}
								<span class="status-badge inactive">No Plan</span>
							{/if}
						</span>
					</div>
					{#if data.billing.billingInterval && data.billing.hasActiveSubscription}
						<div class="billing-row">
							<span class="billing-label">Billing</span>
							<span class="billing-value">{data.billing.billingInterval === 'annual' ? 'Annual' : 'Monthly'}</span>
						</div>
					{/if}
					{#if data.billing.currentPeriodEnd && data.billing.hasActiveSubscription}
						<div class="billing-row">
							<span class="billing-label">Next Billing Date</span>
							<span class="billing-value">{new Date(data.billing.currentPeriodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
						</div>
					{/if}
				</div>

				<div class="billing-actions">
					{#if data.billing.hasActiveSubscription || data.billing.subscriptionStatus === 'past_due'}
						<button class="btn-secondary" onclick={openBillingPortal} disabled={loadingPortal}>
							{loadingPortal ? 'Opening...' : 'Manage Subscription'}
						</button>
					{:else}
						<a href="/pricing" class="btn-primary">Choose a Plan</a>
					{/if}
				</div>
			</div>
		</Card>
	</section>

	<!-- Notifications Section -->
	<section class="settings-section">
		<div class="section-header">
			<div class="section-icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
				</svg>
			</div>
			<div>
				<h2>Notifications</h2>
				<p class="section-desc">Control when and how you're notified.</p>
			</div>
		</div>

		<Card>
			<div class="notification-options">
				<div class="notification-row">
					<div class="notification-info">
						<span class="notification-label">Desktop notifications</span>
						<span class="notification-desc">
							{#if desktopNotifPermission === 'granted'}
								You'll receive browser notifications when clients submit documents or comments.
							{:else if desktopNotifPermission === 'denied'}
								Notifications are blocked. Enable them in your browser's site settings.
							{:else}
								Get real-time browser alerts when clients upload documents or add comments.
							{/if}
						</span>
					</div>
					{#if desktopNotifPermission === 'granted'}
						<span class="notif-status granted">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Enabled
						</span>
					{:else if desktopNotifPermission === 'denied'}
						<span class="notif-status denied">Blocked</span>
					{:else}
						<button class="btn-enable-notif" onclick={toggleDesktopNotifications}>
							Enable
						</button>
					{/if}
				</div>
				<form
				method="POST"
				action="?/updateNotificationPrefs"
				use:enhance={() => {
					savingNotifs = true;
					return async ({ update }) => {
						savingNotifs = false;
						showSavedBriefly((v) => (notifsSaved = v));
						await update();
					};
				}}
				class="notification-form"
			>
				<div class="notification-row">
					<div class="notification-info">
						<span class="notification-label">Email — Client submissions</span>
						<span class="notification-desc">Get emailed when a client uploads a document or answers a question.</span>
					</div>
					<label class="toggle">
						<input type="checkbox" name="notifySubmissions" checked={data.notificationPrefs.notifySubmissions === 1} />
						<span class="toggle-slider"></span>
					</label>
				</div>
				<div class="notification-row">
					<div class="notification-info">
						<span class="notification-label">Email — Item review reminders</span>
						<span class="notification-desc">Reminder when submitted items are waiting for your review.</span>
					</div>
					<label class="toggle">
						<input type="checkbox" name="notifyReviewReminders" checked={data.notificationPrefs.notifyReviewReminders === 1} />
						<span class="toggle-slider"></span>
					</label>
				</div>
				<div class="notification-row notification-row-last">
					<div class="notification-info">
						<span class="notification-label">Email — Transaction completed</span>
						<span class="notification-desc">Get emailed when all items in a transaction are complete.</span>
					</div>
					<label class="toggle">
						<input type="checkbox" name="notifyCompleted" checked={data.notificationPrefs.notifyCompleted === 1} />
						<span class="toggle-slider"></span>
					</label>
				</div>
				<div class="form-footer">
					{#if notifsSaved}
						<span class="saved-indicator">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Saved
						</span>
					{/if}
					<button type="submit" class="btn-primary" disabled={savingNotifs}>
						{savingNotifs ? 'Saving...' : 'Save Preferences'}
					</button>
				</div>
			</form>
			</div>
		</Card>
	</section>
</div>

<style>
	.settings-page {
		max-width: 700px;
	}

	h1 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.subtitle {
		color: var(--text-secondary);
		margin-bottom: var(--space-xxl);
	}

	/* Sections */
	.settings-section {
		margin-bottom: var(--space-xxl);
	}

	.section-header {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.section-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	h2 {
		font-size: var(--font-size-md);
		font-weight: 600;
		margin-bottom: 2px;
	}

	.section-desc {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	/* Form */
	.form-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-lg);
		margin-bottom: var(--space-lg);
	}

	.form-grid.single {
		grid-template-columns: 1fr;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.form-group label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.optional {
		color: var(--text-muted);
		font-weight: 400;
	}

	.form-group input,
	.form-group select {
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		font-family: inherit;
	}

	.form-group input:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
	}

	.form-group input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		background: var(--bg-tertiary);
	}

	.field-hint {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.form-error {
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
	}

	.form-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: var(--space-md);
	}

	.saved-indicator {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--font-size-sm);
		color: var(--color-accent);
		font-weight: 500;
		animation: fadeIn 0.2s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(2px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Workspace meta */
	.workspace-meta {
		display: flex;
		gap: var(--space-xl);
		padding: var(--space-md) 0;
		margin-bottom: var(--space-md);
		border-top: 1px solid var(--border-color);
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.meta-value {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
	}

	.role-badge {
		text-transform: capitalize;
		font-weight: 500;
	}

	.mono {
		font-family: var(--font-mono, monospace);
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
	}

	/* Notifications */
	.notification-options {
		display: flex;
		flex-direction: column;
	}

	.notification-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-lg);
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--border-color);
	}

	.notification-row:first-child {
		padding-top: 0;
	}

	.notification-row:last-child {
		border-bottom: none;
	}

	.notification-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.notification-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.notification-desc {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: 1.4;
	}

	/* Toggle switch */
	.toggle {
		position: relative;
		display: inline-block;
		width: 44px;
		height: 24px;
		flex-shrink: 0;
		cursor: pointer;
	}

	.toggle input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		inset: 0;
		background: var(--bg-tertiary);
		border-radius: 12px;
		transition: all var(--transition-fast);
	}

	.toggle-slider::before {
		content: '';
		position: absolute;
		width: 18px;
		height: 18px;
		left: 3px;
		bottom: 3px;
		background: var(--text-primary);
		border-radius: 50%;
		transition: all var(--transition-fast);
	}

	.toggle input:checked + .toggle-slider {
		background: var(--color-accent);
	}

	.toggle input:checked + .toggle-slider::before {
		transform: translateX(20px);
		background: var(--text-inverse);
	}

	.toggle input:disabled + .toggle-slider {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.notification-form {
		display: flex;
		flex-direction: column;
	}

	.notification-row-last {
		border-bottom: none;
	}

	.notification-form .form-footer {
		padding-top: var(--space-md);
	}

	.notif-status {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: var(--font-size-sm);
		font-weight: 500;
		white-space: nowrap;
		padding: 4px 12px;
		border-radius: var(--radius-full);
	}

	.notif-status.granted {
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
	}

	.notif-status.denied {
		color: var(--text-muted);
		background: var(--bg-tertiary);
	}

	.btn-enable-notif {
		padding: var(--space-xs) var(--space-lg);
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
		font-size: var(--font-size-sm);
		font-weight: 600;
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.btn-enable-notif:hover {
		background: rgba(59, 130, 246, 0.15);
		border-color: rgba(59, 130, 246, 0.4);
	}

	/* Button */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-lg);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.btn-primary:hover { background: var(--color-accent-hover); }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

	/* Billing section */
	.billing-info {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.billing-plan {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.billing-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-sm) 0;
		border-bottom: 1px solid var(--border-primary);
	}

	.billing-row:last-child {
		border-bottom: none;
	}

	.billing-label {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.billing-value {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		font-weight: 500;
	}

	.billing-value.plan-name {
		font-weight: 700;
		font-size: var(--font-size-md);
		color: var(--accent);
	}

	.status-badge {
		padding: 2px 10px;
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
		font-weight: 600;
	}

	.status-badge.active {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
	}

	.status-badge.past-due {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
	}

	.status-badge.cancelled {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.status-badge.inactive {
		background: rgba(161, 161, 170, 0.15);
		color: var(--text-muted);
	}

	.status-badge.trial {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.status-badge.expired {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
	}

	.billing-actions {
		display: flex;
		gap: var(--space-md);
	}

	.billing-actions .btn-secondary {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--border-primary);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-weight: 600;
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: all 0.15s;
	}

	.billing-actions .btn-secondary:hover {
		border-color: var(--accent);
		color: var(--accent);
	}

	.billing-actions .btn-secondary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.billing-actions .btn-primary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-sm) var(--space-lg);
		background: var(--accent);
		color: white;
		font-weight: 600;
		font-size: var(--font-size-sm);
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: background 0.15s;
	}

	.billing-actions .btn-primary:hover {
		background: var(--accent-hover);
	}

	@media (max-width: 640px) {
		.form-grid { grid-template-columns: 1fr; }
		.workspace-meta { flex-direction: column; gap: var(--space-md); }
	}
</style>
