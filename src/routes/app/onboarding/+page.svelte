<script lang="ts">
	import { enhance } from '$app/forms';
	import Spinner from '$components/ui/Spinner.svelte';
	import Badge from '$components/ui/Badge.svelte';

	let { data, form } = $props();

	// Determine starting step from form result
	let step = $state(
		form?.step === 2 ? 2 :
		form?.step === 3 ? 3 :
		form?.step === 4 ? 4 : 1
	);
	let loading = $state(false);

	// Step 1: Industry selection
	let selectedIndustry = $state(data.industry || '');

	// Step 2: Profile
	let name = $state(data.userName || '');
	let company = $state(data.userCompany || '');
	let phone = $state(data.userPhone || '');

	// Step 3: Template selection
	let selectedTemplateId = $state('');
	let selectedTemplateName = $state('');

	// Step 4: First transaction
	let clientName = $state('');
	let clientEmail = $state('');
	let title = $state('');

	const industries = [
		{
			value: 'real_estate',
			label: 'Real Estate',
			desc: 'Mortgage, title, and real estate transactions',
			icon: 'house'
		},
		{
			value: 'contractors',
			label: 'Contractors',
			desc: 'Construction projects, permits, and subcontractors',
			icon: 'hardhat'
		},
		{
			value: 'accountants',
			label: 'Accountants',
			desc: 'Tax returns, financial reviews, and client onboarding',
			icon: 'calculator'
		},
		{
			value: 'hr',
			label: 'HR & Human Resources',
			desc: 'Employee onboarding, benefits, and compliance',
			icon: 'people'
		},
		{
			value: 'other',
			label: 'Other',
			desc: 'General document collection for any industry',
			icon: 'briefcase'
		}
	];

	const allCategoryLabels: Record<string, string> = {
		'pre_approval': 'Pre-Approval',
		'pre-approval': 'Pre-Approval',
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

	const allCategoryColors: Record<string, string> = {
		'pre_approval': 'warning',
		'pre-approval': 'warning',
		purchase: 'success',
		refinance: 'info',
		seller: 'accent',
		project_setup: 'info',
		sub_onboarding: 'success',
		draw_request: 'warning',
		tax_return: 'info',
		client_onboarding: 'success',
		financial_review: 'warning',
		new_hire: 'info',
		benefits: 'success',
		performance: 'warning',
		general: 'neutral',
		intake: 'info',
		custom: 'neutral'
	};

	function selectTemplate(id: string, templateName: string) {
		selectedTemplateId = id;
		selectedTemplateName = templateName;
	}

	function goToStep4() {
		if (!selectedTemplateId) return;
		step = 4;
		title = selectedTemplateName;
	}

	$effect(() => {
		if (clientName && selectedTemplateName) {
			title = `${clientName} — ${selectedTemplateName}`;
		}
	});
</script>

<svelte:head>
	<title>Welcome — CollectRelay</title>
</svelte:head>

<div class="onboarding">
	<div class="onboarding-header">
		<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
			<rect width="32" height="32" rx="6" fill="var(--bg-tertiary)"/>
			<path d="M8 10h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
			<path d="M8 16h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-hover)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
			<path d="M8 22h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-dim)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
		</svg>
		<span class="logo-text">CollectRelay</span>
	</div>

	<!-- Step indicator (4 steps) -->
	<div class="steps">
		<div class="step-dot" class:active={step >= 1} class:done={step > 1}>
			{#if step > 1}<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>{:else}1{/if}
		</div>
		<div class="step-line" class:active={step >= 2}></div>
		<div class="step-dot" class:active={step >= 2} class:done={step > 2}>
			{#if step > 2}<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>{:else}2{/if}
		</div>
		<div class="step-line" class:active={step >= 3}></div>
		<div class="step-dot" class:active={step >= 3} class:done={step > 3}>
			{#if step > 3}<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>{:else}3{/if}
		</div>
		<div class="step-line" class:active={step >= 4}></div>
		<div class="step-dot" class:active={step >= 4}>4</div>
	</div>

	<div class="onboarding-card">
		{#if form?.error && form.error !== 'trial_expired'}
			<div class="error-banner">{form.error}</div>
		{/if}

		<!-- STEP 1: Choose Industry -->
		{#if step === 1}
			<h1>What industry are you in?</h1>
			<p class="subtitle">We'll set up your workspace with templates and categories tailored to your workflow.</p>

			<form method="POST" action="?/setIndustry" use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'success') {
						step = 2;
					} else {
						await update();
					}
				};
			}}>
				<input type="hidden" name="industry" value={selectedIndustry} />
				<div class="industry-grid">
					{#each industries as ind}
						<button
							type="button"
							class="industry-card"
							class:selected={selectedIndustry === ind.value}
							onclick={() => { selectedIndustry = ind.value; }}
						>
							<div class="industry-icon">
								{#if ind.icon === 'house'}
									<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
									</svg>
								{:else if ind.icon === 'hardhat'}
									<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M2 18h20M4 18v-3a8 8 0 0116 0v3"/><path d="M12 2v5"/><path d="M8 7h8"/>
									</svg>
								{:else if ind.icon === 'calculator'}
									<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/>
									</svg>
								{:else if ind.icon === 'people'}
									<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
									</svg>
								{:else}
									<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
										<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
									</svg>
								{/if}
							</div>
							<span class="industry-label">{ind.label}</span>
							<span class="industry-desc">{ind.desc}</span>
							{#if selectedIndustry === ind.value}
								<div class="selected-check">
									<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="9" fill="var(--color-accent)" /><path d="M6 10l3 3 5-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
								</div>
							{/if}
						</button>
					{/each}
				</div>
				<div class="actions">
					<button type="submit" class="btn-primary" disabled={loading || !selectedIndustry}>
						{#if loading}<Spinner size={14} />{/if}
						Continue
					</button>
				</div>
			</form>

		<!-- STEP 2: Profile -->
		{:else if step === 2}
			<h1>Set up your profile</h1>
			<p class="subtitle">Tell us a bit about yourself. This takes less than a minute.</p>

			<form method="POST" action="?/updateProfile" use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type === 'success') {
						step = 3;
					} else {
						await update();
					}
				};
			}}>
				<div class="form-group">
					<label for="name">Full Name <span class="required">*</span></label>
					<input type="text" id="name" name="name" bind:value={name} required placeholder="Your full name" />
				</div>
				<div class="form-row">
					<div class="form-group">
						<label for="company">Company <span class="optional">(optional)</span></label>
						<input type="text" id="company" name="company" bind:value={company} placeholder="Your company name" />
					</div>
					<div class="form-group">
						<label for="phone">Phone <span class="optional">(optional)</span></label>
						<input type="tel" id="phone" name="phone" bind:value={phone} placeholder="555-000-0000" />
					</div>
				</div>
				<div class="actions">
					<button type="button" class="btn-secondary" onclick={() => { step = 1; }}>Back</button>
					<button type="submit" class="btn-primary" disabled={loading || !name.trim()}>
						{#if loading}<Spinner size={14} />{/if}
						Continue
					</button>
				</div>
			</form>

		<!-- STEP 3: Choose Template -->
		{:else if step === 3}
			<h1>Choose a template</h1>
			<p class="subtitle">Pick a checklist template that matches your workflow. You can customize it later.</p>

			<div class="template-grid">
				{#each data.templates as template}
					<button
						type="button"
						class="template-card"
						class:selected={selectedTemplateId === template.id}
						onclick={() => selectTemplate(template.id, template.name)}
					>
						<div class="template-card-header">
							<span class="template-name">{template.name}</span>
							<Badge color={allCategoryColors[template.category] || 'neutral'}>
								{allCategoryLabels[template.category] ?? template.category}
							</Badge>
						</div>
						{#if template.description}
							<p class="template-desc">{template.description}</p>
						{/if}
						{#if selectedTemplateId === template.id}
							<div class="selected-check">
								<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="9" fill="var(--color-accent)" /><path d="M6 10l3 3 5-5" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
							</div>
						{/if}
					</button>
				{/each}
			</div>

			<div class="actions">
				<button type="button" class="btn-secondary" onclick={() => { step = 2; }}>Back</button>
				<button type="button" class="btn-primary" disabled={!selectedTemplateId} onclick={goToStep4}>
					Continue
				</button>
			</div>

		<!-- STEP 4: Create First Transaction -->
		{:else if step === 4}
			<h1>Create your first transaction</h1>
			<p class="subtitle">Enter your client's info below. They'll receive a magic link to start uploading documents.</p>

			<div class="template-selected">
				<span>Template:</span>
				<Badge color={allCategoryColors[data.templates.find(t => t.id === selectedTemplateId)?.category || ''] || 'neutral'}>
					{selectedTemplateName}
				</Badge>
				<button type="button" class="change-link" onclick={() => { step = 3; }}>Change</button>
			</div>

			<form method="POST" action="?/createFirstTransaction" use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}>
				<input type="hidden" name="templateId" value={selectedTemplateId} />
				<div class="form-row">
					<div class="form-group">
						<label for="clientName">Client Name <span class="required">*</span></label>
						<input type="text" id="clientName" name="clientName" bind:value={clientName} required placeholder="e.g. Sarah Johnson" />
					</div>
					<div class="form-group">
						<label for="clientEmail">Client Email <span class="required">*</span></label>
						<input type="email" id="clientEmail" name="clientEmail" bind:value={clientEmail} required placeholder="e.g. sarah@example.com" />
					</div>
				</div>
				<div class="form-group">
					<label for="title">Transaction Title <span class="required">*</span></label>
					<input type="text" id="title" name="title" bind:value={title} required placeholder="e.g. 123 Main St — Buyer Package" />
				</div>
				<div class="actions">
					<button type="button" class="btn-secondary" onclick={() => { step = 3; }}>Back</button>
					<button type="submit" class="btn-primary" disabled={loading || !clientName.trim() || !clientEmail.trim() || !title.trim()}>
						{#if loading}<Spinner size={14} />{/if}
						Create Transaction
					</button>
				</div>
			</form>
		{/if}

	</div>
</div>

<style>
	/* Hide the app sidebar and expand content */
	:global(.sidebar) { display: none !important; }
	:global(.content) { margin-left: 0 !important; max-width: 100% !important; padding: 0 !important; }

	.onboarding {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 2rem 1rem;
		background: var(--bg-primary);
	}

	.onboarding-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	/* Step indicator */
	.steps {
		display: flex;
		align-items: center;
		gap: 0;
		margin-bottom: 2rem;
	}

	.step-dot {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 600;
		background: var(--bg-tertiary);
		color: var(--text-muted);
		border: 2px solid var(--border-color);
		transition: all 0.2s;
	}

	.step-dot.active {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
	}

	.step-dot.done {
		background: var(--color-accent);
		color: white;
		border-color: var(--color-accent);
	}

	.step-line {
		width: 48px;
		height: 2px;
		background: var(--border-color);
		transition: background 0.2s;
	}

	.step-line.active {
		background: var(--color-accent);
	}

	/* Card */
	.onboarding-card {
		width: 100%;
		max-width: 640px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: 12px;
		padding: 2rem;
	}

	h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 0.25rem;
	}

	.subtitle {
		color: var(--text-muted);
		font-size: 0.875rem;
		margin: 0 0 1.5rem;
	}

	/* Industry grid */
	.industry-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.industry-card {
		position: relative;
		text-align: left;
		padding: 1.25rem 1rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-color);
		border-radius: 8px;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.industry-card:hover {
		border-color: var(--text-muted);
		background: var(--bg-tertiary);
	}

	.industry-card.selected {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, var(--bg-primary));
	}

	.industry-icon {
		color: var(--color-accent);
		margin-bottom: 0.25rem;
	}

	.industry-label {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.industry-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		line-height: 1.4;
	}

	/* Form elements */
	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 0.35rem;
	}

	.required { color: var(--color-danger); }
	.optional { color: var(--text-muted); font-weight: 400; }

	.form-group input {
		width: 100%;
		padding: 0.625rem 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.875rem;
		outline: none;
		transition: border-color 0.15s;
	}

	.form-group input:focus {
		border-color: var(--color-accent);
	}

	.form-group input::placeholder {
		color: var(--text-muted);
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	/* Actions */
	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.625rem 1.5rem;
		background: var(--color-accent);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.btn-primary:hover:not(:disabled) { opacity: 0.9; }
	.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

	.btn-secondary {
		padding: 0.625rem 1.25rem;
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: border-color 0.15s;
	}

	.btn-secondary:hover { border-color: var(--text-muted); }

	/* Template grid */
	.template-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.template-card {
		position: relative;
		text-align: left;
		padding: 1rem;
		background: var(--bg-primary);
		border: 2px solid var(--border-color);
		border-radius: 8px;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
	}

	.template-card:hover {
		border-color: var(--text-muted);
		background: var(--bg-tertiary);
	}

	.template-card.selected {
		border-color: var(--color-accent);
		background: color-mix(in srgb, var(--color-accent) 8%, var(--bg-primary));
	}

	.template-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		margin-bottom: 0.35rem;
	}

	.template-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.template-desc {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
		line-height: 1.4;
	}

	.selected-check {
		position: absolute;
		top: -8px;
		right: -8px;
	}

	/* Template selected banner (step 4) */
	.template-selected {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: 6px;
		margin-bottom: 1.25rem;
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.change-link {
		margin-left: auto;
		background: none;
		border: none;
		color: var(--color-accent);
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: underline;
	}

	/* Error */
	.error-banner {
		padding: 0.625rem 0.75rem;
		background: color-mix(in srgb, var(--color-danger) 12%, var(--bg-primary));
		border: 1px solid var(--color-danger);
		border-radius: 6px;
		color: var(--color-danger);
		font-size: 0.8125rem;
		margin-bottom: 1rem;
	}

	@media (max-width: 640px) {
		.form-row { grid-template-columns: 1fr; }
		.template-grid { grid-template-columns: 1fr; }
		.industry-grid { grid-template-columns: 1fr; }
		.onboarding-card { padding: 1.25rem; }
		.step-line { width: 32px; }
	}
</style>
