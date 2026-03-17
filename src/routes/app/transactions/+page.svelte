<script lang="ts">
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { getTerms } from '$lib/terminology';

	let { data } = $props();

	let terms = $derived(getTerms(data.industry));

	// Multi-select state
	let selectedIds = $state<Set<string>>(new Set());
	let bulkLoading = $state<string | null>(null);

	let visibleIds = $derived(data.transactions.map((t: any) => t.id));
	let allSelected = $derived(
		visibleIds.length > 0 && visibleIds.every((id: string) => selectedIds.has(id))
	);
	let someSelected = $derived(selectedIds.size > 0);
	let selectedCount = $derived(selectedIds.size);

	function toggleSelect(id: string, e: Event) {
		e.preventDefault();
		e.stopPropagation();
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id); else next.add(id);
		selectedIds = next;
	}

	function toggleAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(visibleIds);
		}
	}

	// Clear selection when data changes (tab switch)
	$effect(() => {
		data.statusFilter;
		selectedIds = new Set();
	});

	// Bulk actions via API
	async function bulkAction(action: string) {
		if (selectedIds.size === 0) return;

		const t = terms.transactions.toLowerCase();
		const messages: Record<string, string> = {
			remind: `Send reminders to ${selectedCount} ${t}?`,
			mark_in_review: `Mark ${selectedCount} ${t} as In Review?`,
			mark_complete: `Mark ${selectedCount} ${t} as Complete?`,
			cancel: `Cancel ${selectedCount} ${t}?`,
			revive: `Revive ${selectedCount} ${t}?`,
			delete: `Permanently delete ${selectedCount} ${t}? This cannot be undone.`
		};

		if (!confirm(messages[action] || `Perform ${action} on ${selectedCount} ${t}?`)) return;

		bulkLoading = action;
		try {
			const res = await fetch('/api/transactions/bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action, transactionIds: [...selectedIds] })
			});

			if (res.ok) {
				selectedIds = new Set();
				await invalidateAll();
			}
		} finally {
			bulkLoading = null;
		}
	}

	async function bulkDownload() {
		if (selectedIds.size === 0) return;
		bulkLoading = 'download';
		try {
			const res = await fetch('/api/transactions/bulk-download', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ transactionIds: [...selectedIds] })
			});
			if (res.ok) {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = 'CollectRelay_Documents.zip';
				a.click();
				URL.revokeObjectURL(url);
			}
		} finally {
			bulkLoading = null;
		}
	}

	// Determine which bulk actions to show based on current tab
	function getBulkActions(filter: string) {
		switch (filter) {
			case 'active': return ['remind', 'mark_in_review', 'cancel', 'download'];
			case 'in_review': return ['mark_complete', 'cancel', 'download'];
			case 'completed': return ['download'];
			case 'cancelled': return ['revive', 'delete'];
			default: return ['remind', 'mark_in_review', 'mark_complete', 'cancel', 'download'];
		}
	}

	const bulkActionLabels: Record<string, string> = {
		remind: 'Send Reminder',
		mark_in_review: 'Mark In Review',
		mark_complete: 'Mark Complete',
		cancel: 'Cancel',
		revive: 'Revive',
		delete: 'Delete Forever',
		download: 'Download All'
	};

	const statusTabs = [
		{ label: 'All', value: 'all' },
		{ label: 'Active', value: 'active' },
		{ label: 'In Review', value: 'in_review' },
		{ label: 'Completed', value: 'completed' },
		{ label: 'Cancelled', value: 'cancelled' }
	];

	function statusVariant(status: string) {
		switch (status) {
			case 'draft': return 'default' as const;
			case 'active': return 'info' as const;
			case 'in_review': return 'warning' as const;
			case 'completed': return 'success' as const;
			case 'cancelled': return 'error' as const;
			default: return 'default' as const;
		}
	}

	function statusLabel(status: string) {
		switch (status) {
			case 'in_review': return 'In Review';
			default: return status.charAt(0).toUpperCase() + status.slice(1);
		}
	}

	function formatDate(dateStr: string | null) {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function dueStatus(dueDate: string | null, status: string) {
		if (!dueDate || status === 'completed' || status === 'cancelled') return '';
		const due = new Date(dueDate);
		const now = new Date();
		const diff = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
		if (diff < 0) return 'overdue';
		if (diff <= 3) return 'due-soon';
		return '';
	}
</script>

<svelte:head>
	<title>{terms.transactions} — CollectRelay</title>
</svelte:head>

<div class="transactions-page">
	<div class="page-header">
		<div>
			<h1>{terms.transactions}</h1>
			<p class="subtitle">{terms.trackSubtitle}</p>
		</div>
		<a href="/app/transactions/new" class="btn-primary">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			{terms.newTransaction}
		</a>
	</div>

	<div class="filter-tabs">
		{#each statusTabs as tab}
			<a
				href={tab.value === 'all' ? '/app/transactions' : `/app/transactions?status=${tab.value}`}
				class="filter-tab"
				class:active={data.statusFilter === tab.value}
			>
				{tab.label}
			</a>
		{/each}
	</div>

	{#if data.transactions.length === 0}
		<EmptyState message={data.statusFilter === 'cancelled' ? `No cancelled ${terms.transactions.toLowerCase()}.` : data.statusFilter === 'all' ? `No ${terms.transactions.toLowerCase()} yet. Create one to get started.` : `No ${data.statusFilter.replace('_', ' ')} ${terms.transactions.toLowerCase()}.`} />
	{:else}
		<!-- Select all row -->
		<div class="select-all-row">
			<label class="select-checkbox" onclick={(e) => e.stopPropagation()}>
				<input
					type="checkbox"
					checked={allSelected}
					indeterminate={someSelected && !allSelected}
					onchange={toggleAll}
				/>
				<span class="select-label">
					{#if someSelected}
						{selectedCount} selected
					{:else}
						Select all
					{/if}
				</span>
			</label>
		</div>

		<div class="transaction-list">
			{#each data.transactions as txn}
				{#if txn.status === 'cancelled'}
					<div class="transaction-card cancelled-card" class:selected={selectedIds.has(txn.id)}>
						<label class="card-checkbox" onclick={(e) => e.stopPropagation()}>
							<input
								type="checkbox"
								checked={selectedIds.has(txn.id)}
								onchange={(e) => toggleSelect(txn.id, e)}
							/>
						</label>
						<div class="card-body">
							<div class="card-top">
								<div class="card-title-row">
									<div class="title-with-badge">
										<a href="/app/transactions/{txn.id}" class="txn-title-link"><h3>{txn.title}</h3></a>
									</div>
									<Badge variant="error">Cancelled</Badge>
								</div>
								<p class="client-name">{txn.client_name} · {txn.client_email}</p>
							</div>
							<div class="card-bottom">
								<span class="cancelled-date">Cancelled {formatDate(txn.updated_at)}</span>
								<div class="cancelled-actions">
									<form method="POST" action="?/revive" use:enhance>
										<input type="hidden" name="transactionId" value={txn.id} />
										<button type="submit" class="btn-revive">
											<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
											</svg>
											Revive
										</button>
									</form>
									<form method="POST" action="?/delete" use:enhance>
										<input type="hidden" name="transactionId" value={txn.id} />
										<button type="submit" class="btn-delete-forever" onclick={(e) => { if (!confirm(`Permanently delete this ${terms.transaction.toLowerCase()}? This cannot be undone.`)) e.preventDefault(); }}>
											<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
											</svg>
											Delete Forever
										</button>
									</form>
								</div>
							</div>
						</div>
					</div>
				{:else}
					<div class="transaction-card" class:selected={selectedIds.has(txn.id)}>
						<label class="card-checkbox" onclick={(e) => e.stopPropagation()}>
							<input
								type="checkbox"
								checked={selectedIds.has(txn.id)}
								onchange={(e) => toggleSelect(txn.id, e)}
							/>
						</label>
						<a href="/app/transactions/{txn.id}" class="card-body card-link">
							<div class="card-top">
								<div class="card-title-row">
									<div class="title-with-badge">
										<h3>{txn.title}</h3>
										{#if data.unseenCounts[txn.id]}
											<span class="unseen-badge">{data.unseenCounts[txn.id]} new</span>
										{/if}
									</div>
									<Badge variant={statusVariant(txn.status)}>{statusLabel(txn.status)}</Badge>
								</div>
								<p class="client-name">{txn.client_name} · {txn.client_email}</p>
							</div>
							<div class="card-bottom">
								<div class="progress-section">
									<div class="progress-bar">
										<div
											class="progress-fill"
											style="width: {txn.item_count > 0 ? (txn.completed_count / txn.item_count) * 100 : 0}%"
										></div>
									</div>
									<span class="progress-label">{txn.completed_count}/{txn.item_count} {terms.itemsProgress}</span>
								</div>
								<div class="card-meta">
									{#if txn.due_date}
										<span class="due-date {dueStatus(txn.due_date, txn.status)}">
											Due {formatDate(txn.due_date)}
										</span>
									{/if}
									<span class="created">Created {formatDate(txn.created_at)}</span>
								</div>
							</div>
						</a>
					</div>
				{/if}
			{/each}
		</div>
	{/if}

	<!-- Bulk action bar -->
	{#if someSelected}
		<div class="bulk-bar">
			<div class="bulk-bar-inner">
				<span class="bulk-count">{selectedCount} selected</span>
				<div class="bulk-actions">
					{#each getBulkActions(data.statusFilter) as action}
						{#if action === 'download'}
							<button
								class="bulk-btn"
								onclick={bulkDownload}
								disabled={bulkLoading !== null}
							>
								{bulkLoading === 'download' ? 'Downloading...' : 'Download All'}
							</button>
						{:else}
							<button
								class="bulk-btn"
								class:bulk-btn-danger={action === 'delete' || action === 'cancel'}
								onclick={() => bulkAction(action)}
								disabled={bulkLoading !== null}
							>
								{bulkLoading === action ? '...' : bulkActionLabels[action]}
							</button>
						{/if}
					{/each}
				</div>
				<button class="bulk-clear" onclick={() => selectedIds = new Set()}>
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
					</svg>
				</button>
			</div>
		</div>
	{/if}
</div>

<style>
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

	.filter-tabs {
		display: flex;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
		border-bottom: 1px solid var(--border-color);
		padding-bottom: var(--space-xs);
		overflow-x: auto;
	}

	.filter-tab {
		padding: var(--space-sm) var(--space-lg);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border-radius: var(--radius-md) var(--radius-md) 0 0;
		transition: color var(--transition-fast), background var(--transition-fast);
		border-bottom: 2px solid transparent;
		margin-bottom: -1px;
		white-space: nowrap;
	}

	.filter-tab:hover {
		color: var(--text-primary);
	}

	.filter-tab.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
	}

	/* Select all row */
	.select-all-row {
		display: flex;
		align-items: center;
		padding: var(--space-sm) var(--space-md);
		margin-bottom: var(--space-sm);
	}

	.select-checkbox {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		cursor: pointer;
		user-select: none;
	}

	.select-checkbox input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--color-accent);
		cursor: pointer;
	}

	.select-label {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.transaction-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding-bottom: 80px; /* Space for bulk bar */
	}

	.transaction-card {
		display: flex;
		align-items: stretch;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
	}

	.transaction-card:hover {
		border-color: var(--border-color-hover, var(--color-accent));
		box-shadow: var(--shadow-sm);
	}

	.transaction-card.selected {
		border-color: var(--color-accent);
		background: rgba(16, 185, 129, 0.04);
	}

	.card-checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 44px;
		min-width: 44px;
		cursor: pointer;
		border-right: 1px solid var(--border-color);
		transition: background var(--transition-fast);
	}

	.card-checkbox:hover {
		background: var(--bg-tertiary);
	}

	.card-checkbox input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--color-accent);
		cursor: pointer;
	}

	.card-body {
		flex: 1;
		padding: var(--space-lg);
		min-width: 0;
	}

	.card-link {
		display: block;
		color: inherit;
	}

	.card-link:hover {
		color: inherit;
	}

	.cancelled-card {
		opacity: 0.75;
		border-style: dashed;
	}

	.cancelled-card:hover {
		opacity: 1;
	}

	.card-top {
		margin-bottom: var(--space-md);
	}

	.card-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-xs);
	}

	.title-with-badge {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-width: 0;
	}

	.card-title-row h3 {
		font-size: var(--font-size-md);
		font-weight: 600;
		color: var(--text-primary);
	}

	.txn-title-link {
		text-decoration: none;
	}

	.txn-title-link:hover h3 {
		color: var(--color-accent);
	}

	.unseen-badge {
		display: inline-flex;
		align-items: center;
		padding: 2px 10px;
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
		font-size: 12px;
		font-weight: 700;
		border-radius: var(--radius-full);
		white-space: nowrap;
	}

	.client-name {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
	}

	.card-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-lg);
	}

	.progress-section {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
		max-width: 240px;
	}

	.progress-bar {
		flex: 1;
		height: 6px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: var(--radius-full);
		transition: width var(--transition-normal);
	}

	.progress-label {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		white-space: nowrap;
	}

	.card-meta {
		display: flex;
		align-items: center;
		gap: var(--space-lg);
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	.due-date.overdue {
		color: var(--color-error);
		font-weight: 600;
	}

	.due-date.due-soon {
		color: var(--color-warning);
		font-weight: 600;
	}

	/* Cancelled transaction styles */
	.cancelled-date {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	.cancelled-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.btn-revive {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 6px 14px;
		background: transparent;
		color: var(--color-success);
		border: 1px solid var(--color-success);
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.btn-revive:hover {
		background: var(--color-success);
		color: #fff;
	}

	.btn-delete-forever {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 6px 14px;
		background: transparent;
		color: var(--color-error);
		border: 1px solid var(--color-error);
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.btn-delete-forever:hover {
		background: var(--color-error);
		color: #fff;
	}

	/* Bulk action bar */
	.bulk-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 100;
		padding: var(--space-md) var(--space-xl);
		background: rgba(13, 13, 26, 0.92);
		backdrop-filter: blur(12px);
		border-top: 1px solid var(--border-color);
	}

	.bulk-bar-inner {
		max-width: 960px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.bulk-count {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-accent);
		white-space: nowrap;
	}

	.bulk-actions {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
		flex: 1;
	}

	.bulk-btn {
		display: inline-flex;
		align-items: center;
		padding: 6px 14px;
		background: var(--bg-secondary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast), border-color var(--transition-fast);
		white-space: nowrap;
	}

	.bulk-btn:hover:not(:disabled) {
		background: var(--bg-tertiary);
		border-color: var(--color-accent);
	}

	.bulk-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.bulk-btn-danger {
		color: var(--color-error);
		border-color: var(--color-error);
	}

	.bulk-btn-danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.1);
		border-color: var(--color-error);
	}

	.bulk-clear {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: transparent;
		color: var(--text-secondary);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: color var(--transition-fast), background var(--transition-fast);
		margin-left: auto;
	}

	.bulk-clear:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	@media (max-width: 640px) {
		.card-bottom {
			flex-direction: column;
			align-items: flex-start;
		}

		.progress-section {
			max-width: 100%;
			width: 100%;
		}

		.page-header {
			flex-direction: column;
		}

		.cancelled-actions {
			width: 100%;
			justify-content: flex-end;
		}

		.bulk-bar-inner {
			flex-wrap: wrap;
		}

		.bulk-actions {
			width: 100%;
		}
	}
</style>
