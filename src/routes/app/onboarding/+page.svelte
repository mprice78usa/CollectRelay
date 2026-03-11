<script lang="ts">
	import { enhance } from '$app/forms';
	import Spinner from '$components/ui/Spinner.svelte';
	import Badge from '$components/ui/Badge.svelte';

	let { data, form } = $props();

	let step = $state(form?.step === 2 ? 2 : form?.step === 3 ? 3 : 1);
	let loading = $state(false);

	// Step 1: Profile
	let name = $state(data.userName || '');
	let company = $state(data.userCompany || '');
	let phone = $state(data.userPhone || '');

	// Step 2: Template selection
	let selectedTemplateId = $state('');
	let selectedTemplateName = $state('');

	// Step 3: First transaction
	let clientName = $state('');
	let clientEmail = $state('');
	let title = $state('');

	const categoryLabels: Record<string, string> = {
		'pre_approval': 'Pre-Approval',
		'pre-approval': 'Pre-Approval',
		purchase: 'Purchase',
		refinance: 'Refinance',
		seller: 'Seller',
		custom: 'Custom'
	};

	const categoryColors: Record<string, string> = {
		'pre_approval': 'warning',
		'pre-approval': 'warning',
		purchase: 'success',
		refinance: 'info',
		seller: 'accent',
		custom: 'neutral'
	};

	function selectTemplate(id: string, templateName: string) {
		selectedTemplateId = id;
		selectedTemplateName = templateName;
	}

	function goToStep3() {
		if (!selectedTemplateId) return;
		step = 3;
		// Auto-generate title when client name changes
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

	<!-- Step indicator -->
	<div class="steps">
		<div class="step-dot" class:active={step >= 1} class:done={step > 1}>
			{#if step > 1}<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>{:else}1{/if}
		</div>
		<div class="step-line" class:active={step >= 2}></div>
		<div class="step-dot" class:active={step >= 2} class:done={step > 2}>
			{#if step > 2}<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8l3 3 7-7" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>{:else}2{/if}
		</div>
		<div class="step-line" class:active={step >= 3}></div>
		<div class="step-dot" class:active={step >= 3}>3</div>
	</div>

	<div class="onboarding-card">
		{#if form?.error && form.error !== 'trial_expired'}
			<div class="error-banner">{form.error}</div>
		{/if}

		<!-- STEP 1: Profile -->
		{#if step === 1}
			<h1>Welcome to CollectRelay</h1>
			<p class="subtitle">Let's get your profile set up. This takes less than a minute.</p>

			<form method="POST" action="?/updateProfile" use:enhance={() => {
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
					<button type="submit" class="btn-primary" disabled={loading || !name.trim()}>
						{#if loading}<Spinner size={14} />{/if}
						Continue
					</button>
				</div>
			</form>

		<!-- STEP 2: Choose Template -->
		{:else if step === 2}
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
							<Badge color={categoryColors[template.category] || 'neutral'}>
								{categoryLabels[template.category] ?? template.category}
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
				<button type="button" class="btn-secondary" onclick={() => { step = 1; }}>Back</button>
				<button type="button" class="btn-primary" disabled={!selectedTemplateId} onclick={goToStep3}>
					Continue
				</button>
			</div>

		<!-- STEP 3: Create First Transaction -->
		{:else if step === 3}
			<h1>Create your first transaction</h1>
			<p class="subtitle">Enter your client's info below. They'll receive a magic link to start uploading documents.</p>

			<div class="template-selected">
				<span>Template:</span>
				<Badge color={categoryColors[data.templates.find(t => t.id === selectedTemplateId)?.category || ''] || 'neutral'}>
					{selectedTemplateName}
				</Badge>
				<button type="button" class="change-link" onclick={() => { step = 2; }}>Change</button>
			</div>

			<form method="POST" action="?/createFirstTransaction" use:enhance={() => {
				loading = true;
				return async ({ result, update }) => {
					loading = false;
					if (result.type !== 'redirect') {
						await update();
					}
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
					<button type="button" class="btn-secondary" onclick={() => { step = 2; }}>Back</button>
					<button type="submit" class="btn-primary" disabled={loading || !clientName.trim() || !clientEmail.trim() || !title.trim()}>
						{#if loading}<Spinner size={14} />{/if}
						Create Transaction
					</button>
				</div>
			</form>
		{/if}

		<form method="POST" action="?/skip" use:enhance class="skip-form">
			<button type="submit" class="skip-link">Skip for now</button>
		</form>
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
		width: 60px;
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

	/* Template selected banner (step 3) */
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

	/* Skip */
	.skip-form {
		text-align: center;
		margin-top: 1.25rem;
	}

	.skip-link {
		background: none;
		border: none;
		color: var(--text-muted);
		font-size: 0.75rem;
		cursor: pointer;
		text-decoration: underline;
		opacity: 0.7;
		transition: opacity 0.15s;
	}

	.skip-link:hover { opacity: 1; }

	@media (max-width: 640px) {
		.form-row { grid-template-columns: 1fr; }
		.template-grid { grid-template-columns: 1fr; }
		.onboarding-card { padding: 1.25rem; }
	}
</style>
