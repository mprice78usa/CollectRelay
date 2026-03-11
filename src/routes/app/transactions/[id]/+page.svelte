<script lang="ts">
	import { enhance } from '$app/forms';
	import Badge from '$components/ui/Badge.svelte';
	import Modal from '$components/ui/Modal.svelte';
	import Spinner from '$components/ui/Spinner.svelte';
	import ActivityToast from '$components/ui/ActivityToast.svelte';
	import FilePreview from '$components/ui/FilePreview.svelte';

	let { data, form } = $props();

	let txn = $derived(data.transaction);
	let rejectItemId = $state<string | null>(null);
	let rejectNote = $state('');
	let magicLink = $state(form?.magicLink || '');

	// Add item modal state
	let showAddItem = $state(false);
	let addItemLoading = $state(false);
	let canAddItems = $derived(!['completed', 'cancelled'].includes(txn.status));

	// Deal details modal
	let showEditDeal = $state(false);
	let editSalePrice = $state('');
	let editCommissionRate = $state('');
	let editCommissionAmount = $state('');
	let editCommissionOverride = $state(false);

	function openEditDeal() {
		editSalePrice = txn.sale_price?.toString() || '';
		editCommissionRate = txn.commission_rate?.toString() || '';
		editCommissionAmount = txn.commission_amount?.toString() || '';
		editCommissionOverride = false;
		showEditDeal = true;
	}

	$effect(() => {
		if (!editCommissionOverride && editSalePrice && editCommissionRate) {
			const price = parseFloat(editSalePrice);
			const rate = parseFloat(editCommissionRate);
			if (!isNaN(price) && !isNaN(rate)) {
				editCommissionAmount = (price * rate / 100).toFixed(2);
			}
		}
	});

	// Custom fields
	let showAddField = $state(false);
	let addFieldLoading = $state(false);

	// Pro upload
	let uploadingItemId = $state<string | null>(null);
	let uploadProgress = $state<string | null>(null);

	async function handleProUpload(event: Event, itemId: string) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadingItemId = itemId;
		uploadProgress = 'Uploading…';

		const formData = new FormData();
		formData.append('file', file);
		formData.append('checklistItemId', itemId);
		formData.append('transactionId', txn.id);

		try {
			const res = await fetch('/api/upload', { method: 'POST', body: formData });
			if (!res.ok) {
				const errData = await res.json().catch(() => ({ message: 'Upload failed' }));
				uploadProgress = errData.message || 'Upload failed';
				setTimeout(() => { uploadProgress = null; uploadingItemId = null; }, 2000);
				return;
			}
			// Refresh page data
			uploadProgress = null;
			uploadingItemId = null;
			// Use invalidateAll to refresh server data
			const { invalidateAll } = await import('$app/navigation');
			await invalidateAll();
		} catch {
			uploadProgress = 'Upload failed';
			setTimeout(() => { uploadProgress = null; uploadingItemId = null; }, 2000);
		}
		input.value = '';
	}

	// Invite collaborator
	let showInvite = $state(false);
	let inviteError = $state('');

	// Nudge state
	let nudgeSent = $state(false);
	let nudgeCooldown = $state(false);

	// Edit client state
	let editingClient = $state(false);
	let editClientName = $state('');
	let editClientEmail = $state('');
	let editClientPhone = $state('');

	function startEditClient() {
		editClientName = txn.client_name;
		editClientEmail = txn.client_email;
		editClientPhone = txn.client_phone || '';
		editingClient = true;
	}

	function formatRelativeDate(iso: string | null): string {
		if (!iso) return 'Never';
		const diff = Date.now() - new Date(iso).getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		if (minutes < 1) return 'Just now';
		if (minutes < 60) return minutes + 'm ago';
		if (hours < 24) return hours + 'h ago';
		return days + 'd ago';
	}

	// File preview state
	let previewFile = $state<{ id: string; filename: string; mime_type: string; file_size: number } | null>(null);

	let completedCount = $derived(txn.items.filter((i: any) => i.status === 'accepted' || i.status === 'waived').length);
	let progressPct = $derived(txn.items.length > 0 ? (completedCount / txn.items.length) * 100 : 0);

	function statusVariant(status: string) {
		switch (status) {
			case 'draft': return 'default' as const;
			case 'active': return 'info' as const;
			case 'in_review': return 'warning' as const;
			case 'completed': return 'success' as const;
			case 'cancelled': return 'error' as const;
			default: return 'default' as const;
		}
	}

	function statusLabel(status: string) {
		switch (status) {
			case 'in_review': return 'In Review';
			default: return status.charAt(0).toUpperCase() + status.slice(1);
		}
	}

	function itemStatusVariant(status: string) {
		switch (status) {
			case 'pending': return 'default' as const;
			case 'submitted': return 'info' as const;
			case 'accepted': return 'success' as const;
			case 'rejected': return 'error' as const;
			case 'waived': return 'warning' as const;
			default: return 'default' as const;
		}
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

	function formatDate(dateStr: string | null) {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatFileSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function formatCurrency(value: number | null): string {
		if (value == null) return '—';
		return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
	}

	function expirationStatus(item: any): { label: string; variant: 'warning' | 'error' } | null {
		if (!item.expires_at || item.status !== 'accepted') return null;
		const now = Date.now();
		const exp = new Date(item.expires_at).getTime();
		const daysLeft = Math.ceil((exp - now) / 86400000);
		if (daysLeft < 0) return { label: `Expired ${Math.abs(daysLeft)}d ago`, variant: 'error' };
		if (daysLeft <= 7) return { label: `Expires in ${daysLeft}d`, variant: 'warning' };
		return null;
	}

	function filesForItem(itemId: string) {
		return data.files.filter((f: any) => f.checklist_item_id === itemId);
	}

	function commentsForItem(itemId: string) {
		return (data.comments || []).filter((c: any) => c.checklist_item_id === itemId);
	}

	function formatRelativeTime(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime();
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	// Activity notifications — items with unseen client activity
	let unseenItems = $derived(() => {
		const lastSeen = data.lastSeenAt;
		const activity = data.itemActivity || [];
		const set = new Set<string>();
		for (const a of activity) {
			if (a.lastActorType === 'client' && (!lastSeen || a.lastActivityAt > lastSeen)) {
				set.add(a.checklistItemId);
			}
		}
		return set;
	});

	let showCommentsFor = $state<Set<string>>(new Set());
	function toggleComments(itemId: string) {
		const next = new Set(showCommentsFor);
		if (next.has(itemId)) next.delete(itemId);
		else next.add(itemId);
		showCommentsFor = next;
	}

	// AI summary retry
	let retryingSummary = $state<string | null>(null);
	async function retrySummary(fileId: string) {
		retryingSummary = fileId;
		try {
			await fetch(`/api/files/${fileId}/summarize`, { method: 'POST' });
			const { invalidateAll } = await import('$app/navigation');
			await invalidateAll();
		} catch { /* ignore */ }
		retryingSummary = null;
	}

	let copiedLink = $state(false);
	function copyMagicLink() {
		const link = magicLink || `${window.location.origin}/c/mock-token-${txn.id}`;
		navigator.clipboard.writeText(link);
		copiedLink = true;
		setTimeout(() => copiedLink = false, 2000);
	}
</script>

<svelte:head>
	<title>{txn.title} — CollectRelay</title>
</svelte:head>

<div class="detail-page">
	<div class="page-header">
		<a href="/app/transactions" class="back-link">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<path d="M19 12H5M12 19l-7-7 7-7" />
			</svg>
			Back to Transactions
		</a>
	</div>

	<!-- Header card -->
	<div class="header-card">
		<div class="header-top">
			<div>
				<div class="title-row">
					<h1>{txn.title}</h1>
					<Badge variant={statusVariant(txn.status)}>{statusLabel(txn.status)}</Badge>
				</div>
				{#if editingClient}
					<form method="POST" action="?/updateClient" use:enhance={() => { return async ({ result, update }) => { if (result.type === 'success') { editingClient = false; } await update(); }; }} class="edit-client-form">
						<input type="text" name="clientName" value={editClientName} placeholder="Client name" required class="edit-client-input" />
						<input type="email" name="clientEmail" value={editClientEmail} placeholder="Email" required class="edit-client-input" />
						<input type="tel" name="clientPhone" value={editClientPhone} placeholder="Phone (+1...)" class="edit-client-input edit-client-phone" />
						<div class="edit-client-actions">
							<button type="submit" class="btn-outline-sm btn-success-sm">Save</button>
							<button type="button" class="btn-outline-sm" onclick={() => editingClient = false}>Cancel</button>
						</div>
					</form>
				{:else}
					<p class="client-info">
						{txn.client_name} · {txn.client_email}
						{#if txn.client_phone} · {txn.client_phone}{/if}
						<button class="edit-client-btn" onclick={startEditClient} title="Edit client details">
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
							</svg>
							Edit
						</button>
					</p>
				{/if}
			</div>
		</div>

		<div class="header-meta">
			<div class="meta-item">
				<span class="meta-label">Progress</span>
				<div class="progress-row">
					<div class="progress-bar">
						<div class="progress-fill" style="width: {progressPct}%"></div>
					</div>
					<span class="progress-text">{completedCount}/{txn.items.length}</span>
				</div>
			</div>
			{#if txn.sale_price}
				<div class="meta-item">
					<span class="meta-label">Sale Price</span>
					<span class="meta-value-accent">{formatCurrency(txn.sale_price)}</span>
				</div>
			{/if}
			{#if txn.commission_rate}
				<div class="meta-item">
					<span class="meta-label">Commission</span>
					<span>{txn.commission_rate}% · {formatCurrency(txn.commission_amount)}</span>
				</div>
			{/if}
			{#if txn.due_date}
				<div class="meta-item">
					<span class="meta-label">Due date</span>
					<span>{formatDate(txn.due_date)}</span>
				</div>
			{/if}
			<div class="meta-item">
				<span class="meta-label">Created</span>
				<span>{formatDate(txn.created_at)}</span>
			</div>
			<button class="edit-deal-btn" onclick={openEditDeal} title="Edit deal details">
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
				</svg>
			</button>
		</div>

		<!-- Custom Fields -->
		{#if data.customFields?.length > 0 || !['completed', 'cancelled'].includes(txn.status)}
			<div class="custom-fields-section">
				{#if data.customFields?.length > 0}
					<div class="custom-fields-list">
						{#each data.customFields as field}
							<div class="custom-field-tag">
								<span class="cf-name">{field.field_name}:</span>
								<span class="cf-value">{field.field_value}</span>
								{#if !['completed', 'cancelled'].includes(txn.status)}
									<form method="POST" action="?/removeCustomField" use:enhance style="display:inline;">
										<input type="hidden" name="fieldId" value={field.id} />
										<button type="submit" class="cf-remove" title="Remove field">&times;</button>
									</form>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
				{#if !['completed', 'cancelled'].includes(txn.status)}
					{#if showAddField}
						<form method="POST" action="?/addCustomField" class="add-field-form" use:enhance={() => {
							addFieldLoading = true;
							return async ({ result, update }) => {
								addFieldLoading = false;
								if (result.type === 'success') showAddField = false;
								await update();
							};
						}}>
							<input name="fieldName" type="text" placeholder="Field name" required class="field-input-sm" />
							<input name="fieldValue" type="text" placeholder="Value" required class="field-input-sm" />
							<button type="submit" class="btn-accept" disabled={addFieldLoading}>Add</button>
							<button type="button" class="btn-cancel-sm" onclick={() => showAddField = false}>Cancel</button>
						</form>
					{:else}
						<button class="add-field-btn" onclick={() => showAddField = true}>
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
								<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
							</svg>
							Add custom field
						</button>
					{/if}
				{/if}
			</div>
		{/if}

		<!-- Collaborators -->
		{#if data.collaborators?.length > 0}
			<div class="collaborators-row">
				{#each data.collaborators as collab}
					<div class="collab-tag" title="{collab.user_name} ({collab.role})">
						<span class="collab-avatar">{collab.user_name.charAt(0).toUpperCase()}</span>
						<span class="collab-name">{collab.user_name}</span>
						<span class="collab-role">{collab.role}</span>
						<form method="POST" action="?/removeCollaborator" use:enhance style="display:inline;">
							<input type="hidden" name="collaboratorId" value={collab.id} />
							<button type="submit" class="collab-remove" title="Remove">&times;</button>
						</form>
					</div>
				{/each}
			</div>
		{/if}

		<div class="header-actions">
			<button class="btn-outline-sm" onclick={() => showInvite = true}>
				<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" />
				</svg>
				Invite
			</button>
			{#if data.files?.length > 0}
				<a href="/api/transactions/{data.transaction.id}/download" class="btn-outline-sm">
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
					</svg>
					Download All
				</a>
			{/if}
			{#if txn.status === 'draft'}
				<form method="POST" action="?/sendLink" use:enhance={() => { return async ({ result, update }) => { if (result.type === 'success' && result.data?.magicLink) { magicLink = result.data.magicLink; } await update(); }; }}>
					<button type="submit" class="btn-primary-sm">Send to Client</button>
				</form>
			{/if}
			{#if txn.status === 'active'}
				<form method="POST" action="?/sendLink" use:enhance={() => { return async ({ result, update }) => { if (result.type === 'success' && result.data?.magicLink) { magicLink = result.data.magicLink; } await update(); }; }}>
					<button type="submit" class="btn-outline-sm">Resend Email</button>
				</form>
				<button class="btn-outline-sm" onclick={copyMagicLink}>
					{copiedLink ? 'Copied!' : 'Copy Link'}
				</button>
				<form method="POST" action="?/nudge" use:enhance={() => { return async ({ result, update }) => { if (result.type === 'success') { nudgeSent = true; nudgeCooldown = true; setTimeout(() => { nudgeSent = false; nudgeCooldown = false; }, 5000); } await update(); }; }}>
					<button type="submit" class="btn-outline-sm btn-nudge" disabled={nudgeCooldown}>
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
						</svg>
						{nudgeSent ? 'Sent!' : 'Nudge'}
					</button>
				</form>
				<form method="POST" action="?/updateStatus" use:enhance>
					<input type="hidden" name="status" value="in_review" />
					<button type="submit" class="btn-outline-sm">Mark In Review</button>
				</form>
			{/if}
			{#if txn.status === 'in_review'}
				<form method="POST" action="?/updateStatus" use:enhance>
					<input type="hidden" name="status" value="active" />
					<button type="submit" class="btn-outline-sm">Back to Active</button>
				</form>
				<form method="POST" action="?/updateStatus" use:enhance>
					<input type="hidden" name="status" value="completed" />
					<button type="submit" class="btn-success-sm">Complete</button>
				</form>
			{/if}
			{#if txn.status !== 'completed' && txn.status !== 'cancelled'}
				<form method="POST" action="?/updateStatus" use:enhance>
					<input type="hidden" name="status" value="cancelled" />
					<button type="submit" class="btn-danger-sm">Cancel</button>
				</form>
			{/if}
			{#if txn.status === 'cancelled'}
				<form method="POST" action="?/updateStatus" use:enhance>
					<input type="hidden" name="status" value="active" />
					<button type="submit" class="btn-success-sm">Revive</button>
				</form>
			{/if}
		</div>
		{#if txn.status === 'active' && txn.last_reminder_at}
			<p class="last-reminder-info">Last reminder sent {formatRelativeDate(txn.last_reminder_at)}</p>
		{/if}
		{#if txn.client_phone}
			<div class="sms-toggle-row">
				<form method="POST" action="?/toggleSms" use:enhance>
					<input type="hidden" name="enabled" value={txn.sms_enabled ? '0' : '1'} />
					<button type="submit" class="sms-toggle-btn" class:sms-on={txn.sms_enabled}>
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
						</svg>
						SMS {txn.sms_enabled ? 'On' : 'Off'}
					</button>
				</form>
				<span class="sms-toggle-hint">
					{txn.sms_enabled ? 'Client will receive text messages with emails' : 'Client will only receive emails'}
				</span>
			</div>
		{/if}
	</div>

	<!-- Checklist items -->
	<div class="checklist-section">
		<div class="checklist-header-row">
			<h2>Checklist Items</h2>
			{#if txn.items.some(i => i.status === 'submitted')}
				<form method="POST" action="?/acceptAllSubmitted" use:enhance>
					<button type="submit" class="btn-accept-all" onclick={(e) => {
						const count = txn.items.filter(i => i.status === 'submitted').length;
						if (!confirm(`Accept all ${count} submitted item(s)?`)) e.preventDefault();
					}}>
						<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="20 6 9 17 4 12" />
						</svg>
						Accept All Submitted ({txn.items.filter(i => i.status === 'submitted').length})
					</button>
				</form>
			{/if}
		</div>

		<div class="checklist-list">
			{#each txn.items as item, i}
				<div class="checklist-item" class:submitted={item.status === 'submitted'} class:accepted={item.status === 'accepted'} class:rejected={item.status === 'rejected'}>
					<div class="item-header">
						<span class="item-order">{i + 1}</span>
						<div class="item-title-row">
							<span class="item-name">{item.name}</span>
							<div class="item-badges">
								{#if unseenItems().has(item.id)}
									<span class="activity-dot" title="New client activity"></span>
								{/if}
								<Badge variant={itemStatusVariant(item.status)}>{item.status}</Badge>
								<span class="item-type-tag">{itemTypeLabel(item.item_type)}</span>
								{#if item.required}
									<span class="required-tag">Required</span>
								{/if}
								{#if expirationStatus(item)}
									{@const expiry = expirationStatus(item)}
									<span class="expiry-tag expiry-{expiry?.variant}" title="Document expiration">
										<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
										</svg>
										{expiry?.label}
									</span>
								{/if}
							</div>
						</div>
					</div>

					{#if item.description}
						<p class="item-description">{item.description}</p>
					{/if}

					<!-- Show answer for question/checkbox items -->
					{#if item.answer && (item.item_type === 'question' || item.item_type === 'checkbox')}
						<div class="item-answer">
							<span class="answer-label">Answer:</span>
							<span class="answer-text">{item.answer}</span>
						</div>
					{/if}

					<!-- Show uploaded files for document items -->
					{#if item.item_type === 'document'}
						{@const itemFiles = filesForItem(item.id)}
						{#if itemFiles.length > 0}
							<div class="item-files">
								{#each itemFiles as file}
									<div class="file-row">
										<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
											<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
											<polyline points="14 2 14 8 20 8" />
										</svg>
										<button class="file-name file-preview-btn" onclick={() => { previewFile = file; }}>{file.filename}</button>
										<span class="file-size">{formatFileSize(file.file_size)}</span>
									<span class="file-source" class:source-pro={!file.uploaded_by_client} class:source-client={!!file.uploaded_by_client}>
										{file.uploaded_by_client ? 'Client' : 'You'}
									</span>
									</div>
									{#if file.ai_summary_status === 'completed' && file.ai_summary}
										<div class="ai-summary">
											<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
												<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
											</svg>
											<span>{file.ai_summary}</span>
										</div>
									{:else if file.ai_summary_status === 'processing'}
										<div class="ai-summary ai-summary-loading">
											<Spinner size={10} />
											<span>Analyzing document...</span>
										</div>
									{:else if file.ai_summary_status === 'failed'}
										<div class="ai-summary ai-summary-failed">
											<button class="retry-summary-btn" onclick={() => retrySummary(file.id)} disabled={retryingSummary === file.id}>
												{retryingSummary === file.id ? 'Retrying...' : 'Retry AI summary'}
											</button>
										</div>
									{/if}
								{/each}
							</div>
						{/if}

						<!-- Pro upload button -->
						{#if !['completed', 'cancelled'].includes(txn.status)}
							<div class="pro-upload">
								{#if uploadingItemId === item.id}
									<span class="upload-status">
										<Spinner size={12} />
										{uploadProgress}
									</span>
								{:else}
									<label class="upload-btn-inline">
										<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
										</svg>
										Upload document
										<input type="file" class="sr-only" onchange={(e) => handleProUpload(e, item.id)} />
									</label>
								{/if}
							</div>
						{/if}
					{/if}

					<!-- Show signature for signature items -->
					{#if item.item_type === 'signature'}
						{@const sigFiles = filesForItem(item.id)}
						{#if sigFiles.length > 0}
							<div class="signature-display">
								<span class="answer-label">Signature:</span>
								<div class="signature-img-wrapper">
									<img src="/api/files/{sigFiles[0].id}" alt="Client signature" class="signature-img-review" />
								</div>
								{#if item.signature_data}
									{@const sigMeta = JSON.parse(item.signature_data)}
									<div class="signature-meta">
										<span>Signed by: {sigMeta.signerName} ({sigMeta.signerEmail})</span>
										<span>Method: {sigMeta.mode === 'draw' ? 'Hand-drawn' : 'Typed'}</span>
										<span>Date: {new Date(sigMeta.signedAt).toLocaleString()}</span>
										<span>IP: {sigMeta.ipAddress}</span>
									</div>
								{/if}
							</div>
						{:else if item.status === 'pending'}
							<div class="signature-awaiting">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d="M2 17l4-4 4 4 4-4 4 4 4-4" /><path d="M2 21h20" />
								</svg>
								Awaiting signature from client
							</div>
						{/if}
					{/if}

					<!-- Review note for rejected items -->
					{#if item.review_note}
						<div class="review-note">
							<span class="note-label">Review note:</span> {item.review_note}
						</div>
					{/if}

					<!-- Review actions for submitted items -->
					{#if item.status === 'submitted'}
						<div class="review-actions">
							<form method="POST" action="?/reviewItem" use:enhance>
								<input type="hidden" name="itemId" value={item.id} />
								<input type="hidden" name="action" value="accept" />
								<button type="submit" class="btn-accept">Accept</button>
							</form>

							{#if rejectItemId === item.id}
								<form method="POST" action="?/reviewItem" use:enhance={() => { return async ({ update }) => { rejectItemId = null; rejectNote = ''; await update(); }; }}>
									<input type="hidden" name="itemId" value={item.id} />
									<input type="hidden" name="action" value="reject" />
									<div class="reject-form">
										<input
											type="text"
											name="reviewNote"
											bind:value={rejectNote}
											placeholder="Reason for rejection…"
											class="reject-input"
										/>
										<button type="submit" class="btn-reject-confirm">Reject</button>
										<button type="button" class="btn-cancel-sm" onclick={() => { rejectItemId = null; rejectNote = ''; }}>Cancel</button>
									</div>
								</form>
							{:else}
								<button class="btn-reject" onclick={() => rejectItemId = item.id}>Reject</button>
							{/if}

							<form method="POST" action="?/reviewItem" use:enhance>
								<input type="hidden" name="itemId" value={item.id} />
								<input type="hidden" name="action" value="waive" />
								<button type="submit" class="btn-waive">Waive</button>
							</form>
						</div>
					{/if}

					<!-- Comments Thread -->
					<div class="comments-section" style="margin-left: 40px; margin-top: var(--space-md);">
						<button class="comments-toggle" onclick={() => toggleComments(item.id)}>
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
							</svg>
							{commentsForItem(item.id).length > 0 ? `${commentsForItem(item.id).length} comment${commentsForItem(item.id).length !== 1 ? 's' : ''}` : 'Add comment'}
						</button>

						{#if showCommentsFor.has(item.id)}
							<div class="comments-thread">
								{#each commentsForItem(item.id) as comment}
									<div class="comment" class:comment-pro={comment.author_type === 'pro'} class:comment-client={comment.author_type === 'client'}>
										<div class="comment-header">
											<span class="comment-author">{comment.author_name}</span>
											<span class="comment-badge">{comment.author_type === 'pro' ? 'You' : 'Client'}</span>
											<span class="comment-time">{formatRelativeTime(comment.created_at)}</span>
										</div>
										<p class="comment-body">{comment.content}</p>
									</div>
								{/each}

								<form method="POST" action="?/addComment" use:enhance={() => { return async ({ update }) => { await update(); }; }} class="comment-form">
									<input type="hidden" name="checklistItemId" value={item.id} />
									<input type="text" name="content" placeholder="Write a comment…" required class="comment-input" />
									<button type="submit" class="comment-send" title="Send">
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
										</svg>
									</button>
								</form>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if canAddItems}
			<button class="btn-add-item" onclick={() => showAddItem = true}>
				<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
				</svg>
				Add Item
			</button>
		{/if}
	</div>
</div>

<!-- Key Dates -->
<div class="milestones-section">
	<div class="milestones-header">
		<h2>Key Dates</h2>
		<a href="/api/transactions/{data.transaction.id}/calendar" class="cal-link-global" title="Export all milestones to calendar">
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
			</svg>
			Add to Calendar
		</a>
	</div>

	{#if data.milestones?.length > 0}
		<div class="milestones-timeline">
			{#each data.milestones as ms}
				<div class="milestone-row" class:milestone-completed={ms.completed}>
					<div class="milestone-dot-wrap">
						<div class="milestone-dot"></div>
						<div class="milestone-line"></div>
					</div>
					<div class="milestone-content">
						<div class="milestone-main">
							<form method="POST" action="?/updateMilestone" use:enhance class="milestone-check-form">
								<input type="hidden" name="milestoneId" value={ms.id} />
								<input type="hidden" name="completed" value={ms.completed ? 'false' : 'true'} />
								<button type="submit" class="milestone-checkbox" title={ms.completed ? 'Mark incomplete' : 'Mark complete'}>
									{#if ms.completed}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="20 6 9 17 4 12" />
										</svg>
									{:else}
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<rect x="3" y="3" width="18" height="18" rx="2" />
										</svg>
									{/if}
								</button>
							</form>
							<span class="milestone-label" class:milestone-label-done={ms.completed}>{ms.label}</span>
						</div>
						<div class="milestone-meta">
							<form method="POST" action="?/updateMilestone" use:enhance class="milestone-date-form">
								<input type="hidden" name="milestoneId" value={ms.id} />
								<input
									type="date"
									name="date"
									value={ms.date ?? ''}
									class="milestone-date-input"
									onchange={(e) => { const form = (e.target as HTMLInputElement).form; if (form) form.requestSubmit(); }}
								/>
							</form>
							<a href="/api/transactions/{data.transaction.id}/calendar?milestone={ms.id}" class="cal-link-ms" title="Add to calendar">
								<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
								</svg>
							</a>
							<form method="POST" action="?/removeMilestone" use:enhance class="milestone-remove-form">
								<input type="hidden" name="milestoneId" value={ms.id} />
								<button type="submit" class="milestone-remove" title="Remove milestone">&times;</button>
							</form>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="milestones-empty">
			<p>No key dates added yet.</p>
			<form method="POST" action="?/seedMilestones" use:enhance class="seed-form">
				<label for="seed-contract-date" class="seed-label">Contract date</label>
				<input type="date" id="seed-contract-date" name="contractDate" class="milestone-date-input" />
				<button type="submit" class="btn-seed">Seed Defaults</button>
			</form>
		</div>
	{/if}

	<form method="POST" action="?/addMilestone" use:enhance class="add-milestone-form">
		<input type="text" name="label" placeholder="Milestone label…" required class="field-input-sm milestone-label-input" />
		<input type="date" name="date" class="milestone-date-input" />
		<button type="submit" class="btn-accept">Add Milestone</button>
	</form>
</div>

<!-- Partner Access -->
<div class="partners-section">
	<h2>Partner Access</h2>

	{#if data.partnerLinks?.length > 0}
		<div class="partner-links-list">
			{#each data.partnerLinks as link}
				<div class="partner-link-row">
					<div class="partner-link-info">
						<span class="partner-name">{link.partner_name}</span>
						<span class="partner-email">{link.partner_email}</span>
						<span class="partner-type-tag">{link.partner_type}</span>
						{#if link.expires_at}
							<span class="partner-expires">Expires {formatDate(link.expires_at)}</span>
						{/if}
					</div>
					<form method="POST" action="?/revokePartnerLink" use:enhance>
						<input type="hidden" name="linkId" value={link.id} />
						<button type="submit" class="btn-revoke">Revoke</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}

	<form method="POST" action="?/invitePartner" use:enhance class="invite-partner-form">
		<input type="text" name="partnerName" placeholder="Partner name" required class="field-input-sm" />
		<input type="email" name="partnerEmail" placeholder="Partner email" required class="field-input-sm" />
		<select name="partnerType" class="field-input-sm">
			<option value="lender">Lender</option>
			<option value="title">Title</option>
			<option value="agent">Agent</option>
			<option value="other">Other</option>
		</select>
		<button type="submit" class="btn-accept">Invite Partner</button>
	</form>
</div>

<!-- Add Item Modal -->
<Modal bind:open={showAddItem} title="Add Checklist Item">
	<form method="POST" action="?/addItem" use:enhance={() => {
		addItemLoading = true;
		return async ({ result, update }) => {
			addItemLoading = false;
			if (result.type === 'success') {
				showAddItem = false;
			}
			await update();
		};
	}}>
		<div class="modal-field">
			<label for="add-item-name">Name</label>
			<input id="add-item-name" name="name" type="text" required placeholder="e.g. Bank statement" />
		</div>

		<div class="modal-field">
			<label for="add-item-description">Description <span class="optional">(optional)</span></label>
			<input id="add-item-description" name="description" type="text" placeholder="e.g. Last 3 months" />
		</div>

		<div class="modal-field">
			<label for="add-item-type">Type</label>
			<select id="add-item-type" name="itemType">
				<option value="document">Document</option>
				<option value="question">Question</option>
				<option value="checkbox">Checkbox</option>
				<option value="signature">Signature</option>
			</select>
		</div>

		<div class="modal-field modal-toggle-row">
			<label for="add-item-required">Required</label>
			<input id="add-item-required" name="required" type="checkbox" value="true" checked />
		</div>

		<div class="modal-actions">
			<button type="button" class="btn-modal-cancel" onclick={() => showAddItem = false}>Cancel</button>
			<button type="submit" class="btn-modal-submit" disabled={addItemLoading}>
				{#if addItemLoading}
					<Spinner size={14} /> Adding…
				{:else}
					Add Item
				{/if}
			</button>
		</div>
	</form>
</Modal>

<!-- Invite Collaborator Modal -->
<Modal bind:open={showInvite} title="Invite Team Member">
	<form method="POST" action="?/inviteCollaborator" use:enhance={() => {
		inviteError = '';
		return async ({ result, update }) => {
			if (result.type === 'success') {
				showInvite = false;
			} else if (result.type === 'failure') {
				inviteError = (result.data as any)?.error || 'Failed to invite';
			}
			await update();
		};
	}}>
		<div class="modal-field">
			<label for="invite-email">Email address</label>
			<input id="invite-email" name="email" type="email" required placeholder="colleague@example.com" />
			<span class="field-hint">Must have a CollectRelay account</span>
		</div>

		<div class="modal-field">
			<label for="invite-role">Role</label>
			<select id="invite-role" name="role">
				<option value="viewer">Viewer — read-only access</option>
				<option value="commenter">Commenter — can view and comment</option>
				<option value="reviewer">Reviewer — can review and accept/reject items</option>
			</select>
		</div>

		{#if inviteError}
			<div class="invite-error">{inviteError}</div>
		{/if}

		<div class="modal-actions">
			<button type="button" class="btn-modal-cancel" onclick={() => { showInvite = false; inviteError = ''; }}>Cancel</button>
			<button type="submit" class="btn-modal-submit">Send Invite</button>
		</div>
	</form>
</Modal>

<!-- Edit Deal Details Modal -->
<Modal bind:open={showEditDeal} title="Edit Deal Details">
	<form method="POST" action="?/updateDealDetails" use:enhance={() => {
		return async ({ result, update }) => {
			if (result.type === 'success') showEditDeal = false;
			await update();
		};
	}}>
		<div class="modal-field">
			<label for="edit-sale-price">Sale Price</label>
			<div class="input-prefix-wrap">
				<span class="input-prefix">$</span>
				<input id="edit-sale-price" name="salePrice" type="number" step="0.01" min="0" bind:value={editSalePrice} placeholder="0" />
			</div>
		</div>

		<div class="modal-field">
			<label for="edit-commission-rate">Commission Rate</label>
			<div class="input-suffix-wrap">
				<input id="edit-commission-rate" name="commissionRate" type="number" step="0.01" min="0" max="100" bind:value={editCommissionRate} placeholder="0" />
				<span class="input-suffix">%</span>
			</div>
		</div>

		<div class="modal-field">
			<label for="edit-commission-amount">
				Commission Amount
				{#if editSalePrice && editCommissionRate && !editCommissionOverride}
					<span class="computed-label">(auto-calculated)</span>
				{/if}
			</label>
			<div class="input-prefix-wrap">
				<span class="input-prefix">$</span>
				<input id="edit-commission-amount" name="commissionAmount" type="number" step="0.01" min="0" bind:value={editCommissionAmount} oninput={() => editCommissionOverride = true} placeholder="0" />
			</div>
		</div>

		<div class="modal-actions">
			<button type="button" class="btn-modal-cancel" onclick={() => showEditDeal = false}>Cancel</button>
			<button type="submit" class="btn-modal-submit">Save</button>
		</div>
	</form>
</Modal>

<FilePreview file={previewFile} onclose={() => { previewFile = null; }} />
<ActivityToast transactionId={txn.id} />

<style>
	.page-header {
		margin-bottom: var(--space-lg);
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

	/* Header card */
	.header-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		margin-bottom: var(--space-xxl);
	}

	.header-top {
		margin-bottom: var(--space-lg);
	}

	.title-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-xs);
		flex-wrap: wrap;
	}

	h1 {
		font-size: var(--font-size-xl);
		font-weight: 700;
	}

	.client-info {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.edit-client-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 4px 8px;
		gap: 4px;
		border: 1px solid var(--border-color);
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		cursor: pointer;
		border-radius: var(--radius-md);
		transition: all var(--transition-fast);
		font-size: 11px;
		font-weight: 500;
	}

	.edit-client-btn:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.edit-client-form {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
		margin-top: var(--space-xs);
	}

	.edit-client-input {
		padding: 4px 8px;
		font-size: var(--font-size-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		width: 160px;
	}

	.edit-client-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.edit-client-phone {
		width: 140px;
	}

	.edit-client-actions {
		display: flex;
		gap: var(--space-xs);
	}

	.header-meta {
		display: flex;
		gap: var(--space-xxl);
		padding: var(--space-md) 0;
		border-top: 1px solid var(--border-color);
		border-bottom: 1px solid var(--border-color);
		margin-bottom: var(--space-lg);
	}

	.meta-item {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		font-size: var(--font-size-sm);
	}

	.meta-label {
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}

	.progress-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.progress-bar {
		width: 120px;
		height: 6px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-accent);
		border-radius: var(--radius-full);
		transition: width var(--transition-normal);
	}

	.progress-text {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.header-actions {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.header-actions form { display: inline; }

	.btn-primary-sm, .btn-outline-sm, .btn-success-sm, .btn-danger-sm {
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.btn-primary-sm { background: var(--color-accent); color: var(--text-inverse); }
	.btn-primary-sm:hover { background: var(--color-accent-hover); }

	.btn-outline-sm { background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); }
	.btn-outline-sm:hover { color: var(--text-primary); border-color: var(--text-tertiary); }

	.btn-success-sm { background: var(--color-success); color: #fff; }
	.btn-success-sm:hover { opacity: 0.9; }

	.btn-danger-sm { background: transparent; color: var(--color-error); border: 1px solid rgba(239, 68, 68, 0.3); }
	.btn-danger-sm:hover { background: rgba(239, 68, 68, 0.1); }

	.btn-nudge { gap: var(--space-xs); }
	.btn-nudge:disabled { opacity: 0.5; cursor: not-allowed; }

	.last-reminder-info {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
		margin-top: var(--space-sm);
	}

	.sms-toggle-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-top: var(--space-md);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border-color);
	}

	.sms-toggle-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-full);
		border: 1px solid var(--border-color);
		background: var(--bg-tertiary);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.sms-toggle-btn:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.sms-toggle-btn.sms-on {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.3);
		color: var(--color-success);
	}

	.sms-toggle-hint {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	.file-preview-btn {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--color-accent);
		font-size: inherit;
		font-family: inherit;
		text-align: left;
	}

	.file-preview-btn:hover {
		text-decoration: underline;
	}

	/* Checklist */
	.checklist-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		margin-bottom: var(--space-lg);
	}

	.checklist-header-row h2 {
		margin-bottom: 0;
	}

	.btn-accept-all {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 6px 14px;
		background: var(--color-success);
		color: #fff;
		border: none;
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: opacity var(--transition-fast);
		white-space: nowrap;
	}

	.btn-accept-all:hover {
		opacity: 0.85;
	}

	.checklist-section h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin-bottom: var(--space-lg);
	}

	.checklist-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.checklist-item {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
	}

	.checklist-item.submitted { border-left: 3px solid var(--color-info); }
	.checklist-item.accepted { border-left: 3px solid var(--color-success); }
	.checklist-item.rejected { border-left: 3px solid var(--color-error); }

	.item-header {
		display: flex;
		gap: var(--space-md);
		align-items: flex-start;
	}

	.item-order {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: var(--radius-full);
		background: var(--bg-tertiary);
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		font-weight: 600;
		flex-shrink: 0;
	}

	.item-title-row {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		flex-wrap: wrap;
	}

	.item-name {
		font-weight: 600;
		font-size: var(--font-size-md);
	}

	.item-badges {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.item-type-tag {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	.required-tag {
		font-size: var(--font-size-xs);
		color: var(--color-warning);
	}

	.expiry-tag {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 11px;
		font-weight: 600;
		padding: 1px 6px;
		border-radius: var(--radius-full);
	}

	.expiry-warning {
		background: rgba(245, 158, 11, 0.15);
		color: #f59e0b;
	}

	.expiry-error {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		animation: pulse-expiry 2s ease-in-out infinite;
	}

	@keyframes pulse-expiry {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}

	.activity-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #f59e0b;
		flex-shrink: 0;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25);
		animation: pulse-dot 1.5s ease-in-out infinite;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.25); }
		50% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.1); }
	}

	.item-description {
		margin-top: var(--space-sm);
		margin-left: 40px;
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
	}

	.item-answer {
		margin-top: var(--space-md);
		margin-left: 40px;
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
	}

	.answer-label {
		color: var(--text-tertiary);
		font-weight: 500;
	}

	.answer-text {
		color: var(--text-primary);
	}

	.item-files {
		margin-top: var(--space-md);
		margin-left: 40px;
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.file-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-primary);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-sm);
	}

	.file-row svg { color: var(--text-tertiary); flex-shrink: 0; }

	.file-name {
		color: var(--color-accent);
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.file-name:hover { text-decoration: underline; }

	.file-size {
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		flex-shrink: 0;
	}

	.review-note {
		margin-top: var(--space-sm);
		margin-left: 40px;
		padding: var(--space-sm) var(--space-md);
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		color: var(--color-error);
	}

	.note-label {
		font-weight: 600;
	}

	/* Signature display */
	.signature-display {
		margin-top: var(--space-sm);
		margin-left: 40px;
	}

	.signature-img-wrapper {
		margin-top: var(--space-xs);
		padding: var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		display: inline-block;
	}

	.signature-img-review {
		max-width: 300px;
		max-height: 150px;
		display: block;
		object-fit: contain;
	}

	.signature-meta {
		margin-top: var(--space-sm);
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.signature-awaiting {
		margin-top: var(--space-sm);
		margin-left: 40px;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		font-style: italic;
	}

	/* Review actions */
	.review-actions {
		margin-top: var(--space-md);
		margin-left: 40px;
		display: flex;
		gap: var(--space-sm);
		align-items: flex-start;
		flex-wrap: wrap;
	}

	.review-actions form { display: inline; }

	.btn-accept, .btn-reject, .btn-waive, .btn-reject-confirm, .btn-cancel-sm {
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.btn-accept { background: rgba(16, 185, 129, 0.15); color: var(--color-success); }
	.btn-accept:hover { background: rgba(16, 185, 129, 0.25); }

	.btn-reject { background: rgba(239, 68, 68, 0.1); color: var(--color-error); }
	.btn-reject:hover { background: rgba(239, 68, 68, 0.2); }

	.btn-reject-confirm { background: var(--color-error); color: #fff; }
	.btn-reject-confirm:hover { opacity: 0.9; }

	.btn-waive { background: rgba(245, 158, 11, 0.1); color: var(--color-warning); }
	.btn-waive:hover { background: rgba(245, 158, 11, 0.2); }

	.btn-cancel-sm { background: transparent; color: var(--text-tertiary); }
	.btn-cancel-sm:hover { color: var(--text-secondary); }

	.reject-form {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
	}

	.reject-input {
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-xs);
		width: 200px;
	}

	.reject-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	/* Comments */
	.comments-toggle {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: none;
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		cursor: pointer;
		padding: var(--space-xs) 0;
		transition: color var(--transition-fast);
	}

	.comments-toggle:hover { color: var(--text-secondary); }

	.comments-thread {
		margin-top: var(--space-sm);
		padding-left: var(--space-md);
		border-left: 2px solid var(--border-color);
	}

	.comment {
		padding: var(--space-sm) 0;
	}

	.comment + .comment {
		border-top: 1px solid var(--border-color);
	}

	.comment-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: 4px;
	}

	.comment-author {
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--text-primary);
	}

	.comment-badge {
		font-size: 10px;
		padding: 1px 6px;
		border-radius: var(--radius-full);
		font-weight: 500;
	}

	.comment-pro .comment-badge {
		background: rgba(16, 185, 129, 0.15);
		color: var(--color-accent);
	}

	.comment-client .comment-badge {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	.comment-time {
		font-size: 10px;
		color: var(--text-muted);
	}

	.comment-body {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		line-height: 1.5;
	}

	.comment-form {
		display: flex;
		gap: var(--space-xs);
		margin-top: var(--space-sm);
		padding-top: var(--space-sm);
	}

	.comment-input {
		flex: 1;
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-xs);
		font-family: inherit;
	}

	.comment-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.comment-send {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background: var(--color-accent);
		color: var(--text-inverse);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		flex-shrink: 0;
		transition: background var(--transition-fast);
	}

	.comment-send:hover { background: var(--color-accent-hover); }

	/* Add Item button */
	.btn-add-item {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-md);
		margin-top: var(--space-lg);
		background: transparent;
		color: var(--text-secondary);
		border: 1px dashed var(--border-color);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: color var(--transition-fast), border-color var(--transition-fast);
	}

	.btn-add-item:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/* Modal form styles */
	.modal-field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-bottom: var(--space-lg);
	}

	.modal-field label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-secondary);
	}

	.modal-field .optional {
		color: var(--text-muted);
		font-weight: 400;
	}

	.modal-field input[type="text"],
	.modal-field select {
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-input, var(--bg-primary));
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-md);
		font-family: inherit;
	}

	.modal-field input:focus,
	.modal-field select:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.modal-toggle-row {
		flex-direction: row;
		align-items: center;
		justify-content: space-between;
	}

	.modal-toggle-row input[type="checkbox"] {
		width: 18px;
		height: 18px;
		accent-color: var(--color-accent);
	}

	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		padding-top: var(--space-md);
		border-top: 1px solid var(--border-color);
	}

	.btn-modal-cancel {
		padding: var(--space-sm) var(--space-lg);
		background: transparent;
		color: var(--text-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
	}

	.btn-modal-cancel:hover {
		color: var(--text-primary);
		border-color: var(--text-tertiary);
	}

	.btn-modal-submit {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-lg);
		background: var(--color-accent);
		color: var(--text-inverse);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.btn-modal-submit:hover:not(:disabled) { background: var(--color-accent-hover); }
	.btn-modal-submit:disabled { opacity: 0.7; cursor: not-allowed; }

	/* Collaborators */
	.collaborators-row {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		padding-bottom: var(--space-md);
	}

	.collab-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
	}

	.collab-avatar {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		background: var(--color-accent);
		color: var(--text-inverse);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 10px;
		font-weight: 600;
	}

	.collab-name {
		font-weight: 500;
		color: var(--text-primary);
	}

	.collab-role {
		color: var(--text-muted);
		font-size: 10px;
	}

	.collab-remove {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: var(--font-size-md);
		line-height: 1;
		padding: 0;
		transition: color var(--transition-fast);
	}

	.collab-remove:hover {
		color: var(--color-error);
	}

	.field-hint {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.invite-error {
		padding: var(--space-sm) var(--space-md);
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
	}

	/* Deal details */
	.meta-value-accent {
		font-weight: 600;
		color: var(--color-accent);
	}

	.edit-deal-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		background: transparent;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-tertiary);
		cursor: pointer;
		transition: all var(--transition-fast);
		margin-left: auto;
		flex-shrink: 0;
	}

	.edit-deal-btn:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/* Custom fields */
	.custom-fields-section {
		padding: var(--space-md) 0 0;
	}

	.custom-fields-list {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-sm);
		margin-bottom: var(--space-sm);
	}

	.custom-field-tag {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-xs) var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-full);
		font-size: var(--font-size-xs);
	}

	.cf-name {
		color: var(--text-tertiary);
		font-weight: 500;
	}

	.cf-value {
		color: var(--text-primary);
	}

	.cf-remove {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: var(--font-size-md);
		line-height: 1;
		padding: 0 2px;
		transition: color var(--transition-fast);
	}

	.cf-remove:hover {
		color: var(--color-error);
	}

	.add-field-btn {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		background: none;
		border: none;
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		cursor: pointer;
		padding: var(--space-xs) 0;
		transition: color var(--transition-fast);
	}

	.add-field-btn:hover {
		color: var(--color-accent);
	}

	.add-field-form {
		display: flex;
		gap: var(--space-xs);
		align-items: center;
	}

	.field-input-sm {
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-xs);
		width: 140px;
		font-family: inherit;
	}

	.field-input-sm:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	/* File source labels */
	.file-source {
		font-size: 10px;
		padding: 1px 6px;
		border-radius: var(--radius-full);
		font-weight: 500;
		flex-shrink: 0;
	}

	.source-pro {
		background: rgba(16, 185, 129, 0.15);
		color: var(--color-accent);
	}

	.source-client {
		background: rgba(59, 130, 246, 0.15);
		color: #3b82f6;
	}

	/* AI Summary */
	.ai-summary {
		display: flex;
		align-items: flex-start;
		gap: 6px;
		margin-left: 28px;
		padding: 4px 0 2px;
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.ai-summary svg {
		color: #f59e0b;
		flex-shrink: 0;
		margin-top: 1px;
	}

	.ai-summary-loading {
		color: var(--text-muted);
	}

	.ai-summary-failed {
		color: var(--text-muted);
	}

	.retry-summary-btn {
		background: none;
		border: none;
		color: var(--color-accent);
		font-size: var(--font-size-xs);
		cursor: pointer;
		padding: 0;
		text-decoration: underline;
	}

	.retry-summary-btn:hover {
		color: var(--color-accent-hover);
	}

	.retry-summary-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		text-decoration: none;
	}

	/* Pro upload */
	.pro-upload {
		margin-left: 40px;
		margin-top: var(--space-sm);
	}

	.upload-btn-inline {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
		cursor: pointer;
		padding: var(--space-xs) 0;
		transition: color var(--transition-fast);
	}

	.upload-btn-inline:hover {
		color: var(--color-accent);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.upload-status {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	/* Edit deal modal input wrappers */
	.input-prefix-wrap, .input-suffix-wrap {
		display: flex;
		align-items: center;
		background: var(--bg-input, var(--bg-primary));
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: border-color var(--transition-fast);
	}

	.input-prefix-wrap:focus-within,
	.input-suffix-wrap:focus-within {
		border-color: var(--color-accent);
	}

	.input-prefix-wrap input,
	.input-suffix-wrap input {
		flex: 1;
		padding: var(--space-sm) var(--space-md);
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: var(--font-size-md);
		font-family: inherit;
		outline: none;
	}

	.input-prefix {
		padding-left: var(--space-md);
		color: var(--text-tertiary);
		font-size: var(--font-size-md);
		flex-shrink: 0;
	}

	.input-suffix {
		padding-right: var(--space-md);
		color: var(--text-tertiary);
		font-size: var(--font-size-md);
		flex-shrink: 0;
	}

	.computed-label {
		font-weight: 400;
		color: var(--text-muted);
		font-size: var(--font-size-xs);
	}

	@media (max-width: 640px) {
		.header-meta {
			flex-direction: column;
			gap: var(--space-md);
		}

		.title-row {
			flex-direction: column;
			align-items: flex-start;
		}

		.item-title-row {
			flex-direction: column;
			align-items: flex-start;
		}
	}

	/* Key Dates / Milestones */
	.milestones-section {
		margin-top: var(--space-xxl);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
	}

	.milestones-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-lg);
	}

	.milestones-header h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin: 0;
	}

	.cal-link-global {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-xs) var(--space-sm);
		text-decoration: none;
		transition: color var(--transition-fast), border-color var(--transition-fast);
	}

	.cal-link-global:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/* Timeline */
	.milestones-timeline {
		display: flex;
		flex-direction: column;
	}

	.milestone-row {
		display: flex;
		gap: var(--space-md);
		align-items: stretch;
		min-height: 56px;
	}

	.milestone-dot-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
		width: 16px;
		padding-top: 4px;
	}

	.milestone-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--color-accent);
		border: 2px solid var(--bg-secondary);
		box-shadow: 0 0 0 2px var(--color-accent);
		flex-shrink: 0;
		transition: background var(--transition-fast), box-shadow var(--transition-fast);
	}

	.milestone-completed .milestone-dot {
		background: var(--color-success);
		box-shadow: 0 0 0 2px var(--color-success);
	}

	.milestone-line {
		flex: 1;
		width: 2px;
		background: var(--border-color);
		margin-top: 4px;
	}

	.milestone-row:last-child .milestone-line {
		display: none;
	}

	.milestone-content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding-bottom: var(--space-md);
		flex-wrap: wrap;
	}

	.milestone-main {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	.milestone-check-form {
		display: inline;
	}

	.milestone-checkbox {
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		color: var(--text-tertiary);
		transition: color var(--transition-fast);
	}

	.milestone-checkbox:hover {
		color: var(--color-accent);
	}

	.milestone-completed .milestone-checkbox {
		color: var(--color-success);
	}

	.milestone-label {
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-primary);
	}

	.milestone-label-done {
		color: var(--text-tertiary);
		text-decoration: line-through;
	}

	.milestone-meta {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
	}

	.milestone-date-form {
		display: inline;
	}

	.milestone-date-input {
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: var(--font-size-xs);
		font-family: inherit;
		cursor: pointer;
	}

	.milestone-date-input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.cal-link-ms {
		display: flex;
		align-items: center;
		color: var(--text-muted);
		text-decoration: none;
		padding: 2px;
		transition: color var(--transition-fast);
	}

	.cal-link-ms:hover {
		color: var(--color-accent);
	}

	.milestone-remove-form {
		display: inline;
	}

	.milestone-remove {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		font-size: var(--font-size-md);
		line-height: 1;
		padding: 0 2px;
		transition: color var(--transition-fast);
	}

	.milestone-remove:hover {
		color: var(--color-error);
	}

	/* Empty state / seed */
	.milestones-empty {
		padding: var(--space-lg) 0;
		color: var(--text-tertiary);
		font-size: var(--font-size-sm);
	}

	.milestones-empty p {
		margin-bottom: var(--space-md);
	}

	.seed-form {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.seed-label {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
	}

	.btn-seed {
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
		background: transparent;
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.btn-seed:hover {
		background: rgba(74, 122, 245, 0.1);
	}

	/* Add milestone form */
	.add-milestone-form {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
		margin-top: var(--space-lg);
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border-color);
	}

	.milestone-label-input {
		flex: 1;
		min-width: 180px;
	}

	/* Partner Access */
	.partners-section {
		margin-top: var(--space-xxl);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
	}

	.partners-section h2 {
		font-size: var(--font-size-lg);
		font-weight: 600;
		margin-bottom: var(--space-lg);
	}

	.partner-links-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		margin-bottom: var(--space-lg);
	}

	.partner-link-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-md);
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		flex-wrap: wrap;
	}

	.partner-link-info {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
		font-size: var(--font-size-sm);
	}

	.partner-name {
		font-weight: 600;
		color: var(--text-primary);
	}

	.partner-email {
		color: var(--text-secondary);
	}

	.partner-type-tag {
		font-size: var(--font-size-xs);
		padding: 1px 8px;
		background: rgba(74, 122, 245, 0.12);
		color: var(--color-accent);
		border-radius: var(--radius-full);
		font-weight: 500;
		text-transform: capitalize;
	}

	.partner-expires {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.btn-revoke {
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-size-xs);
		font-weight: 600;
		background: transparent;
		color: var(--color-error);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: var(--radius-md);
		cursor: pointer;
		transition: background var(--transition-fast);
		flex-shrink: 0;
	}

	.btn-revoke:hover {
		background: rgba(239, 68, 68, 0.1);
	}

	.invite-partner-form {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-wrap: wrap;
		padding-top: var(--space-lg);
		border-top: 1px solid var(--border-color);
	}
</style>
