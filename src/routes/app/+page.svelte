<script lang="ts">
	import Card from '$components/ui/Card.svelte';
	import Badge from '$components/ui/Badge.svelte';

	let { data } = $props();

	const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
		active: { label: 'Active', variant: 'success' },
		in_review: { label: 'In Review', variant: 'warning' },
		completed: { label: 'Completed', variant: 'info' },
		cancelled: { label: 'Cancelled', variant: 'error' },
		draft: { label: 'Draft', variant: 'default' }
	};

	const actionLabels: Record<string, string> = {
		file_uploaded: 'uploaded a file',
		item_accepted: 'accepted an item',
		item_rejected: 'rejected an item',
		item_waived: 'waived an item',
		answer_submitted: 'submitted an answer',
		magic_link_sent: 'sent a client link',
		status_changed: 'changed status',
		transaction_created: 'created transaction'
	};

	const actionIcons: Record<string, { path: string; color: string }> = {
		file_uploaded: { path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12', color: '#3b82f6' },
		item_accepted: { path: 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3', color: '#10b981' },
		item_rejected: { path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M15 9l-6 6 M9 9l6 6', color: '#ef4444' },
		item_waived: { path: 'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11', color: '#8b5cf6' },
		answer_submitted: { path: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z', color: '#f59e0b' },
		magic_link_sent: { path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6', color: '#06b6d4' },
		status_changed: { path: 'M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15', color: '#8b5cf6' },
		transaction_created: { path: 'M12 5v14 M5 12h14', color: '#10b981' }
	};

	function formatRelativeTime(iso: string): string {
		const now = Date.now();
		const then = new Date(iso).getTime();
		const diff = now - then;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short', day: 'numeric'
		});
	}

	function progressPercent(completed: number, total: number): number {
		if (total === 0) return 0;
		return Math.round((completed / total) * 100);
	}

	function formatCurrency(value: number | null): string {
		if (value == null || value === 0) return '$0';
		if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
		if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
		return '$' + value.toLocaleString();
	}

	function formatCurrencyFull(value: number | null): string {
		if (value == null) return '—';
		return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
	}

	function riskLevel(sale: any): 'green' | 'yellow' | 'red' {
		const pct = sale.item_count > 0 ? (sale.completed_count / sale.item_count) * 100 : 0;
		const now = Date.now();
		const dueDate = sale.due_date ? new Date(sale.due_date).getTime() : null;
		const lastUpdate = new Date(sale.updated_at).getTime();
		const daysSinceUpdate = (now - lastUpdate) / 86400000;

		// Red: past due or no activity in 7+ days
		if (dueDate && now > dueDate) return 'red';
		if (daysSinceUpdate > 7) return 'red';

		// Yellow: progress <50% with due date within 7 days, or has rejected items
		if (dueDate && (dueDate - now) < 7 * 86400000 && pct < 50) return 'yellow';

		return 'green';
	}
</script>

<svelte:head>
	<title>Dashboard — CollectRelay</title>
</svelte:head>

<div class="dashboard">
	<div class="page-header">
		<div>
			<h1>Dashboard</h1>
			<p class="subtitle">Overview of your document collection activity.</p>
		</div>
		<a href="/app/transactions/new" class="btn-primary">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			New Transaction
		</a>
	</div>

	<!-- Stats Row -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon stat-active">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{data.counts.active}</span>
				<span class="stat-label">Active</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-review">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{data.counts.pending_review}</span>
				<span class="stat-label">In Review</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-completed">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{data.counts.completed}</span>
				<span class="stat-label">Completed</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-total">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{data.counts.total}</span>
				<span class="stat-label">Total</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-pipeline">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{formatCurrency(data.pipelineValue)}</span>
				<span class="stat-label">Pipeline Value</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-commission">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{formatCurrency(data.totalCommission)}</span>
				<span class="stat-label">Expected Commissions</span>
			</div>
		</div>
	</div>

	<!-- Pending Sales Panel -->
	{#if data.pendingSales && data.pendingSales.length > 0}
		<div class="panel pending-sales-panel">
			<div class="panel-header">
				<h2>Pending Sales</h2>
				<a href="/app/transactions" class="panel-link">View all</a>
			</div>
			<div class="sales-table">
				<div class="sales-table-header">
					<span class="col-health"></span>
					<span class="col-title">Transaction</span>
					<span class="col-client">Client</span>
					<span class="col-price">Sale Price</span>
					<span class="col-commission">Commission</span>
					<span class="col-progress">Progress</span>
					<span class="col-status">Status</span>
				</div>
				{#each data.pendingSales as sale}
					{@const risk = riskLevel(sale)}
					<a href="/app/transactions/{sale.id}" class="sales-row">
						<span class="col-health">
							<span class="risk-dot risk-{risk}" title="{risk === 'red' ? 'At risk' : risk === 'yellow' ? 'Needs attention' : 'On track'}"></span>
						</span>
						<span class="col-title sale-title">{sale.title}</span>
						<span class="col-client sale-client">{sale.client_name}</span>
						<span class="col-price">{formatCurrencyFull(sale.sale_price)}</span>
						<span class="col-commission">{formatCurrencyFull(sale.commission_amount)}</span>
						<span class="col-progress">
							<div class="progress-bar-mini">
								<div class="progress-fill-mini" style="width: {progressPercent(sale.completed_count, sale.item_count)}%"></div>
							</div>
							<span class="progress-text-mini">{sale.completed_count}/{sale.item_count}</span>
						</span>
						<span class="col-status">
							<Badge variant={statusConfig[sale.status]?.variant ?? 'default'}>
								{statusConfig[sale.status]?.label ?? sale.status}
							</Badge>
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<div class="dashboard-grid">
		<!-- Recent Transactions -->
		<div class="panel">
			<div class="panel-header">
				<h2>Recent Transactions</h2>
				<a href="/app/transactions" class="panel-link">View all</a>
			</div>
			{#if data.recentTransactions.length === 0}
				<div class="panel-empty">
					<p>No transactions yet.</p>
					<a href="/app/transactions/new" class="empty-action">Create your first transaction</a>
				</div>
			{:else}
				<div class="transactions-list">
					{#each data.recentTransactions as txn}
						<a href="/app/transactions/{txn.id}" class="txn-row">
							<div class="txn-info">
								<span class="txn-title">{txn.title}</span>
								<span class="txn-client">{txn.client_name}</span>
							</div>
							<div class="txn-progress">
								<div class="progress-bar-mini">
									<div class="progress-fill-mini" style="width: {progressPercent(txn.completed_count, txn.item_count)}%"></div>
								</div>
								<span class="progress-text-mini">{txn.completed_count}/{txn.item_count}</span>
							</div>
							<div class="txn-status">
								<Badge variant={statusConfig[txn.status]?.variant ?? 'default'}>
									{statusConfig[txn.status]?.label ?? txn.status}
								</Badge>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Activity Feed -->
		<div class="panel">
			<div class="panel-header">
				<h2>Recent Activity</h2>
			</div>
			{#if data.recentActivity.length === 0}
				<div class="panel-empty">
					<p>No activity yet. Events will appear here as you and your clients interact.</p>
				</div>
			{:else}
				<div class="activity-feed">
					{#each data.recentActivity as event}
						{@const icon = actionIcons[event.action] ?? { path: 'M12 5v14 M5 12h14', color: '#6b7280' }}
						<div class="activity-item">
							<div class="activity-icon" style="background: {icon.color}20; color: {icon.color}">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d={icon.path} />
								</svg>
							</div>
							<div class="activity-content">
								<p class="activity-text">
									<strong>{event.actor_name}</strong>
									{actionLabels[event.action] ?? event.action}
								</p>
								<p class="activity-context">
									<a href="/app/transactions/{event.transaction_id}" class="activity-link">{event.transaction_title}</a>
									<span class="activity-time">{formatRelativeTime(event.created_at)}</span>
								</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Mortgage Rates Ticker -->
	{#if data.mortgageRates}
		<div class="rates-ticker">
			<div class="rates-header">
				<div class="rates-title-row">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
					</svg>
					<h3>Mortgage Rates</h3>
				</div>
				<span class="rates-source">Freddie Mac PMMS</span>
			</div>
			<div class="rates-values">
				<div class="rate-item">
					<span class="rate-label">30-Year Fixed</span>
					<span class="rate-value">{data.mortgageRates.rate_30yr?.toFixed(2) ?? '—'}%</span>
				</div>
				<div class="rate-divider"></div>
				<div class="rate-item">
					<span class="rate-label">15-Year Fixed</span>
					<span class="rate-value">{data.mortgageRates.rate_15yr?.toFixed(2) ?? '—'}%</span>
				</div>
			</div>
			{#if data.mortgageRates.updated_at}
				<span class="rates-updated">Updated {formatDate(data.mortgageRates.updated_at)}</span>
			{/if}
		</div>
	{/if}

	<!-- Quick Actions -->
	<div class="quick-actions">
		<a href="/app/transactions/new" class="action-card">
			<div class="action-icon action-new">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</div>
			<span class="action-label">New Transaction</span>
			<span class="action-desc">Start collecting documents from a client</span>
		</a>
		<a href="/app/templates" class="action-card">
			<div class="action-icon action-templates">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
					<rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
				</svg>
			</div>
			<span class="action-label">Manage Templates</span>
			<span class="action-desc">Create and edit reusable checklists</span>
		</a>
		<a href="/app/transactions" class="action-card">
			<div class="action-icon action-view">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
				</svg>
			</div>
			<span class="action-label">All Transactions</span>
			<span class="action-desc">View and manage all client transactions</span>
		</a>
	</div>
</div>

<style>
	.dashboard {
		max-width: 1000px;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	h1 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.subtitle {
		color: var(--text-secondary);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-lg);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
		white-space: nowrap;
	}

	.btn-primary:hover { background: var(--color-accent-hover); color: var(--text-inverse); }

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
	}

	.stat-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.stat-active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
	.stat-review { background: rgba(234, 179, 8, 0.15); color: #eab308; }
	.stat-completed { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
	.stat-total { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
	.stat-pipeline { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
	.stat-commission { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* Dashboard Grid */
	.dashboard-grid {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.panel {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg) var(--space-lg) var(--space-md);
	}

	.panel-header h2 {
		font-size: var(--font-size-md);
		font-weight: 600;
	}

	.panel-link {
		font-size: var(--font-size-xs);
		color: var(--color-accent);
		font-weight: 500;
	}

	.panel-link:hover { text-decoration: underline; }

	.panel-empty {
		padding: var(--space-xxl) var(--space-lg);
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.empty-action {
		display: inline-block;
		margin-top: var(--space-sm);
		color: var(--color-accent);
		font-weight: 500;
	}

	/* Transactions List */
	.transactions-list {
		display: flex;
		flex-direction: column;
	}

	.txn-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--border-color);
		transition: background var(--transition-fast);
		color: var(--text-primary);
	}

	.txn-row:hover { background: var(--bg-tertiary); }

	.txn-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.txn-title {
		font-size: var(--font-size-sm);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.txn-client {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.txn-progress {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
		width: 100px;
	}

	.progress-bar-mini {
		flex: 1;
		height: 4px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-fill-mini {
		height: 100%;
		background: var(--color-accent);
		border-radius: var(--radius-full);
		transition: width 0.3s ease;
	}

	.progress-text-mini {
		font-size: 11px;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.txn-status {
		flex-shrink: 0;
	}

	/* Activity Feed */
	.activity-feed {
		display: flex;
		flex-direction: column;
	}

	.activity-item {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		border-top: 1px solid var(--border-color);
	}

	.activity-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-text {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		line-height: 1.4;
	}

	.activity-text strong {
		font-weight: 600;
	}

	.activity-context {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: 2px;
	}

	.activity-link {
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 180px;
	}

	.activity-link:hover { color: var(--color-accent); }

	.activity-time {
		white-space: nowrap;
		flex-shrink: 0;
	}

	.activity-time::before {
		content: '·';
		margin-right: var(--space-sm);
	}

	/* Quick Actions */
	.quick-actions {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-md);
	}

	.action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xl) var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		text-align: center;
		transition: all var(--transition-fast);
		color: var(--text-primary);
	}

	.action-card:hover {
		border-color: var(--color-accent);
		background: var(--bg-tertiary);
		transform: translateY(-2px);
	}

	.action-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
	}

	.action-new { background: rgba(16, 185, 129, 0.15); color: #10b981; }
	.action-templates { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
	.action-view { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }

	.action-label {
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	.action-desc {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: 1.4;
	}

	/* Pending Sales */
	.pending-sales-panel {
		margin-bottom: var(--space-xl);
	}

	.sales-table {
		overflow-x: auto;
	}

	.sales-table-header {
		display: grid;
		grid-template-columns: 30px 1.5fr 1fr 0.8fr 0.8fr 120px 90px;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		border-top: 1px solid var(--border-color);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}

	.sales-row {
		display: grid;
		grid-template-columns: 30px 1.5fr 1fr 0.8fr 0.8fr 120px 90px;
		gap: var(--space-sm);
		align-items: center;
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--border-color);
		color: var(--text-primary);
		transition: background var(--transition-fast);
		font-size: var(--font-size-sm);
	}

	.sales-row:hover {
		background: var(--bg-tertiary);
	}

	.col-health {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.risk-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.risk-green {
		background: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
	}

	.risk-yellow {
		background: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
		animation: pulse-risk 2s ease-in-out infinite;
	}

	.risk-red {
		background: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
		animation: pulse-risk 1.5s ease-in-out infinite;
	}

	@keyframes pulse-risk {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.sale-title {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sale-client {
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.col-progress {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	/* Mortgage Rates Ticker */
	.rates-ticker {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.rates-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-md);
	}

	.rates-title-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-primary);
	}

	.rates-title-row h3 {
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	.rates-source {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.rates-values {
		display: flex;
		align-items: center;
		gap: var(--space-xl);
	}

	.rate-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.rate-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.rate-value {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.rate-divider {
		width: 1px;
		height: 36px;
		background: var(--border-color);
	}

	.rates-updated {
		display: block;
		margin-top: var(--space-sm);
		font-size: 11px;
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.stats-grid { grid-template-columns: repeat(2, 1fr); }
		.dashboard-grid { grid-template-columns: 1fr; }
		.quick-actions { grid-template-columns: 1fr; }
		.sales-table-header { display: none; }
		.sales-row {
			grid-template-columns: 30px 1fr;
			grid-template-rows: auto auto;
		}
		.col-price, .col-commission, .col-progress, .col-status, .col-client { display: none; }
	}
</style>
