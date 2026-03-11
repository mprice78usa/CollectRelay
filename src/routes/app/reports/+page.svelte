<script lang="ts">
	import { goto } from '$app/navigation';
	import Card from '$components/ui/Card.svelte';

	let { data } = $props();

	const ranges = [
		{ value: '7d', label: '7 Days' },
		{ value: '30d', label: '30 Days' },
		{ value: '90d', label: '90 Days' },
		{ value: 'all', label: 'All Time' }
	];

	function setRange(range: string) {
		goto(`?range=${range}`, { replaceState: true });
	}

	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
	}

	function formatNumber(n: number): string {
		return new Intl.NumberFormat('en-US').format(n);
	}

	// Pipeline funnel — calculate max for bar widths
	let funnelEntries = $derived([
		{ label: 'Draft', count: data.funnel.draft, value: data.funnel.draft_value, color: 'var(--text-muted)' },
		{ label: 'Active', count: data.funnel.active, value: data.funnel.active_value, color: '#3b82f6' },
		{ label: 'In Review', count: data.funnel.in_review, value: data.funnel.in_review_value, color: '#f59e0b' },
		{ label: 'Completed', count: data.funnel.completed, value: data.funnel.completed_value, color: '#10b981' },
		{ label: 'Cancelled', count: data.funnel.cancelled, value: 0, color: '#ef4444' }
	]);
	let maxFunnelCount = $derived(Math.max(...funnelEntries.map((e) => e.count), 1));

	// Activity trends — calculate max for bar heights
	let maxTrendCount = $derived(Math.max(...(data.trends.map((t: { count: number }) => t.count) || [1]), 1));
</script>

<svelte:head>
	<title>Reports — CollectRelay</title>
</svelte:head>

<div class="reports-page">
	<div class="page-header">
		<div>
			<h1>Reports</h1>
			<p class="subtitle">Pipeline analytics and performance metrics</p>
		</div>
		<div class="header-actions">
			<a href="/app/reports/export?range={data.range}" class="btn btn-secondary" download>
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
				</svg>
				Export CSV
			</a>
		</div>
	</div>

	<!-- Date Range Tabs -->
	<div class="range-tabs">
		{#each ranges as r}
			<button
				class="range-tab"
				class:active={data.range === r.value}
				onclick={() => setRange(r.value)}
			>
				{r.label}
			</button>
		{/each}
	</div>

	<!-- Report Cards Grid -->
	<div class="reports-grid">
		<!-- Pipeline Funnel -->
		<Card>
			<div class="card-header">
				<h2>Pipeline Funnel</h2>
			</div>
			<div class="funnel-chart">
				{#each funnelEntries as entry}
					<div class="funnel-row">
						<div class="funnel-label">
							<span class="funnel-dot" style="background: {entry.color}"></span>
							<span>{entry.label}</span>
						</div>
						<div class="funnel-bar-wrap">
							<div
								class="funnel-bar"
								style="width: {(entry.count / maxFunnelCount) * 100}%; background: {entry.color}"
							></div>
						</div>
						<div class="funnel-values">
							<span class="funnel-count">{entry.count}</span>
							{#if entry.value > 0}
								<span class="funnel-amount">{formatCurrency(entry.value)}</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</Card>

		<!-- Commission Report -->
		<Card>
			<div class="card-header">
				<h2>Commission Tracker</h2>
			</div>
			<div class="commission-stats">
				<div class="stat-block earned">
					<div class="stat-value">{formatCurrency(data.commission.completed_commission)}</div>
					<div class="stat-label">Earned</div>
					<div class="stat-count">{data.commission.completed_count} closed</div>
				</div>
				<div class="stat-block pending">
					<div class="stat-value">{formatCurrency(data.commission.pending_commission)}</div>
					<div class="stat-label">Pending</div>
					<div class="stat-count">{data.commission.pending_count} active</div>
				</div>
				<div class="stat-block forecast">
					<div class="stat-value">{formatCurrency(data.commission.forecast_commission)}</div>
					<div class="stat-label">Forecast</div>
					<div class="stat-count">incl. drafts</div>
				</div>
			</div>
			{#if data.commission.completed_commission + data.commission.pending_commission + data.commission.forecast_commission > 0}
				{@const total = data.commission.completed_commission + data.commission.pending_commission + data.commission.forecast_commission}
				<div class="proportion-bar">
					<div class="proportion-segment earned" style="width: {(data.commission.completed_commission / total) * 100}%" title="Earned"></div>
					<div class="proportion-segment pending" style="width: {(data.commission.pending_commission / total) * 100}%" title="Pending"></div>
					<div class="proportion-segment forecast" style="width: {(data.commission.forecast_commission / total) * 100}%" title="Forecast"></div>
				</div>
			{/if}
		</Card>

		<!-- Completion Metrics -->
		<Card>
			<div class="card-header">
				<h2>Completion Metrics</h2>
			</div>
			<div class="metrics-grid">
				<div class="metric">
					<div class="metric-value">
						{#if data.metrics.avg_days_to_complete !== null}
							{data.metrics.avg_days_to_complete}
						{:else}
							—
						{/if}
					</div>
					<div class="metric-label">Avg days to close</div>
				</div>
				<div class="metric">
					<div class="metric-value">{data.metrics.avg_items_per_transaction}</div>
					<div class="metric-label">Avg items / txn</div>
				</div>
				<div class="metric">
					<div class="metric-value">{formatNumber(data.metrics.total_completed)}</div>
					<div class="metric-label">Total completed</div>
				</div>
			</div>
		</Card>

		<!-- Activity Trends -->
		<Card>
			<div class="card-header">
				<h2>Activity Trends</h2>
				<span class="trend-period">{data.range === '7d' ? 'Weekly' : 'Monthly'}</span>
			</div>
			{#if data.trends.length === 0}
				<div class="empty-state">No activity data for this period</div>
			{:else}
				<div class="trend-chart">
					{#each data.trends as trend}
						<div class="trend-col">
							<div class="trend-bar-wrap">
								<div
									class="trend-bar"
									style="height: {(trend.count / maxTrendCount) * 100}%"
								></div>
							</div>
							<div class="trend-count">{trend.count}</div>
							<div class="trend-label">{trend.period.length > 7 ? trend.period.slice(5) : trend.period.slice(5)}</div>
						</div>
					{/each}
				</div>
			{/if}
		</Card>
	</div>
</div>

<style>
	.reports-page {
		max-width: 1000px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-lg);
	}

	.page-header h1 {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.subtitle {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		margin-top: var(--space-xs);
	}

	.header-actions {
		display: flex;
		gap: var(--space-sm);
	}

	.btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		text-decoration: none;
		cursor: pointer;
		border: none;
		transition: all var(--transition-fast);
	}

	.btn-secondary {
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
	}

	.btn-secondary:hover {
		background: var(--bg-secondary);
		color: var(--text-primary);
	}

	/* Range Tabs */
	.range-tabs {
		display: flex;
		gap: var(--space-xs);
		margin-bottom: var(--space-xl);
		background: var(--bg-secondary);
		padding: 3px;
		border-radius: var(--radius-md);
		width: fit-content;
	}

	.range-tab {
		padding: var(--space-xs) var(--space-lg);
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.range-tab:hover {
		color: var(--text-primary);
	}

	.range-tab.active {
		background: var(--bg-primary);
		color: var(--text-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	/* Reports Grid */
	.reports-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-lg);
	}

	.card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-lg);
	}

	.card-header h2 {
		font-size: var(--font-size-md);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
	}

	/* Pipeline Funnel */
	.funnel-chart {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.funnel-row {
		display: grid;
		grid-template-columns: 100px 1fr auto;
		gap: var(--space-md);
		align-items: center;
	}

	.funnel-label {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.funnel-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.funnel-bar-wrap {
		height: 24px;
		background: var(--bg-secondary);
		border-radius: var(--radius-sm);
		overflow: hidden;
	}

	.funnel-bar {
		height: 100%;
		border-radius: var(--radius-sm);
		min-width: 2px;
		transition: width 0.4s ease;
	}

	.funnel-values {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		min-width: 80px;
	}

	.funnel-count {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-primary);
	}

	.funnel-amount {
		font-size: 11px;
		color: var(--text-muted);
	}

	/* Commission Report */
	.commission-stats {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.stat-block {
		text-align: center;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		background: var(--bg-secondary);
	}

	.stat-value {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: var(--space-xs);
	}

	.stat-label {
		font-size: var(--font-size-sm);
		font-weight: 600;
		margin-bottom: 2px;
	}

	.stat-block.earned .stat-label { color: #10b981; }
	.stat-block.pending .stat-label { color: #f59e0b; }
	.stat-block.forecast .stat-label { color: #3b82f6; }

	.stat-count {
		font-size: 11px;
		color: var(--text-muted);
	}

	.proportion-bar {
		display: flex;
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		background: var(--bg-secondary);
	}

	.proportion-segment {
		transition: width 0.4s ease;
	}

	.proportion-segment.earned { background: #10b981; }
	.proportion-segment.pending { background: #f59e0b; }
	.proportion-segment.forecast { background: #3b82f6; }

	/* Completion Metrics */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-md);
	}

	.metric {
		text-align: center;
		padding: var(--space-lg) var(--space-md);
	}

	.metric-value {
		font-size: 28px;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
		margin-bottom: var(--space-sm);
	}

	.metric-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	/* Activity Trends */
	.trend-period {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.trend-chart {
		display: flex;
		align-items: flex-end;
		gap: var(--space-sm);
		height: 160px;
		padding-top: var(--space-md);
	}

	.trend-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}

	.trend-bar-wrap {
		flex: 1;
		width: 100%;
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}

	.trend-bar {
		width: 70%;
		max-width: 40px;
		background: var(--color-accent);
		border-radius: var(--radius-sm) var(--radius-sm) 0 0;
		min-height: 4px;
		transition: height 0.4s ease;
	}

	.trend-count {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-primary);
		margin-top: var(--space-xs);
	}

	.trend-label {
		font-size: 10px;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.empty-state {
		text-align: center;
		padding: var(--space-xxl);
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	@media (max-width: 768px) {
		.reports-grid {
			grid-template-columns: 1fr;
		}

		.page-header {
			flex-direction: column;
			gap: var(--space-md);
		}

		.funnel-row {
			grid-template-columns: 80px 1fr auto;
		}

		.commission-stats {
			grid-template-columns: 1fr;
		}

		.metrics-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
