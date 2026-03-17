<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';

	let { data, form } = $props();

	// Template doc IDs that have fillable templates
	const TEMPLATE_DOC_IDS = new Set([
		'sys-agent-01', 'sys-agent-03', 'sys-agent-05',
		'sys-ctr-03', 'sys-ctr-04', 'sys-ctr-05',
		'sys-gen-01', 'sys-gen-02', 'sys-gen-03',
	]);

	// Template field definitions (client-side mirror for modal rendering)
	const TEMPLATE_FIELDS: Record<string, { title: string; fields: Array<{ name: string; label: string; type: string; section: string }> }> = {
		'sys-agent-01': { title: 'Purchase Agreement', fields: [
			{ name: 'proName', label: 'Agent Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Agent Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Agent Phone', type: 'text', section: 'pro' },
			{ name: 'buyerName', label: 'Buyer Name', type: 'text', section: 'client' },
			{ name: 'sellerName', label: 'Seller Name', type: 'text', section: 'client' },
			{ name: 'propertyAddress', label: 'Property Address', type: 'text', section: 'client' },
			{ name: 'purchasePrice', label: 'Purchase Price', type: 'text', section: 'client' },
			{ name: 'closingDate', label: 'Closing Date', type: 'date', section: 'client' },
		]},
		'sys-agent-03': { title: 'Seller Disclosure Statement', fields: [
			{ name: 'proName', label: 'Agent Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Agent Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Agent Phone', type: 'text', section: 'pro' },
			{ name: 'sellerName', label: 'Seller Name', type: 'text', section: 'client' },
			{ name: 'propertyAddress', label: 'Property Address', type: 'text', section: 'client' },
		]},
		'sys-agent-05': { title: 'Buyer Agency Agreement', fields: [
			{ name: 'proName', label: 'Agent Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Agent Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Agent Phone', type: 'text', section: 'pro' },
			{ name: 'buyerName', label: 'Buyer Name', type: 'text', section: 'client' },
			{ name: 'buyerAddress', label: 'Buyer Address', type: 'text', section: 'client' },
			{ name: 'startDate', label: 'Agreement Start Date', type: 'date', section: 'client' },
			{ name: 'endDate', label: 'Agreement End Date', type: 'date', section: 'client' },
		]},
		'sys-ctr-03': { title: 'Subcontractor Agreement', fields: [
			{ name: 'proName', label: 'Contractor Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Contractor Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Contractor Phone', type: 'text', section: 'pro' },
			{ name: 'subName', label: 'Subcontractor Name', type: 'text', section: 'client' },
			{ name: 'subAddress', label: 'Subcontractor Address', type: 'text', section: 'client' },
			{ name: 'projectName', label: 'Project Name', type: 'text', section: 'client' },
			{ name: 'projectAddress', label: 'Project Address', type: 'text', section: 'client' },
			{ name: 'startDate', label: 'Start Date', type: 'date', section: 'client' },
		]},
		'sys-ctr-04': { title: 'Change Order Form', fields: [
			{ name: 'proName', label: 'Contractor Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Contractor Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Contractor Phone', type: 'text', section: 'pro' },
			{ name: 'clientName', label: 'Owner/Client Name', type: 'text', section: 'client' },
			{ name: 'projectName', label: 'Project Name', type: 'text', section: 'client' },
			{ name: 'changeOrderNumber', label: 'Change Order #', type: 'text', section: 'client' },
		]},
		'sys-ctr-05': { title: 'Notice to Proceed', fields: [
			{ name: 'proName', label: 'Contractor Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Contractor Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Contractor Phone', type: 'text', section: 'pro' },
			{ name: 'clientName', label: 'Owner/Client Name', type: 'text', section: 'client' },
			{ name: 'projectName', label: 'Project Name', type: 'text', section: 'client' },
			{ name: 'projectAddress', label: 'Project Address', type: 'text', section: 'client' },
			{ name: 'proceedDate', label: 'Proceed Date', type: 'date', section: 'client' },
		]},
			'sys-gen-01': { title: 'Non-Disclosure Agreement', fields: [
			{ name: 'proName', label: 'Your Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Your Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Your Phone', type: 'text', section: 'pro' },
			{ name: 'recipientName', label: 'Recipient Name', type: 'text', section: 'client' },
			{ name: 'recipientAddress', label: 'Recipient Address', type: 'text', section: 'client' },
			{ name: 'effectiveDate', label: 'Effective Date', type: 'date', section: 'client' },
		]},
		'sys-gen-02': { title: 'Service Agreement', fields: [
			{ name: 'proName', label: 'Provider Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Provider Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Provider Phone', type: 'text', section: 'pro' },
			{ name: 'clientName', label: 'Client Name', type: 'text', section: 'client' },
			{ name: 'clientAddress', label: 'Client Address', type: 'text', section: 'client' },
			{ name: 'startDate', label: 'Start Date', type: 'date', section: 'client' },
		]},
		'sys-gen-03': { title: 'Invoice', fields: [
			{ name: 'proName', label: 'Your Name', type: 'text', section: 'pro' },
			{ name: 'proEmail', label: 'Your Email', type: 'text', section: 'pro' },
			{ name: 'proPhone', label: 'Your Phone', type: 'text', section: 'pro' },
			{ name: 'clientName', label: 'Bill To (Name)', type: 'text', section: 'client' },
			{ name: 'clientAddress', label: 'Bill To (Address)', type: 'text', section: 'client' },
			{ name: 'invoiceNumber', label: 'Invoice #', type: 'text', section: 'client' },
			{ name: 'invoiceDate', label: 'Invoice Date', type: 'date', section: 'client' },
		]},
	};

	const industryTabs: Record<string, Array<{ label: string; value: string; icon: string }>> = {
		real_estate: [
			{ label: 'Lender Forms', value: 'lender', icon: 'building' },
			{ label: 'Agent Forms', value: 'agent', icon: 'person' },
		],
		contractors: [
			{ label: 'Contracts', value: 'contracts', icon: 'building' },
			{ label: 'Compliance', value: 'compliance', icon: 'shield' },
		],
		other: [
			{ label: 'General', value: 'general', icon: 'building' },
		],
	};

	const baseTabs = industryTabs[data.industry] || industryTabs['other'];
	const tabs = [...baseTabs, { label: 'Custom', value: 'custom', icon: 'building' }];
	let activeTab = $state(tabs[0]?.value || 'general');
	let showAddModal = $state(false);
	let adding = $state(false);

	// Template modal state
	let showTemplateModal = $state(false);
	let templateDocId = $state('');
	let generating = $state(false);

	const categoryLabels: Record<string, string> = {
		lender: 'Lender', agent: 'Agent',
		contracts: 'Contracts', compliance: 'Compliance',
		general: 'General', custom: 'Custom'
	};

	const categoryVariants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
		lender: 'info', agent: 'success',
		contracts: 'info', compliance: 'warning',
		general: 'default', custom: 'default'
	};

	let filteredDocs = $derived(() => {
		return data.documents.filter((d: any) => d.category === activeTab);
	});

	let currentTemplate = $derived(() => {
		return templateDocId ? TEMPLATE_FIELDS[templateDocId] : null;
	});

	function formatFileSize(bytes: number | null): string {
		if (bytes == null) return '';
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function openTemplateModal(docId: string) {
		templateDocId = docId;
		showTemplateModal = true;
	}

	function getDefaultValue(fieldName: string): string {
		if (fieldName === 'proName') return data.userProfile?.name || '';
		if (fieldName === 'proEmail') return data.userProfile?.email || '';
		if (fieldName === 'proPhone') return data.userProfile?.phone || '';
		return '';
	}
</script>

<svelte:head>
	<title>Document Center — CollectRelay</title>
</svelte:head>

<div class="documents-page">
	<div class="page-header">
		<div>
			<h1>Document Center</h1>
			<p class="subtitle">Standard forms and documents for your transactions.</p>
		</div>
		<button class="btn-primary" onclick={() => (showAddModal = true)}>
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			Add Document
		</button>
	</div>

	{#if form?.generated}
		<div class="success-banner">
			Template generated successfully! Check the Custom tab for your new document.
		</div>
	{/if}

	<!-- Tabs -->
	<div class="tabs">
		{#each tabs as tab}
			<button
				class="tab"
				class:active={activeTab === tab.value}
				onclick={() => activeTab = tab.value}
			>
				{#if tab.icon === 'building'}
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<rect x="2" y="3" width="20" height="18" rx="2"/><path d="M2 9h20"/><path d="M10 3v6"/>
					</svg>
				{:else if tab.icon === 'person'}
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/>
					</svg>
				{:else if tab.icon === 'shield'}
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
						<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
					</svg>
				{/if}
				{tab.label}
			</button>
		{/each}
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
						<!-- Gov Source link -->
						{#if doc.external_url}
							<a href={doc.external_url} target="_blank" rel="noopener noreferrer" class="action-btn action-gov">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
								</svg>
								Gov Source
							</a>
						{/if}

						<!-- Download button (for docs with files) -->
						{#if doc.filename && doc.r2_key}
							<a href="/api/documents/{doc.id}/download" class="action-btn action-download">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
								</svg>
								Download
							</a>
						{/if}

						<!-- Generate Template button -->
						{#if TEMPLATE_DOC_IDS.has(doc.id)}
							<button class="action-btn action-generate" onclick={() => openTemplateModal(doc.id)}>
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.636 5.636l2.122 2.122m8.484 8.484l2.122 2.122M5.636 18.364l2.122-2.122m8.484-8.484l2.122-2.122"/>
								</svg>
								Generate
							</button>
						{/if}

						<!-- Upload button -->
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
				{#each tabs as tab}
					<option value={tab.value}>{tab.label}</option>
				{/each}
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

<!-- Generate Template Modal -->
<Modal bind:open={showTemplateModal} title={currentTemplate()?.title || 'Generate Template'}>
	{#if currentTemplate()}
		<form
			method="POST"
			action="?/generateTemplate"
			use:enhance={() => {
				generating = true;
				return async ({ result, update }) => {
					generating = false;
					if (result.type === 'success') {
						showTemplateModal = false;
					}
					await update();
				};
			}}
		>
			<input type="hidden" name="documentId" value={templateDocId} />

			<p class="template-intro">Fill in the details below. Your company info is pre-filled. The template text can be edited before generating.</p>

			<!-- Document name -->
			<div class="form-group">
				<label for="tpl-docName">Document Name</label>
				<input
					type="text"
					id="tpl-docName"
					name="docName"
					required
					placeholder="e.g. Smith Residence - Subcontractor Agreement"
				/>
				<span class="field-hint">This will be the title and filename. Use the client name or project to keep it organized.</span>
			</div>

			<!-- Pro info fields -->
			<div class="field-section">
				<h4 class="field-section-title">Your Information</h4>
				{#each (currentTemplate()?.fields || []).filter(f => f.section === 'pro') as field}
					<div class="form-group">
						<label for="tpl-{field.name}">{field.label}</label>
						<input
							type={field.type}
							id="tpl-{field.name}"
							name={field.name}
							value={getDefaultValue(field.name)}
						/>
					</div>
				{/each}
			</div>

			<!-- Client info fields -->
			<div class="field-section">
				<h4 class="field-section-title">Client / Recipient Information</h4>
				{#each (currentTemplate()?.fields || []).filter(f => f.section === 'client') as field}
					<div class="form-group">
						<label for="tpl-{field.name}">{field.label}</label>
						<input
							type={field.type}
							id="tpl-{field.name}"
							name={field.name}
						/>
					</div>
				{/each}
			</div>

			<!-- Body text -->
			<div class="field-section">
				<h4 class="field-section-title">Document Content</h4>
				<div class="form-group">
					<label for="tpl-bodyText">Template Text <span class="optional">(editable)</span></label>
					<textarea id="tpl-bodyText" name="bodyText" rows="12" class="body-textarea"></textarea>
				</div>
			</div>

			<div class="form-actions">
				<button type="button" class="btn-secondary" onclick={() => (showTemplateModal = false)}>Cancel</button>
				<button type="submit" class="btn-primary" disabled={generating}>
					{#if generating}
						Generating...
					{:else}
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
							<path d="M12 3v3m0 12v3M3 12h3m12 0h3"/>
						</svg>
						Generate PDF
					{/if}
				</button>
			</div>
		</form>
	{/if}
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

	.success-banner {
		padding: var(--space-sm) var(--space-lg);
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.3);
		border-radius: var(--radius-md);
		color: #10b981;
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-xl);
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
		flex-wrap: wrap;
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
		text-decoration: none;
	}

	.action-btn:hover {
		color: var(--text-primary);
		background: var(--bg-tertiary);
	}

	.action-delete:hover {
		color: var(--color-error);
		background: rgba(239, 68, 68, 0.1);
	}

	.action-gov:hover {
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
	}

	.action-download:hover {
		color: #3b82f6;
		background: rgba(59, 130, 246, 0.1);
	}

	.action-generate {
		color: #8b5cf6;
	}

	.action-generate:hover {
		color: #a78bfa;
		background: rgba(139, 92, 246, 0.1);
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

	/* Template modal */
	.template-intro {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-lg);
		line-height: 1.5;
	}

	.field-section {
		margin-bottom: var(--space-lg);
	}

	.field-section-title {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-md);
		padding-bottom: var(--space-xs);
		border-bottom: 1px solid var(--border-color);
	}

	.field-hint {
		display: block;
		font-size: 11px;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.body-textarea {
		font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
		font-size: 12px !important;
		line-height: 1.6;
	}

	@media (max-width: 768px) {
		.documents-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
