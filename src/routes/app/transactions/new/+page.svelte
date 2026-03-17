<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$components/ui/Badge.svelte';
	import { getTerms } from '$lib/terminology';

	let { data, form } = $props();

	let terms = $derived(getTerms(data.industry));

	let selectedTemplateId = $state('');
	let clientName = $state('');
	let title = $state('');
	let salePrice = $state('');
	let commissionRate = $state('');
	let commissionAmount = $state('');
	let commissionOverride = $state(false);
	let loading = $state(false);
	let previewItems = $state<Array<{ id: string; name: string; description: string | null; item_type: string; required: number; sort_order: number }>>([]);
	let loadingPreview = $state(false);

	// Auto-compute commission amount from sale price × rate
	$effect(() => {
		if (!commissionOverride && salePrice && commissionRate) {
			const price = parseFloat(salePrice);
			const rate = parseFloat(commissionRate);
			if (!isNaN(price) && !isNaN(rate)) {
				commissionAmount = (price * rate / 100).toFixed(2);
			}
		}
	});

	// Auto-generate title from template + client name
	let autoTitle = $derived(() => {
		const tpl = data.templates.find((t: any) => t.id === selectedTemplateId);
		if (tpl && clientName) return `${clientName} — ${tpl.name}`;
		if (tpl) return tpl.name;
		return '';
	});

	$effect(() => {
		const auto = autoTitle();
		if (auto && !title) {
			title = auto;
		}
	});

	async function onTemplateChange() {
		if (!selectedTemplateId) {
			previewItems = [];
			return;
		}
		loadingPreview = true;
		try {
			const res = await fetch(`/api/templates/${selectedTemplateId}`);
			if (res.ok) {
				const data = await res.json();
				previewItems = data.items;
			}
		} catch {
			previewItems = [];
		}
		loadingPreview = false;
	}

	function itemTypeLabel(type: string) {
		switch (type) {
			case 'document': return 'Doc';
			case 'question': return 'Question';
			case 'checkbox': return 'Checkbox';
			case 'signature': return 'Signature';
			default: return type;
		}
	}

	function itemTypeVariant(type: string) {
		switch (type) {
			case 'document': return 'info' as const;
			case 'question': return 'warning' as const;
			case 'checkbox': return 'default' as const;
			case 'signature': return 'success' as const;
			default: return 'default' as const;
		}
	}
</script>

<svelte:head>
	<title>{terms.newTransaction} — CollectRelay</title>
</svelte:head>

<div class="new-transaction-page">
	<div class="page-header">
		<a href="/app/transactions" class="back-link">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<path d="M19 12H5M12 19l-7-7 7-7" />
			</svg>
			{terms.backToList}
		</a>
		<h1>{terms.newTransaction}</h1>
		<p class="subtitle">Create a new {terms.request.toLowerCase()} for your client.</p>
	</div>

	{#if form?.error === 'trial_expired'}
		<div class="trial-expired-banner">
			<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
			</svg>
			<div>
				<strong>Your free trial has ended.</strong>
				<p>Choose a plan to continue creating transactions. Your existing transactions are still accessible.</p>
			</div>
			<a href="/pricing" class="trial-upgrade-btn">Choose a Plan</a>
		</div>
	{:else if form?.error}
		<div class="error-banner">{form.error}</div>
	{/if}

	<form method="POST" use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }}>
		<div class="form-layout">
			<div class="form-main">
				<div class="form-section">
					<h2>Template</h2>
					<div class="field">
						<label for="templateId">Choose a template</label>
						<select
							id="templateId"
							name="templateId"
							bind:value={selectedTemplateId}
							onchange={onTemplateChange}
							required
						>
							<option value="">Select a template…</option>
							{#each data.templates as tpl}
								<option value={tpl.id}>{tpl.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-section">
					<h2>Client Information</h2>
					<div class="field-row">
						<div class="field">
							<label for="clientName">Client name <span class="required">*</span></label>
							<input
								type="text"
								id="clientName"
								name="clientName"
								bind:value={clientName}
								placeholder="e.g. Sarah Johnson"
								required
							/>
						</div>
						<div class="field">
							<label for="clientEmail">Client email <span class="required">*</span></label>
							<input type="email" id="clientEmail" name="clientEmail" placeholder="e.g. sarah@example.com" required />
						</div>
					</div>
					<div class="field">
						<label for="clientPhone">Phone <span class="optional">(optional)</span></label>
						<input type="tel" id="clientPhone" name="clientPhone" placeholder="e.g. 555-0100" />
					</div>
				</div>

				<div class="form-section">
					<h2>{terms.transaction} Details</h2>
					<div class="field">
						<label for="title">Title <span class="required">*</span></label>
						<input type="text" id="title" name="title" bind:value={title} placeholder="e.g. 123 Main St — Buyer Package" required />
					</div>
					<div class="field">
						<label for="dueDate">Due date <span class="optional">(optional)</span></label>
						<input type="date" id="dueDate" name="dueDate" />
					</div>
				</div>

				<div class="form-section">
					<h2>Deal Details <span class="optional">(optional)</span></h2>
					<div class="field-row">
						<div class="field">
							<label for="salePrice">Sale price</label>
							<div class="input-prefix">
								<span class="prefix">$</span>
								<input
									type="number"
									id="salePrice"
									name="salePrice"
									bind:value={salePrice}
									placeholder="450,000"
									step="0.01"
									min="0"
								/>
							</div>
						</div>
						<div class="field">
							<label for="commissionRate">Commission rate</label>
							<div class="input-suffix">
								<input
									type="number"
									id="commissionRate"
									name="commissionRate"
									bind:value={commissionRate}
									placeholder="3.0"
									step="0.01"
									min="0"
									max="100"
								/>
								<span class="suffix">%</span>
							</div>
						</div>
					</div>
					<div class="field">
						<label for="commissionAmount">
							Commission amount
							{#if salePrice && commissionRate && !commissionOverride}
								<span class="computed-label">(auto-calculated)</span>
							{/if}
						</label>
						<div class="input-prefix">
							<span class="prefix">$</span>
							<input
								type="number"
								id="commissionAmount"
								name="commissionAmount"
								bind:value={commissionAmount}
								placeholder="13,500"
								step="0.01"
								min="0"
								oninput={() => commissionOverride = true}
							/>
						</div>
					</div>
				</div>

				<div class="form-actions">
					<a href="/app/transactions" class="btn-secondary">Cancel</a>
					<button type="submit" class="btn-primary" disabled={loading || !selectedTemplateId}>
						{loading ? 'Creating…' : `Create ${terms.transaction}`}
					</button>
				</div>
			</div>

			<div class="form-sidebar">
				<div class="preview-card">
					<h3>Checklist Preview</h3>
					{#if !selectedTemplateId}
						<p class="preview-empty">Select a template to see checklist items.</p>
					{:else if loadingPreview}
						<p class="preview-empty">Loading…</p>
					{:else if previewItems.length === 0}
						<p class="preview-empty">No items in this template.</p>
					{:else}
						<ul class="preview-list">
							{#each previewItems as item, i}
								<li>
									<span class="item-order">{i + 1}</span>
									<div class="item-info">
										<span class="item-name">{item.name}</span>
										<div class="item-meta">
											<Badge variant={itemTypeVariant(item.item_type)}>{itemTypeLabel(item.item_type)}</Badge>
											{#if item.required}
												<span class="item-required">Required</span>
											{/if}
										</div>
									</div>
								</li>
							{/each}
						</ul>
						<p class="preview-count">{previewItems.length} items will be created</p>
					{/if}
				</div>
			</div>
		</div>
	</form>
</div>

<style>
	.page-header {
		margin-bottom: var(--space-xl);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
		transition: color var(--transition-fast);
	}

	.back-link:hover { color: var(--text-primary); }

	h1 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.subtitle {
		color: var(--text-secondary);
	}

	.error-banner {
		padding: var(--space-md);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-xl);
	}

	.trial-expired-banner {
		display: flex;
		align-items: flex-start;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.25);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-xl);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.trial-expired-banner svg {
		color: #f59e0b;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.trial-expired-banner strong {
		display: block;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.trial-expired-banner p {
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.trial-upgrade-btn {
		padding: var(--space-sm) var(--space-lg);
		background: #f59e0b;
		color: white;
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-md);
		white-space: nowrap;
		flex-shrink: 0;
		align-self: center;
	}

	.trial-upgrade-btn:hover {
		background: #d97706;
		color: white;
	}

	.form-layout {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: var(--space-xxl);
		align-items: start;
	}

	.form-section {
		margin-bottom: var(--space-xl);
	}

	.form-section h2 {
		font-size: var(--font-size-md);
		font-weight: 600;
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-sm);
		border-bottom: 1px solid var(--border-color);
	}

	.field {
		margin-bottom: var(--space-md);
	}

	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--space-md);
	}

	label {
		display: block;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: var(--space-xs);
	}

	.required { color: var(--color-error); }
	.optional { color: var(--text-tertiary); font-weight: 400; }
	.computed-label { color: var(--color-accent); font-weight: 400; font-size: var(--font-size-xs); }

	.input-prefix, .input-suffix {
		position: relative;
		display: flex;
		align-items: center;
	}

	.input-prefix .prefix {
		position: absolute;
		left: 12px;
		color: var(--text-tertiary);
		font-size: var(--font-size-md);
		pointer-events: none;
		z-index: 1;
	}

	.input-prefix input {
		padding-left: 28px;
	}

	.input-suffix .suffix {
		position: absolute;
		right: 12px;
		color: var(--text-tertiary);
		font-size: var(--font-size-md);
		pointer-events: none;
		z-index: 1;
	}

	.input-suffix input {
		padding-right: 28px;
	}

	input, select {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-md);
		transition: border-color var(--transition-fast);
	}

	input:focus, select:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	select {
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%239ca3af' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 36px;
	}

	.form-actions {
		display: flex;
		gap: var(--space-md);
		justify-content: flex-end;
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border-color);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-sm) var(--space-xl);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.btn-primary:hover:not(:disabled) { background: var(--color-accent-hover); }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		padding: var(--space-sm) var(--space-xl);
		background: transparent;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		font-weight: 500;
		border-radius: var(--radius-md);
		border: 1px solid var(--border-color);
		transition: color var(--transition-fast), border-color var(--transition-fast);
	}

	.btn-secondary:hover { color: var(--text-primary); border-color: var(--text-tertiary); }

	/* Sidebar preview */
	.preview-card {
		position: sticky;
		top: 100px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
	}

	.preview-card h3 {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: var(--space-md);
	}

	.preview-empty {
		color: var(--text-tertiary);
		font-size: var(--font-size-sm);
		text-align: center;
		padding: var(--space-xl) 0;
	}

	.preview-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}

	.preview-list li {
		display: flex;
		gap: var(--space-sm);
		align-items: flex-start;
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		background: var(--bg-primary);
	}

	.item-order {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: var(--radius-full);
		background: var(--bg-tertiary);
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		font-weight: 600;
		flex-shrink: 0;
		margin-top: 1px;
	}

	.item-info {
		flex: 1;
		min-width: 0;
	}

	.item-name {
		display: block;
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		margin-bottom: 2px;
	}

	.item-meta {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.item-required {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	.preview-count {
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		text-align: center;
		margin-top: var(--space-md);
		padding-top: var(--space-sm);
		border-top: 1px solid var(--border-color);
	}

	@media (max-width: 768px) {
		.form-layout {
			grid-template-columns: 1fr;
		}

		.field-row {
			grid-template-columns: 1fr;
		}

		.preview-card {
			position: static;
		}
	}
</style>
