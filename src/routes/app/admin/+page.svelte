<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import SearchInput from '$components/ui/SearchInput.svelte';

	let { data, form } = $props();

	let searchQuery = $state('');
	let showDeleteModal = $state(false);
	let showResetModal = $state(false);
	let deleteTarget = $state<{ id: string; name: string; email: string; workspaceId: string } | null>(null);
	let resetTarget = $state<{ id: string; name: string; email: string } | null>(null);
	let deleting = $state(false);
	let resetting = $state(false);

	const industryLabels: Record<string, string> = {
		real_estate: 'Real Estate',
		contractors: 'Contractors',
		accountants: 'Accountants',
		hr: 'HR',
		other: 'Other'
	};

	const industryVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
		real_estate: 'info',
		contractors: 'warning',
		accountants: 'success',
		hr: 'default',
		other: 'default'
	};

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function trialStatus(user: any): { label: string; variant: 'success' | 'info' | 'warning' | 'error' | 'default' } {
		if (user.subscription_status === 'active') {
			return { label: 'Paid', variant: 'success' };
		}
		if (user.disabled_at) {
			return { label: 'Revoked', variant: 'error' };
		}
		if (user.trial_ends_at) {
			const daysLeft = Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / 86400000);
			if (daysLeft > 0) {
				return { label: `Trial · ${daysLeft}d left`, variant: 'info' };
			}
			return { label: 'Trial Expired', variant: 'warning' };
		}
		return { label: 'Free', variant: 'default' };
	}

	const planNames: Record<string, string> = {
		free: 'Free',
		pro: 'Pro',
		team: 'Team',
		enterprise: 'Enterprise',
		single: 'Single',
		team5: 'Team 5',
		team10: 'Team 10',
		team25: 'Team 25'
	};

	let filteredUsers = $derived(() => {
		if (!searchQuery.trim()) return data.users;
		const q = searchQuery.toLowerCase();
		return data.users.filter((u: any) =>
			u.name.toLowerCase().includes(q) ||
			u.email.toLowerCase().includes(q) ||
			(u.company && u.company.toLowerCase().includes(q))
		);
	});

	function openDeleteModal(user: any) {
		deleteTarget = { id: user.id, name: user.name, email: user.email, workspaceId: user.workspace_id };
		showDeleteModal = true;
	}

	function openResetModal(user: any) {
		resetTarget = { id: user.id, name: user.name, email: user.email };
		showResetModal = true;
	}
</script>

<svelte:head>
	<title>Admin — CollectRelay</title>
</svelte:head>

<div class="admin-page">
	<h1>Admin Dashboard</h1>
	<p class="subtitle">User management and billing overview.</p>

	<!-- Temp Password Banner -->
	{#if form?.action === 'resetPassword' && form?.success && form?.tempPassword}
		<div class="temp-password-banner">
			<div class="banner-header">
				<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
				</svg>
				<strong>Password Reset for {form.targetEmail}</strong>
			</div>
			<p>Temporary password:</p>
			<code class="temp-password">{form.tempPassword}</code>
			<p class="banner-note">Copy this password and share it with the user. They should change it after logging in.</p>
		</div>
	{/if}

	<!-- Delete Success Banner -->
	{#if form?.action === 'deleteUser' && form?.success}
		<div class="success-banner">
			<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
			</svg>
			<span>User has been permanently deleted.</span>
		</div>
	{/if}

	<!-- Stats Cards -->
	<div class="stats-row">
		<div class="stat-card">
			<span class="stat-value">{data.stats.totalUsers}</span>
			<span class="stat-label">Total Users</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{data.stats.activeTrials}</span>
			<span class="stat-label">Active Trials</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{data.stats.paidUsers}</span>
			<span class="stat-label">Paid Subscribers</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{data.stats.conversionRate}%</span>
			<span class="stat-label">Conversion Rate</span>
		</div>
		<div class="stat-card">
			<span class="stat-value">{data.stats.totalTransactions}</span>
			<span class="stat-label">Total Transactions</span>
		</div>
	</div>

	<!-- Search -->
	<div class="search-bar">
		<SearchInput bind:value={searchQuery} placeholder="Search users by name, email, or company..." />
	</div>

	<!-- Users Table -->
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Company</th>
					<th>Industry</th>
					<th>Signed Up</th>
					<th>Plan</th>
					<th>Status</th>
					<th>Usage</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredUsers() as user}
					{@const status = trialStatus(user)}
					<tr class:revoked={!!user.disabled_at}>
						<td class="cell-name">{user.name}</td>
						<td class="cell-email">{user.email}</td>
						<td class="cell-company">{user.company || '—'}</td>
						<td>
							<Badge variant={industryVariants[user.industry] ?? 'default'}>
								{industryLabels[user.industry] ?? user.industry ?? '—'}
							</Badge>
						</td>
						<td class="cell-date">{formatDate(user.created_at)}</td>
						<td>
							<Badge variant={user.subscription_status === 'active' ? 'success' : 'default'}>
								{planNames[user.plan_key] || user.plan_key}
							</Badge>
						</td>
						<td>
							<Badge variant={status.variant}>{status.label}</Badge>
						</td>
						<td class="cell-usage">
							<span class="usage-stat" title="Transactions">{user.transaction_count || 0} txn</span>
							<span class="usage-stat" title="Templates">{user.template_count || 0} tpl</span>
						</td>
						<td class="cell-actions">
							<div class="action-group">
								<button type="button" class="btn-reset" onclick={() => openResetModal(user)}>
									Reset PW
								</button>
								{#if user.disabled_at}
									<form method="POST" action="?/restoreUser" use:enhance>
										<input type="hidden" name="userId" value={user.id} />
										<button type="submit" class="btn-restore">Restore</button>
									</form>
								{:else}
									<form method="POST" action="?/revokeUser" use:enhance>
										<input type="hidden" name="userId" value={user.id} />
										<button type="submit" class="btn-revoke">Revoke</button>
									</form>
								{/if}
								<button type="button" class="btn-delete" onclick={() => openDeleteModal(user)}>
									Delete
								</button>
							</div>
						</td>
					</tr>
				{/each}
				{#if filteredUsers().length === 0}
					<tr>
						<td colspan="9" class="empty-row">
							{#if searchQuery.trim()}
								No users match "{searchQuery}".
							{:else}
								No users found.
							{/if}
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Reset Password Modal -->
<Modal bind:open={showResetModal} title="Reset Password">
	{#if resetTarget}
		<p class="modal-text">
			Generate a temporary password for <strong>{resetTarget.name}</strong> ({resetTarget.email})?
		</p>
		<p class="modal-note">The user will need to change this password after logging in.</p>
		<form
			method="POST"
			action="?/resetPassword"
			use:enhance={() => {
				resetting = true;
				return async ({ update }) => {
					resetting = false;
					showResetModal = false;
					resetTarget = null;
					await update();
				};
			}}
		>
			<input type="hidden" name="userId" value={resetTarget.id} />
			<input type="hidden" name="userEmail" value={resetTarget.email} />
			<div class="form-actions">
				<button type="button" class="btn-secondary" onclick={() => { showResetModal = false; resetTarget = null; }}>Cancel</button>
				<button type="submit" class="btn-primary" disabled={resetting}>
					{resetting ? 'Resetting...' : 'Reset Password'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<!-- Delete User Modal -->
<Modal bind:open={showDeleteModal} title="Delete User">
	{#if deleteTarget}
		<p class="modal-text">
			Permanently delete <strong>{deleteTarget.name}</strong> ({deleteTarget.email})?
		</p>
		<p class="modal-warning">This will remove all of their data including transactions, templates, files, and workspace. This action cannot be undone.</p>
		<form
			method="POST"
			action="?/deleteUser"
			use:enhance={() => {
				deleting = true;
				return async ({ update }) => {
					deleting = false;
					showDeleteModal = false;
					deleteTarget = null;
					await update();
				};
			}}
		>
			<input type="hidden" name="userId" value={deleteTarget.id} />
			<input type="hidden" name="workspaceId" value={deleteTarget.workspaceId} />
			<div class="form-actions">
				<button type="button" class="btn-secondary" onclick={() => { showDeleteModal = false; deleteTarget = null; }}>Cancel</button>
				<button type="submit" class="btn-danger" disabled={deleting}>
					{deleting ? 'Deleting...' : 'Delete Permanently'}
				</button>
			</div>
		</form>
	{/if}
</Modal>

<style>
	.admin-page {
		max-width: 1200px;
	}

	h1 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.subtitle {
		color: var(--text-secondary);
		margin-bottom: var(--space-xl);
	}

	/* Banners */
	.temp-password-banner {
		background: rgba(59, 130, 246, 0.08);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.banner-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: #3b82f6;
		margin-bottom: var(--space-sm);
	}

	.temp-password {
		display: block;
		font-family: var(--font-mono, monospace);
		font-size: var(--font-size-lg);
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-md) var(--space-lg);
		margin: var(--space-sm) 0;
		color: var(--text-primary);
		user-select: all;
		letter-spacing: 0.05em;
	}

	.banner-note {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-top: var(--space-xs);
	}

	.success-banner {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: var(--radius-lg);
		padding: var(--space-md) var(--space-lg);
		margin-bottom: var(--space-xl);
		color: var(--color-accent);
		font-size: var(--font-size-sm);
	}

	/* Stats */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.stat-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.stat-value {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		color: var(--text-primary);
	}

	.stat-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	/* Search */
	.search-bar {
		margin-bottom: var(--space-lg);
		max-width: 400px;
	}

	/* Table */
	.table-container {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-tertiary);
		white-space: nowrap;
	}

	td {
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-size-sm);
		border-bottom: 1px solid var(--border-color);
		color: var(--text-secondary);
	}

	tr:last-child td {
		border-bottom: none;
	}

	tr.revoked td {
		opacity: 0.5;
	}

	.cell-name {
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
	}

	.cell-email {
		font-family: var(--font-mono, monospace);
		font-size: var(--font-size-xs);
	}

	.cell-company {
		color: var(--text-tertiary);
	}

	.cell-date {
		white-space: nowrap;
	}

	.cell-usage {
		white-space: nowrap;
	}

	.usage-stat {
		display: inline-block;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-right: var(--space-sm);
	}

	.cell-actions {
		white-space: nowrap;
	}

	.action-group {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.action-group form {
		display: inline;
	}

	.empty-row {
		text-align: center;
		color: var(--text-muted);
		padding: var(--space-xxl) !important;
	}

	/* Action buttons */
	.btn-reset {
		padding: 4px 10px;
		font-size: var(--font-size-xs);
		font-weight: 500;
		background: transparent;
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: var(--radius-sm);
		color: #3b82f6;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-reset:hover {
		background: rgba(59, 130, 246, 0.1);
		border-color: #3b82f6;
	}

	.btn-revoke {
		padding: 4px 10px;
		font-size: var(--font-size-xs);
		font-weight: 500;
		background: transparent;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-sm);
		color: #ef4444;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-revoke:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
	}

	.btn-restore {
		padding: 4px 10px;
		font-size: var(--font-size-xs);
		font-weight: 500;
		background: transparent;
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: var(--radius-sm);
		color: var(--color-accent);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-restore:hover {
		background: rgba(16, 185, 129, 0.1);
		border-color: var(--color-accent);
	}

	.btn-delete {
		padding: 4px 10px;
		font-size: var(--font-size-xs);
		font-weight: 500;
		background: transparent;
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-sm);
		color: rgba(239, 68, 68, 0.6);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-delete:hover {
		background: rgba(239, 68, 68, 0.1);
		border-color: #ef4444;
		color: #ef4444;
	}

	/* Modal styles */
	.modal-text {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-sm);
	}

	.modal-note {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-bottom: var(--space-lg);
	}

	.modal-warning {
		font-size: var(--font-size-xs);
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
	}

	.btn-primary {
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

	.btn-secondary {
		padding: var(--space-sm) var(--space-lg);
		background: var(--bg-tertiary);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-secondary:hover { background: var(--bg-elevated); }

	.btn-danger {
		padding: var(--space-sm) var(--space-lg);
		background: #ef4444;
		color: white;
		font-size: var(--font-size-sm);
		font-weight: 600;
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.btn-danger:hover { background: #dc2626; }
	.btn-danger:disabled { opacity: 0.6; cursor: not-allowed; }

	@media (max-width: 768px) {
		.stats-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.table-container {
			overflow-x: auto;
		}

		table {
			min-width: 1000px;
		}
	}
</style>
