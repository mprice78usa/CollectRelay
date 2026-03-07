<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import Spinner from '$components/ui/Spinner.svelte';

	let { form } = $props();
	let loading = $state(false);

	// Carry plan selection from pricing page through registration
	let plan = $derived($page.url.searchParams.get('plan') || '');
	let billing = $derived($page.url.searchParams.get('billing') || '');
</script>

<svelte:head>
	<title>Create Account — CollectRelay</title>
</svelte:head>

<div class="auth-page">
	<div class="auth-card">
		<a href="/" class="logo">
			<svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true">
				<rect width="32" height="32" rx="6" fill="var(--bg-tertiary)"/>
				<path d="M8 10h10a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
				<path d="M8 16h12a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-hover)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
				<path d="M8 22h8a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2H8" stroke="var(--color-accent-dim)" stroke-width="2.5" stroke-linecap="round" fill="none"/>
			</svg>
			<span>CollectRelay</span>
		</a>

		<h1>Create your account</h1>
		<p class="subtitle">Start collecting documents in minutes.</p>

		{#if form?.error}
			<div class="error-banner">{form.error}</div>
		{/if}

		<form method="POST" use:enhance={() => {
			loading = true;
			return async ({ result, update }) => {
				if (result.type === 'redirect') {
					// Use full page navigation for all redirects (needed for external URLs like Stripe)
					window.location.href = result.location;
					return;
				}
				loading = false;
				await update();
			};
		}}>
			{#if plan}
				<input type="hidden" name="plan" value={plan} />
				<input type="hidden" name="billing" value={billing} />
			{/if}
			<div class="field">
				<label for="name">Full name</label>
				<input id="name" name="name" type="text" required value={form?.name ?? ''} autocomplete="name" />
			</div>

			<div class="field">
				<label for="email">Email</label>
				<input id="email" name="email" type="email" required value={form?.email ?? ''} autocomplete="email" />
			</div>

			<div class="field">
				<label for="password">Password</label>
				<input id="password" name="password" type="password" required minlength="8" autocomplete="new-password" />
				<span class="hint">At least 8 characters</span>
			</div>

			<div class="field">
				<label for="company">Company <span class="optional">(optional)</span></label>
				<input id="company" name="company" type="text" value={form?.company ?? ''} autocomplete="organization" />
			</div>

			<button type="submit" class="btn-submit" disabled={loading}>
				{#if loading}
					<Spinner size={16} /> Creating account...
				{:else}
					Create account
				{/if}
			</button>
		</form>

		<p class="footer-link">Already have an account? <a href="/login">Log in</a></p>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-xl);
	}

	.auth-card {
		width: 100%;
		max-width: 420px;
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl);
		padding: var(--space-3xl);
	}

	.logo {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-primary);
		font-size: var(--font-size-lg);
		font-weight: 700;
		margin-bottom: var(--space-xxl);
	}

	.logo:hover { color: var(--text-primary); }

	h1 {
		font-size: var(--font-size-xxl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.subtitle {
		color: var(--text-secondary);
		margin-bottom: var(--space-xxl);
	}

	.error-banner {
		padding: var(--space-md);
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-lg);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: var(--space-lg);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-secondary);
	}

	.optional {
		color: var(--text-muted);
		font-weight: 400;
	}

	input {
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-input);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-md);
		outline: none;
		transition: border-color var(--transition-fast);
	}

	input:focus {
		border-color: var(--color-accent);
	}

	.hint {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.btn-submit {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		padding: var(--space-md);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-md);
		font-weight: 600;
		border: none;
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
		margin-top: var(--space-sm);
	}

	.btn-submit:hover:not(:disabled) { background: var(--color-accent-hover); }
	.btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

	.footer-link {
		text-align: center;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin-top: var(--space-xl);
	}
</style>
