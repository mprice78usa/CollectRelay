<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$components/ui/Card.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import EmptyState from '$components/ui/EmptyState.svelte';
	import SearchInput from '$components/ui/SearchInput.svelte';

	let { data, form } = $props();

	let showCreateModal = $state(false);
	let creating = $state(false);
	let searchQuery = $state('');
	let selectedCategory = $state('all');

	const categoryLabels: Record<string, string> = {
		'pre-approval': 'Pre-Approval',
		'pre_approval': 'Pre-Approval',
		purchase: 'Purchase',
		refinance: 'Refinance',
		seller: 'Seller',
		project_setup: 'Project Setup',
		sub_onboarding: 'Sub Onboarding',
		draw_request: 'Draw Request',
		tax_return: 'Tax Return',
		client_onboarding: 'Client Onboarding',
		financial_review: 'Financial Review',
		new_hire: 'New Hire',
		benefits: 'Benefits',
		performance: 'Performance',
		general: 'General',
		intake: 'Intake',
		custom: 'Custom'
	};

	const categoryVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
		'pre-approval': 'info',
		'pre_approval': 'info',
		purchase: 'success',
		refinance: 'warning',
		seller: 'default',
		project_setup: 'info',
		sub_onboarding: 'success',
		draw_request: 'warning',
		tax_return: 'info',
		client_onboarding: 'success',
		financial_review: 'warning',
		new_hire: 'info',
		benefits: 'success',
		performance: 'warning',
		general: 'default',
		intake: 'info',
		custom: 'default'
	};

	const industryCategories: Record<string, Array<{ label: string; value: string }>> = {
		real_estate: [
			{ label: 'Pre-Approval', value: 'pre-approval' },
			{ label: 'Purchase', value: 'purchase' },
			{ label: 'Refinance', value: 'refinance' },
			{ label: 'Seller', value: 'seller' },
		],
		contractors: [
			{ label: 'Project Setup', value: 'project_setup' },
			{ label: 'Sub Onboarding', value: 'sub_onboarding' },
			{ label: 'Draw Request', value: 'draw_request' },
		],
		accountants: [
			{ label: 'Tax Return', value: 'tax_return' },
			{ label: 'Client Onboarding', value: 'client_onboarding' },
			{ label: 'Financial Review', value: 'financial_review' },
		],
		hr: [
			{ label: 'New Hire', value: 'new_hire' },
			{ label: 'Benefits', value: 'benefits' },
			{ label: 'Performance', value: 'performance' },
		],
		other: [
			{ label: 'General', value: 'general' },
			{ label: 'Intake', value: 'intake' },
		],
	};

	const categoryTabs = [
		{ label: 'All', value: 'all' },
		...(industryCategories[data.industry] || []),
		{ label: 'Custom', value: 'custom' }
	];

	let filteredTemplates = $derived(() => {
		let list = data.templates;
		if (selectedCategory !== 'all') {
			list = list.filter((t: any) => t.category === selectedCategory);
		}
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((t: any) =>
				t.name.toLowerCase().includes(q) ||
				(t.description && t.description.toLowerCase().includes(q))
			);
		}
		return list;
	});

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Templates — CollectRelay</title>
</svelte:head>

<div class="templates-page">
	<div class="page-header">
		<div>
			<h1>Templates</h1>
			<p class="subtitle">Reusable checklists for your transactions.</p>
		</div>
		<button class="btn-primary" onclick={() => (showCreateModal = true)}>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			New Template
		</button>
	</div>

	<div class="filters">
		<SearchInput bind:value={searchQuery} placeholder="Search templates…" />
		<div class="filter-tabs">
			{#each categoryTabs as tab}
				<button
					class="filter-tab"
					class:active={selectedCategory === tab.value}
					onclick={() => selectedCategory = tab.value}
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	{#if filteredTemplates().length === 0}
		{#if data.templates.length === 0}
			<EmptyState message="No templates yet. Create one to get started." />
		{:else}
			<EmptyState message="No templates match your filter." />
		{/if}
	{:else}
		<div class="templates-grid">
			{#each filteredTemplates() as template}
				<div class="template-card-wrapper">
					<Card href="/app/templates/{template.id}">
						<div class="template-card">
							<div class="template-header">
								<h3 class="template-name">{template.name}</h3>
								<Badge variant={categoryVariants[template.category] ?? 'default'}>
									{categoryLabels[template.category] ?? template.category}
								</Badge>
							</div>
							{#if template.description}
								<p class="template-desc">{template.description}</p>
							{/if}
							<div class="template-meta">
								<span>Created {formatDate(template.created_at)}</span>
							</div>
						</div>
					</Card>
					<div class="card-actions">
						<form method="POST" action="?/duplicate" use:enhance>
							<input type="hidden" name="id" value={template.id} />
							<button type="submit" class="action-btn" title="Duplicate">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
									<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
								</svg>
								Duplicate
							</button>
						</form>
						<form method="POST" action="?/delete" use:enhance={() => { return async ({ update }) => { await update(); }; }}>
							<input type="hidden" name="id" value={template.id} />
							<button type="submit" class="action-btn action-delete" title="Delete">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
									<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
								</svg>
								Delete
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<Modal bind:open={showCreateModal} title="New Template">
	<form
		method="POST"
		action="?/create"
		use:enhance={() => {
			creating = true;
			return async ({ result, update }) => {
				creating = false;
				if (result.type === 'redirect') {
					showCreateModal = false;
					await update();
				} else {
					await update();
				}
			};
		}}
	>
		<div class="form-group">
			<label for="name">Name</label>
			<input type="text" id="name" name="name" required placeholder="e.g. Purchase Checklist" />
		</div>

		<div class="form-group">
			<label for="description">Description <span class="optional">(optional)</span></label>
			<textarea id="description" name="description" rows="2" placeholder="Brief description of this template"></textarea>
		</div>

		<div class="form-group">
			<label for="category">Category</label>
			<select id="category" name="category">
				<option value="custom">Custom</option>
				{#each (industryCategories[data.industry] || []) as cat}
					<option value={cat.value}>{cat.label}</option>
				{/each}
			</select>
		</div>

		{#if form?.error}
			<p class="form-error">{form.error}</p>
		{/if}

		<div class="form-actions">
			<button type="button" class="btn-secondary" onclick={() => (showCreateModal = false)}>Cancel</button>
			<button type="submit" class="btn-primary" disabled={creating}>
				{creating ? 'Creating...' : 'Create Template'}
			</button>
		</div>
	</form>
</Modal>

<style>
	.templates-page {
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

	/* Filters */
	.filters {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.filter-tabs {
		display: flex;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}

	.filter-tab {
		padding: var(--space-xs) var(--space-md);
		background: none;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		color: var(--text-secondary);
		font-size: var(--font-size-xs);
		font-weight: 500;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.filter-tab:hover {
		border-color: var(--text-tertiary);
		color: var(--text-primary);
	}

	.filter-tab.active {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--text-inverse);
	}

	/* Grid */
	.templates-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: var(--space-lg);
	}

	.template-card-wrapper {
		display: flex;
		flex-direction: column;
	}

	.template-card {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.template-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}

	.template-name {
		font-size: var(--font-size-md);
		font-weight: 600;
		color: var(--text-primary);
	}

	.template-desc {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.template-meta {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		margin-top: var(--space-xs);
	}

	/* Card actions */
	.card-actions {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-sm);
		margin-top: var(--space-xs);
	}

	.card-actions form { display: inline; }

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
</style>
