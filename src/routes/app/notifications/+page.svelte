<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import EmptyState from '$components/ui/EmptyState.svelte';

	let { data } = $props();

	type NotificationEvent = {
		id: string;
		transaction_id: string;
		transaction_title: string;
		actor_type: string;
		actor_name: string;
		action: string;
		detail: string | null;
		created_at: string;
	};

	let filterType = $state('all');
	let searchQuery = $state('');
	let selectedTransaction = $state(data.transactionFilter || '');

	const filterOptions = [
		{ label: 'All', value: 'all' },
		{ label: 'Uploads', value: 'uploads' },
		{ label: 'Reviews', value: 'reviews' },
		{ label: 'Comments', value: 'comments' },
		{ label: 'Status', value: 'status' }
	];

	function matchesFilter(event: NotificationEvent): boolean {
		if (filterType === 'all') return true;
		if (filterType === 'uploads') return event.action === 'file_uploaded' || event.action === 'item_submitted';
		if (filterType === 'reviews') return event.action === 'item_reviewed' || event.action.includes('accepted') || event.action.includes('rejected') || event.action.includes('waived');
		if (filterType === 'comments') return event.action === 'comment_added';
		if (filterType === 'status') return event.action === 'status_changed' || event.action === 'magic_link_sent' || event.action === 'reminder_sent';
		return true;
	}

	function matchesSearch(event: NotificationEvent): boolean {
		if (!searchQuery) return true;
		const q = searchQuery.toLowerCase();
		return (
			event.actor_name.toLowerCase().includes(q) ||
			(event.detail || '').toLowerCase().includes(q) ||
			event.transaction_title.toLowerCase().includes(q) ||
			event.action.replace(/_/g, ' ').toLowerCase().includes(q)
		);
	}

	let filteredEvents = $derived(
		(data.events as NotificationEvent[])
			.filter(matchesFilter)
			.filter(matchesSearch)
	);

	function groupByDate(events: NotificationEvent[]): { label: string; events: NotificationEvent[] }[] {
		const groups: Map<string, NotificationEvent[]> = new Map();
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

		for (const event of events) {
			const date = new Date(event.created_at);
			let label: string;
			if (date >= today) {
				label = 'Today';
			} else if (date >= yesterday) {
				label = 'Yesterday';
			} else if (date >= weekAgo) {
				label = 'This Week';
			} else {
				label = 'Older';
			}
			if (!groups.has(label)) groups.set(label, []);
			groups.get(label)!.push(event);
		}

		const order = ['Today', 'Yesterday', 'This Week', 'Older'];
		return order
			.filter(label => groups.has(label))
			.map(label => ({ label, events: groups.get(label)! }));
	}

	let groupedEvents = $derived(groupByDate(filteredEvents));

	function handleTransactionFilter(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		selectedTransaction = value;
		const url = new URL(page.url);
		if (value) {
			url.searchParams.set('transaction', value);
		} else {
			url.searchParams.delete('transaction');
		}
		goto(url.toString(), { replaceState: true, invalidateAll: true });
	}

	function actionIcon(action: string): string {
		if (action === 'file_uploaded') return 'upload';
		if (action === 'item_submitted') return 'check';
		if (action === 'item_reviewed' || action.includes('accepted') || action.includes('rejected') || action.includes('waived')) return 'review';
		if (action === 'comment_added') return 'comment';
		if (action === 'status_changed') return 'status';
		if (action === 'magic_link_sent' || action === 'reminder_sent') return 'send';
		if (action === 'transaction_created') return 'create';
		return 'default';
	}

	function actionColor(action: string): string {
		if (action === 'file_uploaded' || action === 'item_submitted') return 'var(--color-accent)';
		if (action.includes('accepted') || action.includes('waived')) return 'var(--color-success)';
		if (action.includes('rejected')) return 'var(--color-error)';
		if (action === 'comment_added') return 'var(--color-info)';
		if (action === 'magic_link_sent' || action === 'reminder_sent') return 'var(--color-warning)';
		if (action === 'transaction_created') return 'var(--color-accent)';
		return 'var(--text-tertiary)';
	}

	function actionLabel(action: string): string {
		const labels: Record<string, string> = {
			file_uploaded: 'uploaded a file',
			item_submitted: 'submitted an item',
			item_accepted: 'accepted an item',
			item_rejected: 'rejected an item',
			item_waived: 'waived an item',
			item_reviewed: 'reviewed an item',
			answer_submitted: 'submitted an answer',
			comment_added: 'left a comment',
			magic_link_sent: 'sent a client link',
			reminder_sent: 'sent a reminder',
			status_changed: 'changed status',
			transaction_created: 'created a transaction',
			signature_submitted: 'signed a document'
		};
		return labels[action] || action.replace(/_/g, ' ');
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'just now';
		if (mins < 60) return `${mins}m ago`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d ago`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function actorBadge(actorType: string): string {
		if (actorType === 'client') return 'client';
		if (actorType === 'pro') return 'you';
		return 'system';
	}
</script>

<svelte:head>
	<title>Activity — CollectRelay</title>
</svelte:head>

<div class="activity-page">
	<div class="page-header">
		<div>
			<h1>Activity</h1>
			<p class="subtitle">Track everything happening across your transactions.</p>
		</div>
		<div class="header-stats">
			<div class="stat">
				<span class="stat-value">{data.events.length}</span>
				<span class="stat-label">Events</span>
			</div>
			<div class="stat">
				<span class="stat-value">{data.transactions?.length || 0}</span>
				<span class="stat-label">Transactions</span>
			</div>
		</div>
	</div>

	<!-- Filters bar -->
	<div class="filters-bar">
		<div class="filter-tabs">
			{#each filterOptions as opt}
				<button
					class="filter-tab"
					class:active={filterType === opt.value}
					onclick={() => filterType = opt.value}
				>
					{opt.label}
				</button>
			{/each}
		</div>
		<div class="filter-controls">
			<div class="search-box">
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
				</svg>
				<input
					type="text"
					placeholder="Search events..."
					bind:value={searchQuery}
				/>
			</div>
			{#if data.transactions && data.transactions.length > 0}
				<select
					class="txn-filter"
					value={selectedTransaction}
					onchange={handleTransactionFilter}
				>
					<option value="">All transactions</option>
					{#each data.transactions as txn}
						<option value={txn.id}>{txn.title}</option>
					{/each}
				</select>
			{/if}
		</div>
	</div>

	{#if filteredEvents.length === 0}
		<EmptyState message={searchQuery || selectedTransaction ? 'No events match your filters.' : 'No activity yet. Events will appear here as you and your clients interact.'} />
	{:else}
		<div class="results-count">
			{filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
			{#if searchQuery}matching "{searchQuery}"{/if}
			{#if selectedTransaction}in selected transaction{/if}
		</div>
		<div class="feed">
			{#each groupedEvents as group}
				<div class="feed-group">
					<div class="group-label">{group.label}</div>
					<div class="group-events">
						{#each group.events as event}
							<a href="/app/transactions/{event.transaction_id}" class="feed-event">
								<div class="event-icon" style="color: {actionColor(event.action)}">
									{#if actionIcon(event.action) === 'upload'}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
											<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
										</svg>
									{:else if actionIcon(event.action) === 'check'}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
											<polyline points="20 6 9 17 4 12"/>
										</svg>
									{:else if actionIcon(event.action) === 'review'}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
											<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
										</svg>
									{:else if actionIcon(event.action) === 'comment'}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
											<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
										</svg>
									{:else if actionIcon(event.action) === 'send'}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
											<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
										</svg>
									{:else if actionIcon(event.action) === 'create'}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
											<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
										</svg>
									{:else}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
											<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
										</svg>
									{/if}
								</div>
								<div class="event-content">
									<div class="event-main">
										<span class="event-actor">{event.actor_name}</span>
										<span class="actor-badge {event.actor_type}">{actorBadge(event.actor_type)}</span>
										<span class="event-detail">{event.detail || actionLabel(event.action)}</span>
									</div>
									<div class="event-meta">
										<span class="event-txn">{event.transaction_title}</span>
										<span class="event-time">{formatTime(event.created_at)}</span>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.activity-page {
		max-width: 900px;
	}

	.page-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		margin-bottom: var(--space-xl);
		gap: var(--space-lg);
	}

	h1 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.subtitle {
		color: var(--text-secondary);
	}

	.header-stats {
		display: flex;
		gap: var(--space-lg);
		flex-shrink: 0;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: var(--space-sm) var(--space-lg);
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
	}

	.stat-value {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	/* Filters */
	.filters-bar {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.filter-tabs {
		display: flex;
		gap: var(--space-xs);
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
		border: none;
		background: none;
		cursor: pointer;
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

	.filter-controls {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
	}

	.search-box {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-xs) var(--space-md);
		flex: 1;
		max-width: 320px;
		color: var(--text-tertiary);
	}

	.search-box:focus-within {
		border-color: var(--color-accent);
	}

	.search-box input {
		border: none;
		background: none;
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		width: 100%;
		outline: none;
	}

	.search-box input::placeholder {
		color: var(--text-tertiary);
	}

	.txn-filter {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-xs) var(--space-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		max-width: 260px;
		cursor: pointer;
	}

	.txn-filter:focus {
		border-color: var(--color-accent);
		outline: none;
	}

	/* Results count */
	.results-count {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
		margin-bottom: var(--space-md);
	}

	/* Feed */
	.feed {
		display: flex;
		flex-direction: column;
		gap: var(--space-xl);
	}

	.group-label {
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--text-tertiary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-sm);
	}

	.group-events {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.feed-event {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--bg-secondary);
		transition: background var(--transition-fast);
		text-decoration: none;
		color: inherit;
	}

	.feed-event:hover {
		background: var(--bg-tertiary);
		color: inherit;
	}

	.event-icon {
		flex-shrink: 0;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-primary);
		border-radius: var(--radius-full);
		margin-top: 2px;
	}

	.event-content {
		flex: 1;
		min-width: 0;
	}

	.event-main {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		flex-wrap: wrap;
		margin-bottom: 2px;
	}

	.event-actor {
		font-weight: 600;
		font-size: var(--font-size-sm);
		color: var(--text-primary);
	}

	.actor-badge {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		padding: 1px 6px;
		border-radius: var(--radius-sm);
		line-height: 1.4;
	}

	.actor-badge.client {
		background: rgba(16, 185, 129, 0.15);
		color: var(--color-success);
	}

	.actor-badge.pro {
		background: rgba(74, 122, 245, 0.15);
		color: var(--color-accent);
	}

	.actor-badge.system {
		background: rgba(255, 255, 255, 0.08);
		color: var(--text-tertiary);
	}

	.event-detail {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.event-meta {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	.event-txn {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.event-time {
		flex-shrink: 0;
	}

	@media (max-width: 640px) {
		.page-header {
			flex-direction: column;
		}

		.header-stats {
			width: 100%;
		}

		.stat {
			flex: 1;
		}

		.filter-controls {
			flex-direction: column;
		}

		.search-box {
			max-width: none;
		}

		.txn-filter {
			max-width: none;
			width: 100%;
		}

		.event-main {
			flex-direction: column;
			gap: 0;
		}
	}
</style>
