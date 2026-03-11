<script lang="ts">
	import { enhance } from '$app/forms';
	import Card from '$components/ui/Card.svelte';

	let { data, form } = $props();
	let accepting = $state(false);
</script>

<svelte:head>
	<title>Team Invitation — CollectRelay</title>
</svelte:head>

<div class="invite-page">
	{#if data.error === 'invalid'}
		<Card>
			<div class="invite-status">
				<div class="status-icon error">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
					</svg>
				</div>
				<h2>Invalid Invitation</h2>
				<p>This invitation link is invalid or has been revoked.</p>
				<a href="/app" class="btn-primary">Go to Dashboard</a>
			</div>
		</Card>
	{:else if data.error === 'expired'}
		<Card>
			<div class="invite-status">
				<div class="status-icon warning">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
					</svg>
				</div>
				<h2>Invitation Expired</h2>
				<p>This invitation has expired. Please ask the team admin to send a new one.</p>
				<a href="/app" class="btn-primary">Go to Dashboard</a>
			</div>
		</Card>
	{:else if data.error === 'already_accepted'}
		<Card>
			<div class="invite-status">
				<div class="status-icon success">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
					</svg>
				</div>
				<h2>Already Accepted</h2>
				<p>This invitation has already been accepted.</p>
				<a href="/app" class="btn-primary">Go to Dashboard</a>
			</div>
		</Card>
	{:else if data.invitation}
		<Card>
			<div class="invite-content">
				<div class="invite-header">
					<div class="invite-icon">
						<svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
							<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
						</svg>
					</div>
					<h2>You've Been Invited</h2>
				</div>

				<div class="invite-details">
					<div class="detail-row">
						<span class="detail-label">Workspace</span>
						<span class="detail-value">{data.invitation.workspaceName}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Invited by</span>
						<span class="detail-value">{data.invitation.inviterName}</span>
					</div>
					<div class="detail-row">
						<span class="detail-label">Your role</span>
						<span class="detail-value">
							<span class="role-badge role-{data.invitation.role}">{data.invitation.role}</span>
						</span>
					</div>
				</div>

				{#if form?.error}
					<div class="form-error">{form.error}</div>
				{/if}

				<form method="POST" action="?/accept" use:enhance={() => {
					accepting = true;
					return async ({ update }) => {
						accepting = false;
						await update();
					};
				}}>
					<button type="submit" class="btn-primary full-width" disabled={accepting}>
						{accepting ? 'Accepting...' : 'Accept Invitation'}
					</button>
				</form>

				<p class="invite-note">By accepting, you'll join this workspace and be able to collaborate with the team.</p>
			</div>
		</Card>
	{/if}
</div>

<style>
	.invite-page {
		max-width: 480px;
		margin: var(--space-xxl) auto;
	}

	.invite-status {
		text-align: center;
		padding: var(--space-xl);
	}

	.status-icon {
		width: 64px;
		height: 64px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto var(--space-lg);
	}

	.status-icon.error {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.status-icon.warning {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}

	.status-icon.success {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}

	.invite-status h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: var(--space-sm);
	}

	.invite-status p {
		color: var(--text-muted);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-lg);
	}

	.invite-content {
		padding: var(--space-lg);
	}

	.invite-header {
		text-align: center;
		margin-bottom: var(--space-xl);
	}

	.invite-icon {
		color: var(--color-accent);
		margin-bottom: var(--space-md);
	}

	.invite-header h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		color: var(--text-primary);
	}

	.invite-details {
		background: var(--bg-secondary);
		border-radius: var(--radius-md);
		padding: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: var(--space-sm) 0;
	}

	.detail-row:not(:last-child) {
		border-bottom: 1px solid var(--border-color);
	}

	.detail-label {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}

	.detail-value {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.role-badge {
		font-size: 11px;
		font-weight: 600;
		padding: 2px 8px;
		border-radius: 10px;
		text-transform: capitalize;
	}

	.role-admin {
		background: rgba(59, 130, 246, 0.15);
		color: #60a5fa;
	}

	.role-member {
		background: var(--bg-tertiary);
		color: var(--text-muted);
	}

	.form-error {
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #fca5a5;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
	}

	.btn-primary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-sm) var(--space-xl);
		background: var(--color-accent);
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		transition: all var(--transition-fast);
	}

	.btn-primary:hover {
		opacity: 0.9;
	}

	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.full-width {
		width: 100%;
	}

	.invite-note {
		text-align: center;
		font-size: 12px;
		color: var(--text-muted);
		margin-top: var(--space-md);
	}
</style>
