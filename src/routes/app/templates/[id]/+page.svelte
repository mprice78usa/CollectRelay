<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$components/ui/Badge.svelte';
	import Card from '$components/ui/Card.svelte';
	import Modal from '$components/ui/Modal.svelte';

	let { data, form } = $props();

	let editing = $state(false);
	let showAddItem = $state(false);
	let showPreview = $state(false);
	let addingItem = $state(false);
	let savingTemplate = $state(false);
	let editingItemId = $state<string | null>(null);

	const itemTypeLabels: Record<string, string> = {
		document: 'Document',
		question: 'Question',
		checkbox: 'Checkbox',
		signature: 'Signature'
	};

	const itemTypeVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
		document: 'info',
		question: 'warning',
		checkbox: 'success',
		signature: 'error'
	};

	const categoryLabels: Record<string, string> = {
		'pre-approval': 'Pre-Approval',
		purchase: 'Purchase',
		refinance: 'Refinance',
		seller: 'Seller',
		custom: 'Custom'
	};

	const itemTypeIcons: Record<string, string> = {
		document: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6',
		question: 'M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3 M12 17h.01',
		checkbox: 'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11',
		signature: 'M2 17l4-4 4 4 4-4 4 4 4-4 M2 21h20'
	};
</script>

<svelte:head>
	<title>{data.template.name} — Templates — CollectRelay</title>
</svelte:head>

<div class="template-editor">
	<div class="page-header">
		<a href="/app/templates" class="back-link">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="15 18 9 12 15 6" />
			</svg>
			Templates
		</a>
	</div>

	<!-- Template Info -->
	<Card>
		{#if editing}
			<form
				method="POST"
				action="?/update"
				use:enhance={() => {
					savingTemplate = true;
					return async ({ update }) => {
						savingTemplate = false;
						editing = false;
						await update();
					};
				}}
			>
				<div class="template-info-edit">
					<div class="form-group">
						<label for="name">Name</label>
						<input type="text" id="name" name="name" value={data.template.name} required />
					</div>
					<div class="form-group">
						<label for="description">Description</label>
						<textarea id="description" name="description" rows="2">{data.template.description ?? ''}</textarea>
					</div>
					<div class="form-group">
						<label for="category">Category</label>
						<select id="category" name="category">
							{#each Object.entries(categoryLabels) as [value, label]}
								<option {value} selected={data.template.category === value}>{label}</option>
							{/each}
						</select>
					</div>
					<div class="edit-actions">
						<button type="button" class="btn-ghost" onclick={() => (editing = false)}>Cancel</button>
						<button type="submit" class="btn-primary" disabled={savingTemplate}>
							{savingTemplate ? 'Saving...' : 'Save Changes'}
						</button>
					</div>
				</div>
			</form>
		{:else}
			<div class="template-info">
				<div class="template-info-content">
					<h1>{data.template.name}</h1>
					{#if data.template.description}
						<p class="description">{data.template.description}</p>
					{/if}
					<div class="template-meta">
						<Badge variant={
							data.template.category === 'purchase' ? 'success' :
							data.template.category === 'pre-approval' ? 'info' :
							data.template.category === 'refinance' ? 'warning' : 'default'
						}>
							{categoryLabels[data.template.category] ?? data.template.category}
						</Badge>
						<span class="item-count">{data.template.items.length} items</span>
					</div>
				</div>
				<div class="header-actions">
					<button class="btn-ghost" onclick={() => (showPreview = true)}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
						Preview
					</button>
					<button class="btn-ghost" onclick={() => (editing = true)}>
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
							<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
						</svg>
						Edit
					</button>
				</div>
			</div>
		{/if}
	</Card>

	<!-- Checklist Items -->
	<div class="items-section">
		<div class="items-header">
			<h2>Checklist Items</h2>
			<button class="btn-primary btn-sm" onclick={() => (showAddItem = true)}>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
					<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Add Item
			</button>
		</div>

		{#if data.template.items.length === 0}
			<div class="empty-items">
				<p>No checklist items yet. Add items that clients need to provide.</p>
			</div>
		{:else}
			<div class="items-list">
				{#each data.template.items as item, i}
					<div class="item-row" class:item-editing={editingItemId === item.id}>
						<!-- Move buttons -->
						<div class="item-move">
							<form method="POST" action="?/moveItem" use:enhance>
								<input type="hidden" name="itemId" value={item.id} />
								<input type="hidden" name="direction" value="up" />
								<button type="submit" class="move-btn" title="Move up" disabled={i === 0}>
									<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="18 15 12 9 6 15" />
									</svg>
								</button>
							</form>
							<span class="item-order-num">{i + 1}</span>
							<form method="POST" action="?/moveItem" use:enhance>
								<input type="hidden" name="itemId" value={item.id} />
								<input type="hidden" name="direction" value="down" />
								<button type="submit" class="move-btn" title="Move down" disabled={i === data.template.items.length - 1}>
									<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="6 9 12 15 18 9" />
									</svg>
								</button>
							</form>
						</div>

						{#if editingItemId === item.id}
							<!-- Inline Edit Form -->
							<form
								class="item-edit-form"
								method="POST"
								action="?/updateItem"
								use:enhance={() => {
									return async ({ update }) => {
										editingItemId = null;
										await update();
									};
								}}
							>
								<input type="hidden" name="itemId" value={item.id} />
								<div class="edit-row">
									<div class="form-group">
										<label for="edit-name-{item.id}">Name</label>
										<input type="text" id="edit-name-{item.id}" name="name" value={item.name} required />
									</div>
									<div class="form-group">
										<label for="edit-desc-{item.id}">Description</label>
										<input type="text" id="edit-desc-{item.id}" name="description" value={item.description ?? ''} placeholder="Optional description" />
									</div>
								</div>
								<div class="edit-row">
									<div class="form-group">
										<label for="edit-type-{item.id}">Type</label>
										<select id="edit-type-{item.id}" name="item_type">
											<option value="document" selected={item.item_type === 'document'}>Document Upload</option>
											<option value="question" selected={item.item_type === 'question'}>Text Question</option>
											<option value="checkbox" selected={item.item_type === 'checkbox'}>Checkbox</option>
											<option value="signature" selected={item.item_type === 'signature'}>Signature</option>
										</select>
									</div>
									<div class="form-group">
										<label for="edit-req-{item.id}">Required?</label>
										<select id="edit-req-{item.id}" name="required">
											<option value="true" selected={!!item.required}>Yes</option>
											<option value="false" selected={!item.required}>No</option>
										</select>
									</div>
								</div>
								<div class="inline-edit-actions">
									<button type="button" class="btn-ghost btn-sm" onclick={() => (editingItemId = null)}>Cancel</button>
									<button type="submit" class="btn-primary btn-sm">Save</button>
								</div>
							</form>
						{:else}
							<!-- View Mode -->
							<button class="item-content" onclick={() => (editingItemId = item.id)} type="button">
								<div class="item-name">
									{item.name}
									{#if item.required}
										<span class="required-badge">Required</span>
									{/if}
								</div>
								{#if item.description}
									<p class="item-desc">{item.description}</p>
								{/if}
							</button>
							<div class="item-type">
								<Badge variant={itemTypeVariants[item.item_type] ?? 'default'}>
									{itemTypeLabels[item.item_type] ?? item.item_type}
								</Badge>
							</div>
							<div class="item-actions">
								<button class="btn-icon btn-edit" title="Edit item" onclick={() => (editingItemId = item.id)}>
									<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
										<path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
									</svg>
								</button>
								<form method="POST" action="?/deleteItem" use:enhance>
									<input type="hidden" name="itemId" value={item.id} />
									<button type="submit" class="btn-icon btn-delete" title="Remove item">
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
										</svg>
									</button>
								</form>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Add Item Modal -->
<Modal bind:open={showAddItem} title="Add Checklist Item">
	<form
		method="POST"
		action="?/addItem"
		use:enhance={() => {
			addingItem = true;
			return async ({ update }) => {
				addingItem = false;
				showAddItem = false;
				await update();
			};
		}}
	>
		<div class="form-group">
			<label for="item-name">Name</label>
			<input type="text" id="item-name" name="name" required placeholder="e.g. Government-issued ID" />
		</div>

		<div class="form-group">
			<label for="item-desc">Description <span class="optional">(optional)</span></label>
			<textarea id="item-desc" name="description" rows="2" placeholder="Instructions or details for the client"></textarea>
		</div>

		<div class="form-row">
			<div class="form-group">
				<label for="item-type">Type</label>
				<select id="item-type" name="item_type">
					<option value="document">Document Upload</option>
					<option value="question">Text Question</option>
					<option value="checkbox">Checkbox</option>
					<option value="signature">Signature</option>
				</select>
			</div>
			<div class="form-group">
				<label for="item-required">Required?</label>
				<select id="item-required" name="required">
					<option value="true">Yes</option>
					<option value="false">No</option>
				</select>
			</div>
		</div>

		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}

		<div class="form-actions">
			<button type="button" class="btn-ghost" onclick={() => (showAddItem = false)}>Cancel</button>
			<button type="submit" class="btn-primary" disabled={addingItem}>
				{addingItem ? 'Adding...' : 'Add Item'}
			</button>
		</div>
	</form>
</Modal>

<!-- Preview Modal -->
<Modal bind:open={showPreview} title="Template Preview">
	<div class="preview-container">
		<div class="preview-header">
			<h3 class="preview-title">{data.template.name}</h3>
			{#if data.template.description}
				<p class="preview-desc">{data.template.description}</p>
			{/if}
			<div class="preview-progress">
				<div class="preview-progress-bar">
					<div class="preview-progress-fill" style="width: 0%"></div>
				</div>
				<span class="preview-progress-text">0 of {data.template.items.length} items completed</span>
			</div>
		</div>

		<div class="preview-items">
			{#each data.template.items as item}
				<div class="preview-item">
					<div class="preview-item-header">
						<div class="preview-item-icon" class:type-document={item.item_type === 'document'} class:type-question={item.item_type === 'question'} class:type-checkbox={item.item_type === 'checkbox'} class:type-signature={item.item_type === 'signature'}>
							{#if item.item_type === 'document'}
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
								</svg>
							{:else if item.item_type === 'question'}
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
								</svg>
							{:else if item.item_type === 'checkbox'}
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
								</svg>
							{:else}
								<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M2 17l4-4 4 4 4-4 4 4 4-4" /><line x1="2" y1="21" x2="22" y2="21" />
								</svg>
							{/if}
						</div>
						<div class="preview-item-info">
							<span class="preview-item-name">{item.name}</span>
							{#if item.required}
								<span class="preview-required">*</span>
							{/if}
						</div>
						<div class="preview-item-status">
							<span class="status-pending">Pending</span>
						</div>
					</div>
					{#if item.description}
						<p class="preview-item-desc">{item.description}</p>
					{/if}
					<div class="preview-item-placeholder">
						{#if item.item_type === 'document'}
							<div class="preview-upload-zone">
								<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
								</svg>
								<span>Drop file here or click to upload</span>
							</div>
						{:else if item.item_type === 'question'}
							<div class="preview-input-placeholder">
								<span>Client will type their answer here...</span>
							</div>
						{:else if item.item_type === 'checkbox'}
							<div class="preview-checkbox-placeholder">
								<div class="preview-checkbox-box"></div>
								<span>I confirm</span>
							</div>
						{:else}
							<div class="preview-input-placeholder">
								<span>Signature capture area</span>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if data.template.items.length === 0}
			<div class="preview-empty">
				<p>No items in this template yet.</p>
			</div>
		{/if}
	</div>
</Modal>

<style>
	.template-editor {
		max-width: 800px;
	}

	.page-header {
		margin-bottom: var(--space-xl);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		transition: color var(--transition-fast);
	}

	.back-link:hover { color: var(--text-primary); }

	/* Template Info */
	.template-info {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: var(--space-lg);
	}

	.template-info-content {
		flex: 1;
	}

	.header-actions {
		display: flex;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	h1 {
		font-size: var(--font-size-xl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.description {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		line-height: 1.5;
		margin-bottom: var(--space-md);
	}

	.template-meta {
		display: flex;
		align-items: center;
		gap: var(--space-md);
	}

	.item-count {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	/* Edit form */
	.template-info-edit {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.edit-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
	}

	/* Items section */
	.items-section {
		margin-top: var(--space-xxl);
	}

	.items-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-lg);
	}

	h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
	}

	.empty-items {
		padding: var(--space-xxl);
		text-align: center;
		background: var(--bg-secondary);
		border: 1px dashed var(--border-color);
		border-radius: var(--radius-lg);
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.item-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		transition: border-color var(--transition-fast);
	}

	.item-row:hover {
		border-color: var(--border-color-hover);
	}

	.item-row.item-editing {
		flex-direction: column;
		align-items: stretch;
		border-color: var(--color-accent);
		background: var(--bg-primary);
	}

	.item-row.item-editing .item-move {
		align-self: flex-start;
	}

	/* Move buttons */
	.item-move {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}

	.item-move form {
		display: contents;
	}

	.move-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 18px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
		padding: 0;
	}

	.move-btn:hover:not(:disabled) {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.move-btn:disabled {
		opacity: 0.25;
		cursor: not-allowed;
	}

	.item-order-num {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		line-height: 1;
	}

	.item-content {
		flex: 1;
		min-width: 0;
		text-align: left;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: inherit;
		font: inherit;
	}

	.item-content:hover .item-name {
		color: var(--color-accent);
	}

	.item-name {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		transition: color var(--transition-fast);
	}

	.required-badge {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--color-accent);
		opacity: 0.8;
	}

	.item-desc {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-top: 2px;
	}

	.item-type {
		flex-shrink: 0;
	}

	.item-actions {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.item-actions form {
		display: contents;
	}

	/* Inline edit form */
	.item-edit-form {
		flex: 1;
	}

	.edit-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}

	.inline-edit-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.btn-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-icon.btn-edit:hover {
		background: var(--bg-tertiary);
		color: var(--color-accent);
	}

	.btn-icon.btn-delete:hover {
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
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
	}

	.btn-primary:hover { background: var(--color-accent-hover); }
	.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
	.btn-sm { padding: var(--space-xs) var(--space-md); font-size: var(--font-size-xs); }

	.btn-ghost {
		padding: var(--space-sm) var(--space-lg);
		background: none;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: all var(--transition-fast);
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.btn-ghost:hover { background: var(--bg-tertiary); color: var(--text-primary); }

	/* Form */
	.form-group {
		margin-bottom: var(--space-lg);
	}

	.item-edit-form .form-group {
		margin-bottom: 0;
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

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
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

	/* Preview Modal Styles */
	.preview-container {
		max-height: 60vh;
		overflow-y: auto;
	}

	.preview-header {
		margin-bottom: var(--space-xl);
	}

	.preview-title {
		font-size: var(--font-size-lg);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.preview-desc {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		margin-bottom: var(--space-md);
	}

	.preview-progress {
		margin-top: var(--space-md);
	}

	.preview-progress-bar {
		height: 6px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
		margin-bottom: var(--space-xs);
	}

	.preview-progress-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: var(--radius-full);
		transition: width 0.3s ease;
	}

	.preview-progress-text {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.preview-items {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.preview-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-md) var(--space-lg);
	}

	.preview-item-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-xs);
	}

	.preview-item-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.preview-item-icon.type-document {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.preview-item-icon.type-question {
		background: rgba(234, 179, 8, 0.15);
		color: #eab308;
	}

	.preview-item-icon.type-checkbox {
		background: rgba(16, 185, 129, 0.15);
		color: #10b981;
	}

	.preview-item-icon.type-signature {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}

	.preview-item-info {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.preview-item-name {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.preview-required {
		color: var(--color-error);
		font-weight: 700;
	}

	.preview-item-status .status-pending {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		background: var(--bg-tertiary);
		padding: 2px 8px;
		border-radius: var(--radius-full);
	}

	.preview-item-desc {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-bottom: var(--space-sm);
		padding-left: 36px;
	}

	.preview-item-placeholder {
		padding-left: 36px;
	}

	.preview-upload-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-lg);
		border: 2px dashed var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-size: var(--font-size-xs);
	}

	.preview-input-placeholder {
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		font-style: italic;
	}

	.preview-checkbox-placeholder {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.preview-checkbox-box {
		width: 18px;
		height: 18px;
		border: 2px solid var(--border-color);
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.preview-empty {
		padding: var(--space-xxl);
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}
</style>
