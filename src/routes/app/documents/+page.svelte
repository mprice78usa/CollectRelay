<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';

	let { data, form } = $props();

	let activeTab = $state<'lender' | 'agent'>('lender');
	let showAddModal = $state(false);
	let adding = $state(false);

	const categoryLabels: Record<string, string> = {
		lender: 'Lender',
		agent: 'Agent',
		custom: 'Custom'
	};

	const categoryVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
		lender: 'info',
		agent: 'success',
		custom: 'default'
	};

	let filteredDocs = $derived(() => {
		return data.documents.filter((d: any) => d.category === activeTab);
	});

	function formatFileSize(bytes: number | null): string {
		if (bytes == null) return '';
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<svelte:head>
	<title>Document Center — CollectRelay</title>
</svelte:head>

<div class="documents-page">
	<div class="page-header">
		<div>
			<h1>Document Center</h1>
			<p class="subtitle">Standard lender and agent forms for your transactions.</p>
		</div>
		<button class="btn-primary" onclick={() => (showAddModal = true)}>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			Add Document
		</button>
	</div>

	<!-- Tabs -->
	<div class="tabs">
		<button
			class="tab"
			class:active={activeTab === 'lender'}
			onclick={() => activeTab = 'lender'}
		>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20"/><path d="M10 3v6"/>
			</svg>
			Lender Forms
		</button>
		<button
			class="tab"
			class:active={activeTab === 'agent'}
			onclick={() => activeTab = 'agent'}
		>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/>
			</svg>
			Agent Forms
		</button>
	</div>

	<!-- Document Grid -->
	{#if filteredDocs().length === 0}
		<div class="empty-state">
			<svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
				<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
			</svg>
			<p>No {categoryLabels[activeTab]?.toLowerCase()} forms yet.</p>
			<button class="btn-secondary" onclick={() => (showAddModal = true)}>Add one</button>
		</div>
	{:else}
		<div class="documents-grid">
			{#each filteredDocs() as doc}
				<div class="doc-card">
					<div class="doc-card-header">
						<div class="doc-icon">
							<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
								<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
							</svg>
						</div>
						<div class="doc-badges">
							{#if doc.is_system}
								<Badge variant="default">System</Badge>
							{/if}
							<Badge variant={categoryVariants[doc.category] ?? 'default'}>
								{categoryLabels[doc.category] ?? doc.category}
							</Badge>
						</div>
					</div>

					<h3 class="doc-name">{doc.name}</h3>
					{#if doc.description}
						<p class="doc-desc">{doc.description}</p>
					{/if}

					<div class="doc-file-info">
						{#if doc.filename}
							<div class="file-attached">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
								</svg>
								<span class="file-name">{doc.filename}</span>
								{#if doc.file_size}
									<span class="file-size">{formatFileSize(doc.file_size)}</span>
								{/if}
							</div>
						{:else}
							<span class="no-file">No file uploaded</span>
						{/if}
					</div>

					<div class="doc-actions">
						{#if !doc.is_system}
							<form method="POST" action="?/uploadFile" enctype="multipart/form-data" use:enhance>
								<input type="hidden" name="documentId" value={doc.id} />
								<label class="upload-btn">
									<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
									</svg>
									Upload
									<input type="file" name="file" class="file-input" onchange={(e) => { const el = e.currentTarget; el.closest('form')?.requestSubmit(); }} />
								</label>
							</form>
							<form method="POST" action="?/deleteDocument" use:enhance={() => { return async ({ update }) => { await update(); }; }}>
								<input type="hidden" name="documentId" value={doc.id} />
								<button type="submit" class="action-btn action-delete" title="Delete document">
									<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
										<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
									</svg>
									Delete
								</button>
							</form>
						{:else}
							<form method="POST" action="?/uploadFile" enctype="multipart/form-data" use:enhance>
								<input type="hidden" name="documentId" value={doc.id} />
								<label class="upload-btn">
									<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
									</svg>
									Upload
									<input type="file" name="file" class="file-input" onchange={(e) => { const el = e.currentTarget; el.closest('form')?.requestSubmit(); }} />
								</label>
							</form>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Add Document Modal -->
<Modal bind:open={showAddModal} title="Add Document">
	<form
		method="POST"
		action="?/addDocument"
		use:enhance={() => {
			adding = true;
			return async ({ result, update }) => {
				adding = false;
				if (result.type === 'success') {
					showAddModal = false;
				}
				await update();
			};
		}}
	>
		<div class="form-group">
			<label for="doc-name">Name</label>
			<input type="text" id="doc-name" name="name" required placeholder="e.g. Property Survey Template" />
		</div>

		<div class="form-group">
			<label for="doc-description">Description <span class="optional">(optional)</span></label>
			<textarea id="doc-description" name="description" rows="2" placeholder="Brief description of this document"></textarea>
		</div>

		<div class="form-group">
			<label for="doc-category">Category</label>
			<select id="doc-category" name="category">
				<option value="lender">Lender</option>
				<option value="agent">Agent</option>
				<option value="custom">Custom</option>
			</select>
		</div>

		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={() => (showAddModal = false)}>Cancel</button>
			<button type="submit" class="btn-primary" disabled={adding}>
				{adding ? 'Adding...' : 'Add Document'}
			</button>
		</div>
	</form>
</Modal>

<style>
	.documents-page {
		max-width: 900px;
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

	/* Tabs */
	.tabs {
		display: flex;
		gap: var(--space-xs);
		margin-bottom: var(--space-xl);
		border-bottom: 1px solid var(--border-color);
		padding-bottom: 0;
	}

	.tab {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-lg);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
		margin-bottom: -1px;
	}

	.tab:hover {
		color: var(--text-primary);
	}

	.tab.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
	}

	/* Grid */
	.documents-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-lg);
	}

	.doc-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		transition: border-color var(--transition-fast);
	}

	.doc-card:hover {
		border-color: var(--text-tertiary);
	}

	.doc-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.doc-icon {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(59, 130, 246, 0.12);
		color: #3b82f6;
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.doc-badges {
		display: flex;
		gap: var(--space-xs);
	}

	.doc-name {
		font-size: var(--font-size-md);
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.doc-desc {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.doc-file-info {
		margin-top: var(--space-xs);
		font-size: var(--font-size-xs);
	}

	.file-attached {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--color-accent);
	}

	.file-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 160px;
	}

	.file-size {
		color: var(--text-muted);
		flex-shrink: 0;
	}

	.no-file {
		color: var(--text-muted);
		font-style: italic;
	}

	.doc-actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--border-color);
	}

	.doc-actions form {
		display: inline;
	}

	/* Upload button */
	.upload-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px var(--space-sm);
		background: none;
		border: none;
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.upload-btn:hover {
		color: var(--color-accent);
		background: rgba(16, 185, 129, 0.1);
	}

	.file-input {
		display: none;
	}

	/* Action buttons */
	.action-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 3px var(--space-sm);
		background: none;
		border: none;
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		cursor: pointer;
		border-radius: var(--radius-sm);
		transition: all var(--transition-fast);
	}

	.action-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.action-delete:hover {
		color: var(--color-error);
		background: rgba(239, 68, 68, 0.1);
	}

	/* Empty state */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-xxl);
		color: var(--text-muted);
		text-align: center;
	}

	.empty-state p {
		font-size: var(--font-size-sm);
	}

	/* Buttons */
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
		white-space: nowrap;
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

	/* Form styles */
	.form-group {
		margin-bottom: var(--space-lg);
	}

	.form-group label {
		display: block;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: var(--space-xs);
	}

	.optional {
		color: var(--text-muted);
		font-weight: 400;
	}

	.form-group input,
	.form-group textarea,
	.form-group select {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
		font-family: inherit;
	}

	.form-group input:focus,
	.form-group textarea:focus,
	.form-group select:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
	}

	.form-error {
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-xl);
	}

	@media (max-width: 768px) {
		.documents-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
