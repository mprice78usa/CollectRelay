<script lang="ts">
	import Badge from '$components/ui/Badge.svelte';

	let { data } = $props();

	let txn = $derived(data.transaction);
	let milestones = $derived(data.milestones || []);

	function statusVariant(status: string) {
		switch (status) {
			case 'pending': return 'default' as const;
			case 'submitted': return 'info' as const;
			case 'accepted': return 'success' as const;
			case 'rejected': return 'error' as const;
			case 'waived': return 'default' as const;
			default: return 'default' as const;
		}
	}

	function statusLabel(status: string) {
		return status.charAt(0).toUpperCase() + status.slice(1);
	}

	function txnStatusVariant(status: string) {
		switch (status) {
			case 'active': return 'info' as const;
			case 'in_review': return 'warning' as const;
			case 'completed': return 'success' as const;
			default: return 'default' as const;
		}
	}

	function formatDate(dateStr: string | null) {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	let completedCount = $derived(txn ? (txn as any).items.filter((i: any) => ['accepted', 'waived'].includes(i.status)).length : 0);
	let totalItems = $derived(txn ? (txn as any).items.length : 0);
	let progressPercent = $derived(totalItems > 0 ? (completedCount / totalItems) * 100 : 0);
</script>

<svelte:head>
	<title>{txn?.title ?? 'Partner Portal'} — CollectRelay</title>
</svelte:head>

{#if txn}
	<div class="partner-page">
		<div class="txn-header">
			<div class="txn-header-top">
				<h1>{txn.title}</h1>
				<Badge variant={txnStatusVariant(txn.status)}>{statusLabel(txn.status)}</Badge>
			</div>
			<p class="txn-client">Client: {txn.client_name}</p>
			{#if txn.due_date}
				<p class="txn-due">Due: {formatDate(txn.due_date)}</p>
			{/if}
		</div>

		<div class="section">
			<h2>Checklist Progress</h2>
			<div class="progress-row">
				<div class="progress-bar">
					<div class="progress-fill" style="width: {progressPercent}%"></div>
				</div>
				<span class="progress-label">{completedCount}/{totalItems} complete</span>
			</div>
			<div class="checklist">
				{#each (txn as any).items as item}
					<div class="checklist-item">
						<div class="item-status-dot" class:completed={item.status === 'accepted' || item.status === 'waived'} class:submitted={item.status === 'submitted'} class:pending={item.status === 'pending'}></div>
						<div class="item-info">
							<span class="item-name">{item.name}</span>
							{#if item.description}
								<span class="item-desc">{item.description}</span>
							{/if}
						</div>
						<Badge variant={statusVariant(item.status)}>{statusLabel(item.status)}</Badge>
					</div>
				{/each}
			</div>
		</div>

		{#if milestones.length > 0}
			<div class="section">
				<h2>Key Dates</h2>
				<div class="milestones-list">
					{#each milestones as ms}
						<div class="milestone-item" class:done={ms.completed}>
							<div class="ms-dot" class:ms-done={ms.completed}></div>
							<div class="ms-info">
								<span class="ms-label">{ms.label}</span>
								<span class="ms-date">{ms.date ? formatDate(ms.date) : 'TBD'}</span>
							</div>
							{#if ms.completed}
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round">
									<polyline points="20 6 9 17 4 12"/>
								</svg>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<div class="read-only-notice">
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			This is a read-only partner view. Contact the listing agent for changes.
		</div>
	</div>
{:else}
	<div class="no-data">
		<p>Transaction data not available.</p>
	</div>
{/if}

<style>
	.partner-page {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.txn-header {
		background: white;
		padding: 24px;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}

	.txn-header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 8px;
	}

	h1 {
		font-size: 22px;
		font-weight: 700;
		color: #18181b;
	}

	.txn-client, .txn-due {
		font-size: 14px;
		color: #64748b;
	}

	.section {
		background: white;
		padding: 24px;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}

	h2 {
		font-size: 16px;
		font-weight: 700;
		color: #18181b;
		margin-bottom: 16px;
	}

	.progress-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 20px;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: #f1f5f9;
		border-radius: 100px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #10b981;
		border-radius: 100px;
		transition: width 0.3s ease;
	}

	.progress-label {
		font-size: 13px;
		color: #64748b;
		white-space: nowrap;
	}

	.checklist {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: #f1f5f9;
		border-radius: 8px;
		overflow: hidden;
	}

	.checklist-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		background: white;
	}

	.item-status-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
		background: #d1d5db;
	}

	.item-status-dot.completed { background: #10b981; }
	.item-status-dot.submitted { background: #3b82f6; }
	.item-status-dot.pending { background: #d1d5db; }

	.item-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.item-name {
		font-size: 14px;
		font-weight: 500;
		color: #18181b;
	}

	.item-desc {
		font-size: 12px;
		color: #94a3b8;
	}

	.milestones-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.milestone-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 0;
		border-bottom: 1px solid #f1f5f9;
	}

	.milestone-item:last-child {
		border-bottom: none;
	}

	.ms-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid #d1d5db;
		flex-shrink: 0;
	}

	.ms-dot.ms-done {
		background: #10b981;
		border-color: #10b981;
	}

	.ms-info {
		flex: 1;
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.ms-label {
		font-size: 14px;
		font-weight: 500;
		color: #18181b;
	}

	.milestone-item.done .ms-label {
		text-decoration: line-through;
		color: #94a3b8;
	}

	.ms-date {
		font-size: 12px;
		color: #94a3b8;
	}

	.read-only-notice {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: #eff6ff;
		border: 1px solid #bfdbfe;
		border-radius: 8px;
		font-size: 13px;
		color: #3b82f6;
	}

	.no-data {
		text-align: center;
		padding: 48px;
		color: #64748b;
	}
</style>
