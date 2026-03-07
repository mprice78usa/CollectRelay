<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$components/ui/Badge.svelte';

	let { data } = $props();

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
		single: 'Single',
		team5: 'Team 5',
		team10: 'Team 10',
		team25: 'Team 25'
	};
</script>

<svelte:head>
	<title>Admin — CollectRelay</title>
</svelte:head>

<div class="admin-page">
	<h1>Admin Dashboard</h1>
	<p class="subtitle">User management and billing overview.</p>

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
	</div>

	<!-- Users Table -->
	<div class="table-container">
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Email</th>
					<th>Company</th>
					<th>Signed Up</th>
					<th>Plan</th>
					<th>Status</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.users as user}
					{@const status = trialStatus(user)}
					<tr class:revoked={!!user.disabled_at}>
						<td class="cell-name">{user.name}</td>
						<td class="cell-email">{user.email}</td>
						<td class="cell-company">{user.company || '—'}</td>
						<td class="cell-date">{formatDate(user.created_at)}</td>
						<td>
							<Badge variant={user.subscription_status === 'active' ? 'success' : 'default'}>
								{planNames[user.plan_key] || user.plan_key}
							</Badge>
						</td>
						<td>
							<Badge variant={status.variant}>{status.label}</Badge>
						</td>
						<td class="cell-actions">
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
						</td>
					</tr>
				{/each}
				{#if data.users.length === 0}
					<tr>
						<td colspan="7" class="empty-row">No users found.</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<style>
	.admin-page {
		max-width: 1100px;
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

	/* Stats */
	.stats-row {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-lg);
		margin-bottom: var(--space-xxl);
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
		padding: var(--space-md) var(--space-lg);
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		border-bottom: 1px solid var(--border-color);
		background: var(--bg-tertiary);
	}

	td {
		padding: var(--space-md) var(--space-lg);
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

	.cell-actions {
		white-space: nowrap;
	}

	.empty-row {
		text-align: center;
		color: var(--text-muted);
		padding: var(--space-xxl) !important;
	}

	/* Action buttons */
	.btn-revoke {
		padding: 4px 12px;
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
		padding: 4px 12px;
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

	@media (max-width: 768px) {
		.stats-row {
			grid-template-columns: repeat(2, 1fr);
		}

		.table-container {
			overflow-x: auto;
		}

		table {
			min-width: 700px;
		}
	}
</style>
