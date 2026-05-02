<script lang="ts">
	import Badge from '$components/ui/Badge.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	let { data } = $props();

	type VaultFile = (typeof data.files)[number];

	let files = $state<VaultFile[]>(data.files);
	let nextCursor = $state<string | null>(data.nextCursor);
	let loadingMore = $state(false);
	let downloading = $state(false);
	let exporting = $state<string | null>(null);
	let selectedIds = $state<Set<string>>(new Set());
	let toast = $state<{ kind: 'success' | 'error'; text: string } | null>(null);

	function showToast(kind: 'success' | 'error', text: string) {
		toast = { kind, text };
		setTimeout(() => { if (toast?.text === text) toast = null; }, 6000);
	}

	$effect(() => {
		files = data.files;
		nextCursor = data.nextCursor;
		selectedIds = new Set();
	});

	let allSelected = $derived(
		files.length > 0 && files.every((f) => selectedIds.has(f.id))
	);

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function toggleAll() {
		if (allSelected) {
			selectedIds = new Set();
		} else {
			selectedIds = new Set(files.map((f) => f.id));
		}
	}

	function applyFilter(name: string, value: string | null) {
		const params = new URLSearchParams(page.url.searchParams);
		if (value && value !== '') params.set(name, value);
		else params.delete(name);
		goto(`/app/vault?${params.toString()}`, { keepFocus: true });
	}

	function clearFilters() {
		goto('/app/vault');
	}

	async function loadMore() {
		if (!nextCursor || loadingMore) return;
		loadingMore = true;
		try {
			const params = new URLSearchParams(page.url.searchParams);
			params.set('cursor', nextCursor);
			const res = await fetch(`/api/vault?${params.toString()}`);
			if (res.ok) {
				const json = await res.json();
				files = [...files, ...json.files];
				nextCursor = json.nextCursor;
			}
		} finally {
			loadingMore = false;
		}
	}

	async function downloadOne(id: string) {
		window.location.href = `/api/files/${id}`;
	}

	async function exportSelected(providerKey: string, providerName: string) {
		if (selectedIds.size === 0 || exporting) return;
		exporting = providerKey;
		const ids = [...selectedIds];
		try {
			const res = await fetch(`/api/cloud/${providerKey}/export`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fileIds: ids })
			});
			if (!res.ok) {
				showToast('error', `Send failed: ${await res.text()}`);
				return;
			}
			const json = await res.json();
			if (json.failedCount > 0) {
				showToast('error', `${json.successCount} sent to ${providerName}, ${json.failedCount} failed.`);
			} else {
				showToast('success', `${json.successCount} file${json.successCount === 1 ? '' : 's'} sent to ${providerName}.`);
				selectedIds = new Set();
			}
		} catch (err) {
			showToast('error', 'Network error sending to ' + providerName);
		} finally {
			exporting = null;
		}
	}

	async function downloadSelected() {
		if (selectedIds.size === 0 || downloading) return;
		downloading = true;
		try {
			const res = await fetch('/api/vault/bulk-download', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fileIds: [...selectedIds] })
			});
			if (!res.ok) {
				alert('Download failed: ' + (await res.text()));
				return;
			}
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `vault-export-${new Date().toISOString().slice(0, 10)}.zip`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} finally {
			downloading = false;
		}
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
		return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
	}

	function formatDate(iso: string): string {
		const d = new Date(iso);
		return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	}

	function fileIcon(mime: string | null): string {
		if (!mime) return 'file';
		if (mime.startsWith('image/')) return 'image';
		if (mime === 'application/pdf') return 'pdf';
		if (mime.startsWith('audio/')) return 'audio';
		if (mime.startsWith('video/')) return 'video';
		return 'file';
	}

	function statusVariant(status: string): 'default' | 'success' | 'warning' | 'error' | 'info' {
		switch (status) {
			case 'completed': return 'success';
			case 'in_review': return 'info';
			case 'active': return 'warning';
			case 'cancelled': return 'error';
			default: return 'default';
		}
	}

	let hasFilters = $derived(
		Object.values(data.filters).some((v) => v !== undefined && v !== null && v !== '')
	);
</script>

<svelte:head>
	<title>Vault · CollectRelay</title>
</svelte:head>

<div class="vault">
	<header class="vault-header">
		<div>
			<h1>Vault</h1>
			<p class="subtitle">All documents across your transactions, in one place.</p>
		</div>
	</header>

	<div class="stats-row">
		<div class="stat-card">
			<div class="stat-label">Total files</div>
			<div class="stat-value">{data.stats.total_files.toLocaleString()}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">Total size</div>
			<div class="stat-value">{formatSize(data.stats.total_size)}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">From clients</div>
			<div class="stat-value">{data.stats.client_count.toLocaleString()}</div>
		</div>
		<div class="stat-card">
			<div class="stat-label">From your team</div>
			<div class="stat-value">{data.stats.pro_count.toLocaleString()}</div>
		</div>
	</div>

	<div class="filters">
		<input
			type="search"
			placeholder="Filter by client email…"
			value={data.filters.clientEmail || ''}
			onchange={(e) => applyFilter('clientEmail', (e.target as HTMLInputElement).value || null)}
		/>
		<select
			value={data.filters.source || ''}
			onchange={(e) => applyFilter('source', (e.target as HTMLSelectElement).value || null)}
		>
			<option value="">All sources</option>
			<option value="pro">From your team</option>
			<option value="client">From clients</option>
		</select>
		<select
			value={data.filters.mimePrefix || ''}
			onchange={(e) => applyFilter('mimePrefix', (e.target as HTMLSelectElement).value || null)}
		>
			<option value="">All file types</option>
			<option value="application/pdf">PDFs</option>
			<option value="image/">Images</option>
			<option value="audio/">Audio</option>
			<option value="video/">Video</option>
		</select>
		<input
			type="date"
			value={data.filters.dateFrom || ''}
			aria-label="From date"
			onchange={(e) => applyFilter('dateFrom', (e.target as HTMLInputElement).value || null)}
		/>
		<input
			type="date"
			value={data.filters.dateTo || ''}
			aria-label="To date"
			onchange={(e) => applyFilter('dateTo', (e.target as HTMLInputElement).value || null)}
		/>
		{#if hasFilters}
			<button type="button" class="btn-clear" onclick={clearFilters}>Clear</button>
		{/if}
	</div>

	{#if selectedIds.size > 0}
		<div class="bulk-bar">
			<span>{selectedIds.size} selected</span>
			<button type="button" class="btn-primary" disabled={downloading} onclick={downloadSelected}>
				{downloading ? 'Preparing…' : 'Download as ZIP'}
			</button>
			{#each data.cloudProviders.filter((p) => p.connected) as provider (provider.key)}
				<button
					type="button"
					class="btn-secondary"
					disabled={exporting !== null}
					onclick={() => exportSelected(provider.key, provider.displayName)}
				>
					{exporting === provider.key ? `Sending to ${provider.displayName}…` : `Send to ${provider.displayName}`}
				</button>
			{/each}
			<button type="button" class="btn-ghost" onclick={() => (selectedIds = new Set())}>
				Clear selection
			</button>
		</div>
	{/if}

	{#if toast}
		<div class="toast toast-{toast.kind}">{toast.text}</div>
	{/if}

	{#if files.length === 0}
		<EmptyState message={hasFilters ? 'No files match these filters.' : 'No documents yet. Files uploaded across your transactions will appear here.'} />
	{:else}
		<div class="table-wrap">
			<table class="vault-table">
				<thead>
					<tr>
						<th class="check-col">
							<input
								type="checkbox"
								checked={allSelected}
								onchange={toggleAll}
								aria-label="Select all on this page"
							/>
						</th>
						<th>File</th>
						<th>Transaction</th>
						<th>Client</th>
						<th>Source</th>
						<th>Version</th>
						<th>Size</th>
						<th>Date</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{#each files as file (file.id)}
						<tr class:selected={selectedIds.has(file.id)}>
							<td class="check-col">
								<input
									type="checkbox"
									checked={selectedIds.has(file.id)}
									onchange={() => toggleSelect(file.id)}
									aria-label="Select {file.filename}"
								/>
							</td>
							<td class="file-cell">
								<span class="file-icon" aria-hidden="true">
									{#if fileIcon(file.mimeType) === 'image'}🖼️
									{:else if fileIcon(file.mimeType) === 'pdf'}📄
									{:else if fileIcon(file.mimeType) === 'audio'}🎙️
									{:else if fileIcon(file.mimeType) === 'video'}🎬
									{:else}📎{/if}
								</span>
								<div class="file-meta">
									<div class="filename">{file.filename}</div>
									{#if file.checklistItem.name}
										<div class="checklist-name">{file.checklistItem.name}</div>
									{/if}
								</div>
							</td>
							<td>
								<a href="/app/transactions/{file.transaction.id}" class="txn-link">
									{file.transaction.title}
								</a>
								<div class="row-sub">
									<Badge variant={statusVariant(file.transaction.status)}>
										{file.transaction.status.replace('_', ' ')}
									</Badge>
								</div>
							</td>
							<td>
								<div>{file.transaction.clientName}</div>
								<div class="row-sub">{file.transaction.clientEmail}</div>
							</td>
							<td>
								{#if file.uploadedByClient}
									<Badge variant="info">Client</Badge>
								{:else}
									<Badge variant="default">Team</Badge>
								{/if}
							</td>
							<td>v{file.version}</td>
							<td>{formatSize(file.fileSize)}</td>
							<td>{formatDate(file.createdAt)}</td>
							<td class="actions-cell">
								<button type="button" class="btn-ghost-sm" onclick={() => downloadOne(file.id)}>
									Download
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		{#if nextCursor}
			<div class="load-more-row">
				<button type="button" class="btn-secondary" disabled={loadingMore} onclick={loadMore}>
					{loadingMore ? 'Loading…' : 'Load more'}
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.vault {
		max-width: 1280px;
	}

	.vault-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: var(--space-xl);
	}

	.vault-header h1 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin: 0 0 var(--space-xs) 0;
	}

	.subtitle {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin: 0;
	}

	.stats-row {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.stat-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-md) var(--space-lg);
	}

	.stat-label {
		color: var(--text-muted);
		font-size: var(--font-size-xs);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-xs);
	}

	.stat-value {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
		padding: var(--space-md);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
	}

	.filters input,
	.filters select {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: var(--space-sm) var(--space-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		min-width: 160px;
	}

	.filters input[type="search"] {
		flex: 1 1 220px;
	}

	.btn-clear {
		background: transparent;
		border: 1px solid var(--border-color);
		color: var(--text-muted);
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		cursor: pointer;
	}
	.btn-clear:hover { color: var(--text-primary); border-color: var(--text-muted); }

	.bulk-bar {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		background: rgba(74, 122, 245, 0.08);
		border: 1px solid rgba(74, 122, 245, 0.25);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-lg);
		margin-bottom: var(--space-md);
		font-size: var(--font-size-sm);
	}

	.btn-primary {
		background: var(--color-accent);
		color: #fff;
		border: none;
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
	}
	.btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

	.btn-secondary {
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
	}
	.btn-secondary:hover:not(:disabled) { background: var(--bg-quaternary, var(--bg-secondary)); }
	.btn-secondary:disabled { opacity: 0.6; cursor: not-allowed; }

	.btn-ghost {
		background: transparent;
		color: var(--text-muted);
		border: none;
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-size-sm);
		cursor: pointer;
	}
	.btn-ghost:hover { color: var(--text-primary); }

	.btn-ghost-sm {
		background: transparent;
		color: var(--color-accent);
		border: none;
		padding: 4px 8px;
		font-size: var(--font-size-xs);
		font-weight: 600;
		cursor: pointer;
	}
	.btn-ghost-sm:hover { text-decoration: underline; }

	.table-wrap {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.vault-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-sm);
	}

	.vault-table thead {
		background: var(--bg-primary);
	}

	.vault-table th {
		text-align: left;
		padding: var(--space-sm) var(--space-md);
		color: var(--text-muted);
		font-size: var(--font-size-xs);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
		border-bottom: 1px solid var(--border-color);
	}

	.vault-table td {
		padding: var(--space-md);
		border-bottom: 1px solid var(--border-color);
		vertical-align: top;
	}

	.vault-table tbody tr:last-child td { border-bottom: none; }
	.vault-table tbody tr:hover { background: var(--bg-primary); }
	.vault-table tbody tr.selected { background: rgba(74, 122, 245, 0.06); }

	.check-col { width: 40px; text-align: center; }

	.file-cell {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
		min-width: 220px;
	}

	.file-icon { font-size: 18px; line-height: 1; }

	.file-meta { display: flex; flex-direction: column; gap: 2px; }

	.filename {
		color: var(--text-primary);
		font-weight: 500;
		word-break: break-word;
	}

	.checklist-name, .row-sub {
		color: var(--text-muted);
		font-size: var(--font-size-xs);
	}

	.txn-link { color: var(--color-accent); }
	.txn-link:hover { text-decoration: underline; }

	.actions-cell { text-align: right; white-space: nowrap; }

	.load-more-row {
		display: flex;
		justify-content: center;
		padding: var(--space-lg) 0;
	}

	.toast {
		position: fixed;
		bottom: var(--space-xl);
		right: var(--space-xl);
		padding: var(--space-sm) var(--space-lg);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
		z-index: var(--z-toast, 1000);
		max-width: 360px;
	}
	.toast-success { background: var(--color-success); color: #fff; }
	.toast-error { background: var(--color-error); color: #fff; }
</style>
