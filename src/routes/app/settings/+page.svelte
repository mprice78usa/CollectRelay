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
	let savingBranding = $state(false);
	let brandingSaved = $state(false);
	let uploadingLogo = $state(false);
	let logoPreview = $state<string | null>(null);
	let brandColor = $state(data.branding?.brand_color || '');
	let brandName = $state(data.branding?.brand_name || '');
	let desktopNotifPermission = $state<string>('default');

	// API Keys
	let apiKeys = $state(data.apiKeys || []);
	let showCreateApiKey = $state(false);
	let apiKeyName = $state('');
	let creatingApiKey = $state(false);
	let newApiKeyValue = $state<string | null>(null);
	let copiedApiKey = $state(false);

	async function createApiKey() {
		if (!apiKeyName.trim()) return;
		creatingApiKey = true;
		try {
			const res = await fetch('/api/api-keys', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: apiKeyName.trim() })
			});
			if (res.ok) {
				const result = await res.json();
				newApiKeyValue = result.key;
				apiKeyName = '';
				showCreateApiKey = false;
				await refreshApiKeys();
			}
		} catch { /* ignore */ }
		creatingApiKey = false;
	}

	async function refreshApiKeys() {
		try {
			const res = await fetch('/api/api-keys');
			if (res.ok) apiKeys = await res.json();
		} catch { /* ignore */ }
	}

	async function revokeApiKey(id: string) {
		if (!confirm('Revoke this API key? Any integrations using it will stop working immediately.')) return;
		await fetch(`/api/api-keys/${id}`, { method: 'DELETE' });
		await refreshApiKeys();
	}

	function copyApiKey() {
		if (newApiKeyValue) {
			navigator.clipboard.writeText(newApiKeyValue);
			copiedApiKey = true;
			setTimeout(() => copiedApiKey = false, 2000);
		}
	}

	// Webhooks
	let webhooks = $state(data.webhooks || []);
	let showAddWebhook = $state(false);
	let webhookUrl = $state('');
	let webhookDescription = $state('');
	let webhookEvents = $state<Set<string>>(new Set());
	let addingWebhook = $state(false);
	let newWebhookSecret = $state<string | null>(null);
	let testingWebhookId = $state<string | null>(null);
	let testResult = $state<{ success: boolean; status: number | null; durationMs: number } | null>(null);
	let expandedDeliveries = $state<string | null>(null);
	let deliveryLogs = $state<Record<string, any[]>>({});

	const WEBHOOK_EVENTS = [
		{ id: 'file_uploaded', label: 'File uploaded' },
		{ id: 'answer_submitted', label: 'Answer submitted' },
		{ id: 'signature_submitted', label: 'Signature submitted' },
		{ id: 'item_reviewed', label: 'Item reviewed' },
		{ id: 'status_changed', label: 'Status changed' },
		{ id: 'comment_added', label: 'Comment added' },
		{ id: 'magic_link_sent', label: 'Magic link sent' },
		{ id: 'reminder_sent', label: 'Reminder sent' }
	];

	function toggleWebhookEvent(eventId: string) {
		const next = new Set(webhookEvents);
		if (next.has(eventId)) next.delete(eventId);
		else next.add(eventId);
		webhookEvents = next;
	}

	async function createWebhook() {
		if (!webhookUrl || webhookEvents.size === 0) return;
		addingWebhook = true;
		try {
			const res = await fetch('/api/webhooks', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					url: webhookUrl,
					events: Array.from(webhookEvents),
					description: webhookDescription || undefined
				})
			});
			if (res.ok) {
				const result = await res.json();
				newWebhookSecret = result.secret;
				webhookUrl = '';
				webhookDescription = '';
				webhookEvents = new Set();
				showAddWebhook = false;
				await refreshWebhooks();
			}
		} catch { /* ignore */ }
		addingWebhook = false;
	}

	async function refreshWebhooks() {
		try {
			const res = await fetch('/api/webhooks');
			if (res.ok) webhooks = await res.json();
		} catch { /* ignore */ }
	}

	async function toggleWebhookEnabled(id: string, enabled: boolean) {
		await fetch(`/api/webhooks/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ enabled: !enabled })
		});
		await refreshWebhooks();
	}

	async function deleteWebhook(id: string) {
		if (!confirm('Delete this webhook? This cannot be undone.')) return;
		await fetch(`/api/webhooks/${id}`, { method: 'DELETE' });
		await refreshWebhooks();
	}

	async function testWebhook(id: string) {
		testingWebhookId = id;
		testResult = null;
		try {
			const res = await fetch(`/api/webhooks/${id}/test`, { method: 'POST' });
			if (res.ok) testResult = await res.json();
		} catch { /* ignore */ }
		testingWebhookId = null;
	}

	async function loadDeliveries(id: string) {
		if (expandedDeliveries === id) { expandedDeliveries = null; return; }
		expandedDeliveries = id;
		try {
			const res = await fetch(`/api/webhooks/${id}/deliveries`);
			if (res.ok) deliveryLogs[id] = await res.json();
		} catch { /* ignore */ }
	}

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

	async function handleLogoUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Show preview immediately
		logoPreview = URL.createObjectURL(file);
		uploadingLogo = true;

		try {
			const formData = new FormData();
			formData.append('logo', file);
			const res = await fetch('/api/branding/logo', { method: 'POST', body: formData });
			if (!res.ok) {
				const err = await res.json();
				alert(err.message || 'Upload failed');
				logoPreview = null;
			}
		} catch {
			alert('Upload failed');
			logoPreview = null;
		} finally {
			uploadingLogo = false;
		}
	}

	async function removeLogo() {
		uploadingLogo = true;
		try {
			await fetch('/api/branding/logo', { method: 'DELETE' });
			logoPreview = null;
			data.branding.brand_logo_r2_key = null;
		} catch {
			// ignore
		} finally {
			uploadingLogo = false;
		}
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

	<!-- Team Section -->
	<section class="settings-section">
		<div class="section-header">
			<div class="section-icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
				</svg>
			</div>
			<div>
				<h2>Team</h2>
				<p class="section-desc">Manage workspace members and invitations.</p>
			</div>
		</div>

		<Card>
			<!-- Current Members -->
			<div class="team-list">
				{#each data.members as member}
					<div class="team-row">
						<div class="team-info">
							<div class="team-avatar">{member.name.charAt(0).toUpperCase()}</div>
							<div>
								<div class="team-name">{member.name}</div>
								<div class="team-email">{member.email}</div>
							</div>
						</div>
						<div class="team-actions">
							<span class="role-badge role-{member.role}">{member.role}</span>
							{#if member.role !== 'owner' && (data.workspace.role === 'owner' || data.workspace.role === 'admin')}
								<form method="POST" action="?/changeMemberRole" use:enhance class="inline-form">
									<input type="hidden" name="userId" value={member.userId} />
									<select name="role" onchange={(e) => { (e.target as HTMLSelectElement).form?.requestSubmit(); }}>
										<option value="member" selected={member.role === 'member'}>Member</option>
										<option value="admin" selected={member.role === 'admin'}>Admin</option>
									</select>
								</form>
								<form method="POST" action="?/removeMember" use:enhance class="inline-form" onsubmit={(e) => { if (!confirm(`Remove ${member.name} from the workspace?`)) e.preventDefault(); }}>
									<input type="hidden" name="userId" value={member.userId} />
									<button type="submit" class="btn-icon-danger" title="Remove member">
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
										</svg>
									</button>
								</form>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Pending Invitations -->
			{#if data.invitations.length > 0}
				<div class="invitations-section">
					<h3 class="subsection-title">Pending Invitations</h3>
					{#each data.invitations as inv}
						<div class="team-row invitation-row">
							<div class="team-info">
								<div class="team-avatar pending">?</div>
								<div>
									<div class="team-name">{inv.email}</div>
									<div class="team-email">Invited as {inv.role} &middot; Expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
								</div>
							</div>
							<div class="team-actions">
								<form method="POST" action="?/resendInvitation" use:enhance class="inline-form">
									<input type="hidden" name="invitationId" value={inv.id} />
									<button type="submit" class="btn-sm btn-secondary">Resend</button>
								</form>
								<form method="POST" action="?/revokeInvitation" use:enhance class="inline-form">
									<input type="hidden" name="invitationId" value={inv.id} />
									<button type="submit" class="btn-sm btn-danger">Revoke</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Invite Form -->
			{#if data.workspace.role === 'owner' || data.workspace.role === 'admin'}
				<div class="invite-form-section">
					<h3 class="subsection-title">Invite a Team Member</h3>
					{#if form?.error && form?.section === 'team'}
						<div class="form-error">{form.error}</div>
					{/if}
					<form method="POST" action="?/inviteMember" use:enhance class="invite-form">
						<div class="form-group" style="flex: 1;">
							<input type="email" name="email" placeholder="colleague@example.com" required />
						</div>
						<div class="form-group">
							<select name="role">
								<option value="member">Member</option>
								<option value="admin">Admin</option>
							</select>
						</div>
						<button type="submit" class="btn-primary">Send Invite</button>
					</form>
				</div>
			{/if}
		</Card>
	</section>

	<!-- Branding Section -->
	<section class="settings-section">
		<div class="section-header">
			<div class="section-icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
				</svg>
			</div>
			<div>
				<h2>Branding</h2>
				<p class="section-desc">Customize how your client portal looks to clients.</p>
			</div>
		</div>

		<Card>
			<!-- Logo Upload -->
			<div class="branding-logo-section">
				<label class="form-label">Logo</label>
				<p class="form-hint">Displayed in the client portal header. PNG, JPG, SVG, or WebP. Max 2MB.</p>
				<div class="logo-upload-row">
					<div class="logo-preview">
						{#if logoPreview || data.branding?.brand_logo_r2_key}
							<img
								src={logoPreview || `/api/files/${data.branding.brand_logo_r2_key}`}
								alt="Brand logo"
								class="logo-img"
							/>
						{:else}
							<div class="logo-placeholder">
								<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
									<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
								</svg>
							</div>
						{/if}
					</div>
					<div class="logo-actions">
						<label class="btn-secondary btn-sm logo-upload-btn">
							{uploadingLogo ? 'Uploading...' : 'Upload Logo'}
							<input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onchange={handleLogoUpload} hidden />
						</label>
						{#if data.branding?.brand_logo_r2_key || logoPreview}
							<button type="button" class="btn-ghost btn-sm" onclick={removeLogo} disabled={uploadingLogo}>Remove</button>
						{/if}
					</div>
				</div>
			</div>

			<form
				method="POST"
				action="?/updateBranding"
				use:enhance={() => {
					savingBranding = true;
					return async ({ update }) => {
						savingBranding = false;
						showSavedBriefly((v) => (brandingSaved = v));
						await update();
					};
				}}
			>
				<div class="form-grid">
					<div class="form-group">
						<label for="brand-name">Business Name</label>
						<input type="text" id="brand-name" name="brandName" bind:value={brandName} placeholder="Shown instead of CollectRelay" />
						<span class="form-hint">Replaces "CollectRelay" in the client portal header.</span>
					</div>
					<div class="form-group">
						<label for="brand-color">Accent Color</label>
						<div class="color-input-row">
							<input type="color" id="brand-color-picker" value={brandColor || '#10B981'} oninput={(e) => brandColor = (e.target as HTMLInputElement).value} class="color-picker" />
							<input type="text" id="brand-color" name="brandColor" bind:value={brandColor} placeholder="#10B981" pattern="^#[0-9a-fA-F]{6}$" class="color-text" />
						</div>
						<span class="form-hint">Used for buttons and highlights in the client portal.</span>
					</div>
				</div>

				<!-- Live Preview -->
				<div class="branding-preview" style="--preview-accent: {brandColor || '#10B981'}">
					<div class="preview-label">Client Portal Preview</div>
					<div class="preview-header">
						{#if logoPreview || data.branding?.brand_logo_r2_key}
							<img src={logoPreview || `/api/files/${data.branding.brand_logo_r2_key}`} alt="" class="preview-logo" />
						{:else}
							<svg viewBox="0 0 32 32" width="24" height="24" class="preview-logo-svg">
								<rect width="32" height="32" rx="6" fill="var(--preview-accent)" opacity="0.15"/>
								<path d="M8 10h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--preview-accent)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
								<path d="M8 16h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--preview-accent)" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.7"/>
							</svg>
						{/if}
						<span class="preview-name">{brandName || 'CollectRelay'}</span>
					</div>
					<div class="preview-body">
						<div class="preview-btn" style="background: var(--preview-accent)">Upload Documents</div>
					</div>
				</div>

				{#if form?.error && form?.section === 'branding'}
					<p class="form-error">{form.error}</p>
				{/if}

				<div class="form-footer">
					{#if brandingSaved}
						<span class="saved-indicator">
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								<polyline points="20 6 9 17 4 12" />
							</svg>
							Saved
						</span>
					{/if}
					<button type="submit" class="btn-primary" disabled={savingBranding}>
						{savingBranding ? 'Saving...' : 'Save Branding'}
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

	<!-- Webhooks Section -->
	<section class="settings-section">
		<div class="section-header">
			<div class="section-icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
				</svg>
			</div>
			<div>
				<h2>Webhooks</h2>
				<p class="section-desc">Send event notifications to external URLs for CRM integrations.</p>
			</div>
		</div>

		<Card>
			{#if newWebhookSecret}
				<div class="webhook-secret-banner">
					<strong>Webhook secret (shown once):</strong>
					<code>{newWebhookSecret}</code>
					<button class="btn-copy-secret" onclick={() => { navigator.clipboard.writeText(newWebhookSecret!); newWebhookSecret = null; }}>
						Copy & dismiss
					</button>
				</div>
			{/if}

			{#if testResult}
				<div class="test-result" class:test-success={testResult.success} class:test-fail={!testResult.success}>
					{testResult.success ? 'Test delivered successfully' : 'Test delivery failed'}
					{#if testResult.status} &middot; HTTP {testResult.status}{/if}
					&middot; {testResult.durationMs}ms
					<button class="dismiss-test" onclick={() => testResult = null}>dismiss</button>
				</div>
			{/if}

			<div class="webhooks-list">
				{#if webhooks.length === 0 && !showAddWebhook}
					<p class="webhooks-empty">No webhooks configured. Add one to send event notifications to external services.</p>
				{/if}

				{#each webhooks as wh}
					<div class="webhook-item" class:webhook-disabled={!wh.enabled}>
						<div class="webhook-header">
							<div class="webhook-info">
								<span class="webhook-url">{wh.url}</span>
								{#if wh.description}
									<span class="webhook-desc">{wh.description}</span>
								{/if}
								<div class="webhook-events-list">
									{#each (Array.isArray(wh.events) ? wh.events : []) as evt}
										<span class="webhook-event-tag">{evt}</span>
									{/each}
								</div>
							</div>
							<div class="webhook-actions">
								<label class="toggle toggle-sm">
									<input type="checkbox" checked={!!wh.enabled} onchange={() => toggleWebhookEnabled(wh.id, !!wh.enabled)} />
									<span class="toggle-slider"></span>
								</label>
								<button class="btn-webhook-action" onclick={() => testWebhook(wh.id)} disabled={testingWebhookId === wh.id}>
									{testingWebhookId === wh.id ? 'Sending...' : 'Test'}
								</button>
								<button class="btn-webhook-action" onclick={() => loadDeliveries(wh.id)}>
									{expandedDeliveries === wh.id ? 'Hide log' : 'Log'}
								</button>
								<button class="btn-webhook-action btn-danger-text" onclick={() => deleteWebhook(wh.id)}>Delete</button>
							</div>
						</div>
						{#if expandedDeliveries === wh.id}
							<div class="delivery-log">
								{#if !deliveryLogs[wh.id] || deliveryLogs[wh.id].length === 0}
									<p class="delivery-empty">No deliveries yet.</p>
								{:else}
									{#each deliveryLogs[wh.id] as d}
										<div class="delivery-row" class:delivery-success={!!d.success} class:delivery-fail={!d.success}>
											<span class="delivery-event">{d.event_type}</span>
											<span class="delivery-status">{d.response_status || 'Error'}</span>
											<span class="delivery-time">{d.duration_ms}ms</span>
											<span class="delivery-date">{new Date(d.created_at).toLocaleString()}</span>
										</div>
									{/each}
								{/if}
							</div>
						{/if}
					</div>
				{/each}

				{#if showAddWebhook}
					<div class="webhook-form">
						<div class="form-group">
							<label for="wh-url">Endpoint URL</label>
							<input type="url" id="wh-url" bind:value={webhookUrl} placeholder="https://your-service.com/webhook" required />
						</div>
						<div class="form-group">
							<label for="wh-desc">Description <span class="optional">(optional)</span></label>
							<input type="text" id="wh-desc" bind:value={webhookDescription} placeholder="e.g. Zapier integration" />
						</div>
						<div class="form-group">
							<label>Events</label>
							<div class="event-checkboxes">
								{#each WEBHOOK_EVENTS as evt}
									<label class="event-check">
										<input type="checkbox" checked={webhookEvents.has(evt.id)} onchange={() => toggleWebhookEvent(evt.id)} />
										{evt.label}
									</label>
								{/each}
							</div>
						</div>
						<div class="form-footer">
							<button class="btn-secondary-sm" onclick={() => showAddWebhook = false}>Cancel</button>
							<button class="btn-primary" onclick={createWebhook} disabled={addingWebhook || !webhookUrl || webhookEvents.size === 0}>
								{addingWebhook ? 'Creating...' : 'Create Webhook'}
							</button>
						</div>
					</div>
				{:else}
					<button class="btn-add-webhook" onclick={() => showAddWebhook = true}>
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Add Webhook
					</button>
				{/if}
			</div>
		</Card>
	</section>

	<!-- API Keys Section -->
	<section class="settings-section">
		<div class="section-header">
			<div class="section-icon">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
				</svg>
			</div>
			<div>
				<h2>API Keys</h2>
				<p class="section-desc">Authenticate external integrations with the CollectRelay REST API.</p>
			</div>
		</div>

		<Card>
			{#if newApiKeyValue}
				<div class="api-key-banner">
					<div class="api-key-banner-header">
						<strong>Your API key (shown once):</strong>
						<p class="api-key-warning">Copy this key now. You won't be able to see it again.</p>
					</div>
					<div class="api-key-display">
						<code class="api-key-value">{newApiKeyValue}</code>
						<button class="btn-copy-secret" onclick={copyApiKey}>
							{copiedApiKey ? 'Copied!' : 'Copy'}
						</button>
					</div>
					<button class="btn-dismiss-key" onclick={() => newApiKeyValue = null}>
						I've copied this key
					</button>
				</div>
			{/if}

			<div class="api-keys-list">
				{#if apiKeys.length === 0 && !showCreateApiKey}
					<p class="api-keys-empty">No API keys yet. Create one to integrate with external services.</p>
				{/if}

				{#each apiKeys as key}
					<div class="api-key-item">
						<div class="api-key-info">
							<span class="api-key-name">{key.name}</span>
							<code class="api-key-prefix">{key.keyPrefix}...</code>
						</div>
						<div class="api-key-meta">
							<span class="api-key-date">Created {new Date(key.createdAt).toLocaleDateString()}</span>
							{#if key.lastUsedAt}
								<span class="api-key-date">Last used {new Date(key.lastUsedAt).toLocaleDateString()}</span>
							{:else}
								<span class="api-key-date api-key-never">Never used</span>
							{/if}
							<button class="btn-webhook-action btn-danger-text" onclick={() => revokeApiKey(key.id)}>Revoke</button>
						</div>
					</div>
				{/each}

				{#if showCreateApiKey}
					<div class="api-key-form">
						<div class="form-group">
							<label for="ak-name">Key name</label>
							<input type="text" id="ak-name" bind:value={apiKeyName} placeholder="e.g. Zapier Integration, CRM Sync" maxlength="100" />
						</div>
						<div class="form-footer">
							<button class="btn-secondary-sm" onclick={() => showCreateApiKey = false}>Cancel</button>
							<button class="btn-primary" onclick={createApiKey} disabled={creatingApiKey || !apiKeyName.trim()}>
								{creatingApiKey ? 'Creating...' : 'Create API Key'}
							</button>
						</div>
					</div>
				{:else}
					<button class="btn-add-webhook" onclick={() => showCreateApiKey = true}>
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
						</svg>
						Create API Key
					</button>
				{/if}
			</div>

			<div class="api-docs-link">
				<p>Base URL: <code>https://collectrelay.com/api/v1/</code></p>
				<p>Auth header: <code>Authorization: Bearer cr_live_...</code></p>
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

	/* Webhooks */
	.webhooks-empty {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		padding: var(--space-sm) 0;
	}

	.webhook-item {
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--border-color);
	}

	.webhook-item:last-child { border-bottom: none; }

	.webhook-disabled { opacity: 0.5; }

	.webhook-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-md);
	}

	.webhook-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.webhook-url {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
		word-break: break-all;
	}

	.webhook-desc {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.webhook-events-list {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 4px;
	}

	.webhook-event-tag {
		font-size: 10px;
		padding: 1px 6px;
		border-radius: var(--radius-full);
		background: var(--bg-tertiary);
		color: var(--text-secondary);
	}

	.webhook-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	.toggle-sm {
		width: 36px;
		height: 20px;
	}

	.toggle-sm .toggle-slider::before {
		width: 14px;
		height: 14px;
	}

	.toggle-sm input:checked + .toggle-slider::before {
		transform: translateX(16px);
	}

	.btn-webhook-action {
		background: none;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--font-size-xs);
		padding: 3px 8px;
		cursor: pointer;
		transition: all var(--transition-fast);
		white-space: nowrap;
	}

	.btn-webhook-action:hover {
		border-color: var(--text-muted);
		color: var(--text-primary);
	}

	.btn-webhook-action:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-danger-text {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.3);
	}

	.btn-danger-text:hover {
		border-color: #ef4444;
		color: #ef4444;
	}

	.webhook-secret-banner {
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		margin-bottom: var(--space-md);
		font-size: var(--font-size-sm);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.webhook-secret-banner code {
		background: var(--bg-primary);
		padding: 4px 8px;
		border-radius: var(--radius-sm);
		font-family: var(--font-mono, monospace);
		font-size: var(--font-size-xs);
		word-break: break-all;
	}

	.btn-copy-secret {
		align-self: flex-start;
		background: none;
		border: 1px solid rgba(245, 158, 11, 0.4);
		color: #f59e0b;
		padding: 4px 12px;
		border-radius: var(--radius-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
		cursor: pointer;
	}

	.test-result {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.test-success {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}

	.test-fail {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.dismiss-test {
		margin-left: auto;
		background: none;
		border: none;
		color: inherit;
		opacity: 0.6;
		cursor: pointer;
		font-size: var(--font-size-xs);
		text-decoration: underline;
	}

	.delivery-log {
		margin-top: var(--space-sm);
		padding: var(--space-sm);
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		max-height: 200px;
		overflow-y: auto;
	}

	.delivery-empty {
		color: var(--text-muted);
		font-size: var(--font-size-xs);
		padding: var(--space-sm);
	}

	.delivery-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: 4px var(--space-sm);
		font-size: var(--font-size-xs);
		border-radius: var(--radius-sm);
	}

	.delivery-row:nth-child(even) { background: var(--bg-tertiary); }

	.delivery-success .delivery-status { color: #10b981; }
	.delivery-fail .delivery-status { color: #ef4444; }

	.delivery-event { font-weight: 500; min-width: 100px; }
	.delivery-status { min-width: 50px; font-weight: 600; }
	.delivery-time { color: var(--text-muted); min-width: 50px; }
	.delivery-date { color: var(--text-muted); margin-left: auto; }

	.webhook-form {
		padding: var(--space-md) 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.event-checkboxes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-sm);
	}

	.event-check {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		cursor: pointer;
	}

	.event-check input[type="checkbox"] {
		accent-color: var(--color-accent);
	}

	.btn-secondary-sm {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
	}

	.btn-secondary-sm:hover {
		border-color: var(--text-muted);
	}

	.btn-add-webhook {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		background: transparent;
		border: 1px dashed var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
		margin-top: var(--space-sm);
	}

	.btn-add-webhook:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	/* Branding section */
	.branding-logo-section {
		margin-bottom: var(--space-xl);
		padding-bottom: var(--space-xl);
		border-bottom: 1px solid var(--border-color);
	}

	.form-label {
		display: block;
		font-weight: 600;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-xs);
	}

	.form-hint {
		display: block;
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
		margin-top: 4px;
	}

	.logo-upload-row {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		margin-top: var(--space-md);
	}

	.logo-preview {
		width: 72px;
		height: 72px;
		border-radius: var(--radius-lg);
		overflow: hidden;
		border: 1px solid var(--border-color);
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
		flex-shrink: 0;
	}

	.logo-img {
		width: 100%;
		height: 100%;
		object-fit: contain;
	}

	.logo-placeholder {
		color: var(--text-tertiary);
	}

	.logo-actions {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.logo-upload-btn {
		cursor: pointer;
	}

	.btn-sm {
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-size-xs);
	}

	.btn-ghost {
		background: none;
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-ghost:hover {
		border-color: var(--color-error);
		color: var(--color-error);
	}

	.color-input-row {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.color-picker {
		width: 40px;
		height: 40px;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		background: none;
		padding: 0;
	}

	.color-picker::-webkit-color-swatch-wrapper {
		padding: 2px;
	}

	.color-picker::-webkit-color-swatch {
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-color);
	}

	.color-text {
		width: 120px;
		font-family: var(--font-mono);
		font-size: var(--font-size-sm);
	}

	/* Branding preview */
	.branding-preview {
		margin: var(--space-xl) 0;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.preview-label {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
		padding: var(--space-sm) var(--space-md);
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-secondary);
	}

	.preview-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-md) var(--space-lg);
		background: #1a1f2e;
	}

	.preview-logo {
		width: 28px;
		height: 28px;
		object-fit: contain;
		border-radius: var(--radius-sm);
	}

	.preview-logo-svg {
		flex-shrink: 0;
	}

	.preview-name {
		font-weight: 600;
		font-size: var(--font-size-sm);
		color: white;
	}

	.preview-body {
		padding: var(--space-lg);
		background: var(--bg-primary);
		display: flex;
		justify-content: center;
	}

	.preview-btn {
		padding: var(--space-sm) var(--space-xl);
		border-radius: var(--radius-md);
		color: white;
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	/* API Keys */
	.api-key-banner {
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: var(--radius-md);
		padding: var(--space-lg);
		margin-bottom: var(--space-lg);
	}

	.api-key-banner-header {
		margin-bottom: var(--space-md);
	}

	.api-key-warning {
		color: var(--color-warning);
		font-size: var(--font-size-xs);
		margin-top: 4px;
	}

	.api-key-display {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-md);
	}

	.api-key-value {
		flex: 1;
		font-size: var(--font-size-sm);
		background: var(--bg-primary);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		border: 1px solid var(--border-color);
		word-break: break-all;
	}

	.btn-dismiss-key {
		display: block;
		padding: var(--space-sm) var(--space-md);
		background: var(--color-accent);
		color: var(--text-inverse);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
		cursor: pointer;
	}

	.btn-dismiss-key:hover { opacity: 0.85; }

	.api-keys-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.api-keys-empty {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		padding: var(--space-md) 0;
	}

	.api-key-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		gap: var(--space-md);
	}

	.api-key-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		min-width: 0;
	}

	.api-key-name {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.api-key-prefix {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		background: var(--bg-tertiary);
		padding: 1px 6px;
		border-radius: var(--radius-sm);
	}

	.api-key-meta {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		flex-shrink: 0;
	}

	.api-key-date {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
		white-space: nowrap;
	}

	.api-key-never {
		font-style: italic;
	}

	.api-key-form {
		padding: var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
	}

	.api-docs-link {
		margin-top: var(--space-lg);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border-color);
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	.api-docs-link code {
		background: var(--bg-tertiary);
		padding: 1px 4px;
		border-radius: var(--radius-sm);
		font-size: 11px;
	}

	.api-docs-link p {
		margin-bottom: var(--space-xs);
	}

	@media (max-width: 640px) {
		.form-grid { grid-template-columns: 1fr; }
		.workspace-meta { flex-direction: column; gap: var(--space-md); }
		.webhook-header { flex-direction: column; }
		.webhook-actions { flex-wrap: wrap; }
		.event-checkboxes { grid-template-columns: 1fr; }
		.logo-upload-row { flex-direction: column; align-items: flex-start; }
		.api-key-item { flex-direction: column; align-items: flex-start; }
		.api-key-meta { flex-wrap: wrap; }
		.invite-form { flex-direction: column; }
		.team-row { flex-direction: column; gap: var(--space-sm); }
		.team-actions { justify-content: flex-start; }
	}

	/* Team Section */
	.team-list {
		display: flex;
		flex-direction: column;
	}

	.team-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md) 0;
		border-bottom: 1px solid var(--border-color);
	}

	.team-row:last-child {
		border-bottom: none;
	}

	.team-info {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.team-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--color-accent);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: var(--font-size-sm);
		flex-shrink: 0;
	}

	.team-avatar.pending {
		background: var(--bg-tertiary);
		color: var(--text-muted);
	}

	.team-name {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.team-email {
		font-size: 12px;
		color: var(--text-muted);
	}

	.team-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.role-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 10px;
		text-transform: capitalize;
	}

	.role-owner {
		background: rgba(139, 92, 246, 0.15);
		color: #a78bfa;
	}

	.role-admin {
		background: rgba(59, 130, 246, 0.15);
		color: #60a5fa;
	}

	.role-member {
		background: var(--bg-tertiary);
		color: var(--text-muted);
	}

	.inline-form {
		display: inline-flex;
	}

	.inline-form select {
		font-size: 12px;
		padding: 2px 6px;
		background: var(--bg-secondary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
	}

	.btn-icon-danger {
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 4px;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-icon-danger:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	.btn-sm {
		font-size: 12px;
		padding: 4px 10px;
		border-radius: var(--radius-sm);
		border: none;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-sm.btn-secondary {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
	}

	.btn-sm.btn-secondary:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	.btn-sm.btn-danger {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.btn-sm.btn-danger:hover {
		background: rgba(239, 68, 68, 0.2);
	}

	.invitations-section {
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border-color);
	}

	.subsection-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: var(--space-sm);
	}

	.invite-form-section {
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border-color);
	}

	.invite-form {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-end;
	}

	.invite-form input,
	.invite-form select {
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
	}

	.invitation-row {
		opacity: 0.7;
	}
</style>
