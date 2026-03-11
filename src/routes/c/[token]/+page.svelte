<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import Badge from '$components/ui/Badge.svelte';
	import ActivityToast from '$components/ui/ActivityToast.svelte';
	import FilePreview from '$components/ui/FilePreview.svelte';
	import SignaturePad from '$components/ui/SignaturePad.svelte';
	import { isPushSupported, registerServiceWorker, subscribeToPush, isPushSubscribed } from '$lib/push-subscription';

	let notifPermission = $state<string>('default');
	let notifDismissed = $state(false);
	let swRegistration = $state<ServiceWorkerRegistration | null>(null);
	let installPromptEvent = $state<any>(null);
	let showInstallBanner = $state(false);

	async function initNotifState() {
		if (typeof window === 'undefined') return;

		notifDismissed = localStorage.getItem('cr-notif-dismissed') === '1';

		// Register service worker
		const reg = await registerServiceWorker();
		swRegistration = reg;

		if (reg && isPushSupported()) {
			const subscribed = await isPushSubscribed(reg);
			notifPermission = subscribed ? 'granted' : (typeof Notification !== 'undefined' ? Notification.permission : 'default');
		} else if (typeof Notification !== 'undefined') {
			notifPermission = Notification.permission;
		}

		// Listen for install prompt (PWA)
		window.addEventListener('beforeinstallprompt', (e: any) => {
			e.preventDefault();
			installPromptEvent = e;
			// Only show if not already dismissed
			if (localStorage.getItem('cr-install-dismissed') !== '1') {
				showInstallBanner = true;
			}
		});
	}

	async function enableNotifications() {
		if (swRegistration && isPushSupported()) {
			const result = await subscribeToPush(swRegistration);
			notifPermission = result;
		} else if (typeof Notification !== 'undefined') {
			const result = await Notification.requestPermission();
			notifPermission = result;
		}
		if (notifPermission !== 'default') notifDismissed = true;
	}

	function dismissNotifPrompt() {
		notifDismissed = true;
		localStorage.setItem('cr-notif-dismissed', '1');
	}

	async function installApp() {
		if (!installPromptEvent) return;
		installPromptEvent.prompt();
		const result = await installPromptEvent.userChoice;
		if (result.outcome === 'accepted') {
			showInstallBanner = false;
		}
		installPromptEvent = null;
	}

	function dismissInstallBanner() {
		showInstallBanner = false;
		localStorage.setItem('cr-install-dismissed', '1');
	}

	$effect(() => { initNotifState(); });

	let { data } = $props();

	let txn = $derived(data.transaction);

	let completedCount = $derived(
		txn ? txn.items.filter((i: any) => ['accepted', 'waived', 'submitted'].includes(i.status)).length : 0
	);
	let totalCount = $derived(txn ? txn.items.length : 0);
	let progressPct = $derived(totalCount > 0 ? (completedCount / totalCount) * 100 : 0);

	// Step progress stages
	let requiredItems = $derived(txn ? txn.items.filter((i: any) => i.required) : []);
	let hasUploading = $derived(txn ? txn.items.some((i: any) => i.status === 'pending' || i.status === 'rejected') : false);
	let hasUnderReview = $derived(txn ? txn.items.some((i: any) => i.status === 'submitted') : false);
	let allComplete = $derived(requiredItems.length > 0 && requiredItems.every((i: any) => ['accepted', 'waived'].includes(i.status)));

	function currentStage(): number {
		if (allComplete) return 4;
		if (hasUnderReview && !hasUploading) return 3;
		if (completedCount > 0 || hasUnderReview) return 2;
		return 1;
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

	function itemStatusLabel(status: string) {
		switch (status) {
			case 'accepted': return 'Complete';
			case 'submitted': return 'Under Review';
			case 'rejected': return 'Needs Attention';
			case 'waived': return 'Waived';
			case 'pending': return 'Action Needed';
			default: return status;
		}
	}

	function formatDate(dateStr: string | null) {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function formatFileSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function filesForItem(itemId: string) {
		return data.files.filter((f: any) => f.checklist_item_id === itemId);
	}

	// Activity notifications — items with unseen pro activity
	let unseenItems = $derived(() => {
		const lastSeen = data.lastSeenAt;
		const activity = data.itemActivity || [];
		const set = new Set<string>();
		for (const a of activity) {
			if (a.lastActorType === 'pro' && (!lastSeen || a.lastActivityAt > lastSeen)) {
				set.add(a.checklistItemId);
			}
		}
		return set;
	});

	// Track which items have expanded forms — auto-expand unseen items
	let expandedItems = $state<Set<string>>(new Set());
	let uploadingItems = $state<Set<string>>(new Set());
	let uploadResults = $state<Map<string, { success: boolean; error?: string }>>(new Map());
	let previewFile = $state<{ id: string; filename: string; mime_type: string; file_size: number } | null>(null);

	function toggleItem(id: string) {
		const next = new Set(expandedItems);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expandedItems = next;
	}

	async function handleFileUpload(itemId: string, files: FileList | null) {
		if (!files?.length || !txn) return;

		// Mark uploading
		const next = new Set(uploadingItems);
		next.add(itemId);
		uploadingItems = next;

		// Clear previous results for this item
		const cleared = new Map(uploadResults);
		cleared.delete(itemId);
		uploadResults = cleared;

		let allSucceeded = true;
		const errors: string[] = [];

		for (const file of files) {
			const formData = new FormData();
			formData.append('file', file);
			formData.append('checklistItemId', itemId);
			formData.append('transactionId', txn.id);

			try {
				const response = await fetch('/api/upload', { method: 'POST', body: formData });
				if (!response.ok) {
					const errData = await response.json().catch(() => ({ message: 'Upload failed' }));
					errors.push(`${file.name}: ${errData.message || 'Upload failed'}`);
					allSucceeded = false;
				}
			} catch (err) {
				errors.push(`${file.name}: Network error`);
				allSucceeded = false;
			}
		}

		// Clear uploading state
		const done = new Set(uploadingItems);
		done.delete(itemId);
		uploadingItems = done;

		// Store result
		const results = new Map(uploadResults);
		results.set(itemId, { success: allSucceeded, error: errors.length > 0 ? errors.join('; ') : undefined });
		uploadResults = results;

		// Re-run load function to refresh files and statuses without full page reload
		await invalidateAll();

		// Clear success message after 3 seconds
		if (allSucceeded) {
			setTimeout(() => {
				const c = new Map(uploadResults);
				c.delete(itemId);
				uploadResults = c;
			}, 3000);
		}
	}

	function onDropZoneClick(itemId: string) {
		const input = document.createElement('input');
		input.type = 'file';
		input.multiple = true;
		input.accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx';
		input.onchange = () => handleFileUpload(itemId, input.files);
		input.click();
	}

	function onDrop(e: DragEvent, itemId: string) {
		e.preventDefault();
		handleFileUpload(itemId, e.dataTransfer?.files || null);
	}

	let signingItems = $state<Set<string>>(new Set());

	async function handleSignature(itemId: string, sigData: { blob: Blob; mode: 'draw' | 'type'; typedName?: string }) {
		if (!txn) return;

		const next = new Set(signingItems);
		next.add(itemId);
		signingItems = next;

		try {
			const formData = new FormData();
			formData.append('signature', sigData.blob, 'signature.png');
			formData.append('itemId', itemId);
			formData.append('mode', sigData.mode);
			if (sigData.typedName) formData.append('typedName', sigData.typedName);
			formData.append('consent', 'true');

			const response = await fetch('/api/signature', { method: 'POST', body: formData });

			if (!response.ok) {
				const errData = await response.json().catch(() => ({ message: 'Signature submission failed' }));
				alert(errData.message || 'Signature submission failed. Please try again.');
			}

			await invalidateAll();
		} catch (err) {
			alert('Network error. Please try again.');
		} finally {
			const done = new Set(signingItems);
			done.delete(itemId);
			signingItems = done;
		}
	}

	function onDragOver(e: DragEvent) {
		e.preventDefault();
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
</script>

<svelte:head>
	<title>{txn?.title || 'Document Request'} — CollectRelay</title>
</svelte:head>

{#if !txn}
	<div class="error-state">
		<h1>Request Not Found</h1>
		<p>This document request could not be found. It may have been completed or the link may have expired.</p>
	</div>
{:else}
	<div class="client-portal">
		{#if notifPermission === 'default' && !notifDismissed}
			<div class="notif-prompt">
				<div class="notif-prompt-content">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
					</svg>
					<span>Get notified when your agent responds.</span>
					<button class="notif-enable" onclick={enableNotifications}>Enable notifications</button>
				</div>
				<button class="notif-dismiss" onclick={dismissNotifPrompt} aria-label="Dismiss">
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>
		{/if}

		{#if showInstallBanner}
			<div class="install-prompt">
				<div class="notif-prompt-content">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
					</svg>
					<span>Add to home screen for easy access.</span>
					<button class="notif-enable" onclick={installApp}>Install</button>
				</div>
				<button class="notif-dismiss" onclick={dismissInstallBanner} aria-label="Dismiss">
					<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>
		{/if}

		<div class="portal-header">
			<h1>{txn.title}</h1>
			{#if txn.due_date}
				<p class="due-info">Please complete by {formatDate(txn.due_date)}</p>
			{/if}
		</div>

		<div class="progress-card">
			<div class="progress-info">
				<span class="progress-label">{completedCount} of {totalCount} items complete</span>
				<span class="progress-pct">{Math.round(progressPct)}%</span>
			</div>
			<div class="progress-bar">
				<div class="progress-fill" style="width: {progressPct}%"></div>
			</div>
			<div class="step-progress">
				<div class="step" class:active={currentStage() >= 1} class:done={currentStage() > 1}>
					<div class="step-dot">
						{#if currentStage() > 1}
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
						{/if}
					</div>
					<span class="step-label">Requested</span>
				</div>
				<div class="step-line" class:filled={currentStage() > 1}></div>
				<div class="step" class:active={currentStage() >= 2} class:done={currentStage() > 2}>
					<div class="step-dot">
						{#if currentStage() > 2}
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
						{/if}
					</div>
					<span class="step-label">Uploading</span>
				</div>
				<div class="step-line" class:filled={currentStage() > 2}></div>
				<div class="step" class:active={currentStage() >= 3} class:done={currentStage() > 3}>
					<div class="step-dot">
						{#if currentStage() > 3}
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
						{/if}
					</div>
					<span class="step-label">Under Review</span>
				</div>
				<div class="step-line" class:filled={currentStage() >= 4}></div>
				<div class="step" class:active={currentStage() >= 4}>
					<div class="step-dot">
						{#if currentStage() >= 4}
							<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
						{/if}
					</div>
					<span class="step-label">Complete</span>
				</div>
			</div>
		</div>

		<div class="items-list">
			{#each txn.items as item, i}
				{@const hasUnseen = unseenItems().has(item.id)}
				{@const isOpen = expandedItems.has(item.id) || item.status === 'rejected' || hasUnseen}
				{@const needsAction = item.status === 'pending' || item.status === 'rejected'}
				<div class="item-card" class:needs-action={needsAction} class:done={item.status === 'accepted' || item.status === 'waived'}>
					<button class="item-toggle" onclick={() => toggleItem(item.id)}>
						<div class="item-icon">
							{#if item.status === 'accepted' || item.status === 'waived'}
								<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-success)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									<polyline points="20 6 9 17 4 12"/>
								</svg>
							{:else if item.status === 'submitted'}
								<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-info)" stroke-width="2" stroke-linecap="round">
									<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
								</svg>
							{:else if item.status === 'rejected'}
								<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-error)" stroke-width="2" stroke-linecap="round">
									<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
								</svg>
							{:else}
								<span class="item-number">{i + 1}</span>
							{/if}
						</div>
						<div class="item-info">
							<span class="item-name">{item.name}</span>
							<div class="item-badges-row">
								{#if hasUnseen}
									<span class="activity-dot" title="New update from your agent"></span>
								{/if}
								<Badge variant={itemStatusVariant(item.status)}>{itemStatusLabel(item.status)}</Badge>
							</div>
						</div>
						<svg class="chevron" class:open={isOpen} viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
							<polyline points="6 9 12 15 18 9"/>
						</svg>
					</button>

					{#if isOpen}
						<div class="item-body">
							{#if item.description}
								<p class="item-desc">{item.description}</p>
							{/if}

							{#if item.review_note}
								<div class="rejection-note">
									<strong>Feedback:</strong> {item.review_note}
								</div>
							{/if}

							<!-- Document items: show upload zone -->
							{#if item.item_type === 'document'}
								{@const itemFiles = filesForItem(item.id)}
								{#if itemFiles.length > 0}
									<div class="uploaded-files">
										{#each itemFiles as file}
											<div class="file-row">
												<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
													<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
													<polyline points="14 2 14 8 20 8"/>
												</svg>
												<button class="file-name file-link file-preview-btn" onclick={() => { previewFile = file; }}>{file.filename}</button>
												<span class="file-size">{formatFileSize(file.file_size)}</span>
												{#if !file.uploaded_by_client}
													<span class="from-agent-badge">From your agent</span>
												{/if}
											</div>
										{/each}
									</div>
								{/if}

								{#if item.status !== 'accepted' && item.status !== 'waived'}
									{#if uploadingItems.has(item.id)}
										<div class="upload-zone uploading">
											<div class="upload-spinner"></div>
											<p>Uploading…</p>
										</div>
									{:else}
										<!-- svelte-ignore a11y_no_static_element_interactions -->
										<div class="upload-zone" role="button" tabindex="0"
											onclick={() => onDropZoneClick(item.id)}
											onkeydown={(e) => { if (e.key === 'Enter') onDropZoneClick(item.id); }}
											ondrop={(e) => onDrop(e, item.id)}
											ondragover={onDragOver}>
											<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
												<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
												<polyline points="17 8 12 3 7 8"/>
												<line x1="12" y1="3" x2="12" y2="15"/>
											</svg>
											<p>{itemFiles.length > 0 ? 'Upload additional documents' : 'Click to upload or drag and drop'}</p>
											<span class="upload-hint">PDF, JPG, PNG up to 50MB</span>
										</div>
									{/if}
								{/if}

								{#if uploadResults.get(item.id)?.success}
									<div class="upload-success">
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
										Files uploaded successfully
									</div>
								{:else if uploadResults.get(item.id)?.error}
									<div class="upload-error">
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
										{uploadResults.get(item.id)?.error}
									</div>
								{/if}
							{/if}

							<!-- Question items: show textarea -->
							{#if item.item_type === 'question'}
								{#if item.answer && item.status !== 'rejected'}
									<div class="submitted-answer">
										<span class="answer-label">Your answer:</span>
										<p>{item.answer}</p>
									</div>
								{:else if needsAction}
									<form method="POST" action="?/submitAnswer" use:enhance>
										<input type="hidden" name="itemId" value={item.id} />
										<textarea
											name="answer"
											placeholder="Type your answer here…"
											rows="3"
											required
										>{item.answer || ''}</textarea>
										<button type="submit" class="btn-submit">Submit Answer</button>
									</form>
								{/if}
							{/if}

							<!-- Checkbox items: show toggle -->
							{#if item.item_type === 'checkbox'}
								{#if item.status === 'accepted' || item.status === 'submitted'}
									<p class="checkbox-done">You have acknowledged this item.</p>
								{:else if needsAction}
									<form method="POST" action="?/submitAnswer" use:enhance>
										<input type="hidden" name="itemId" value={item.id} />
										<input type="hidden" name="answer" value="confirmed" />
										<button type="submit" class="btn-checkbox">
											<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
												<polyline points="20 6 9 17 4 12"/>
											</svg>
											I confirm
										</button>
									</form>
								{/if}
							{/if}

							<!-- Signature items -->
							{#if item.item_type === 'signature'}
								{#if item.status === 'accepted' || item.status === 'waived'}
									<div class="signature-status done">
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
											<polyline points="20 6 9 17 4 12" />
										</svg>
										Signature {item.status === 'accepted' ? 'accepted' : 'waived'}
									</div>
								{:else if item.status === 'submitted'}
									<div class="signature-status pending">
										<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
										</svg>
										Signature submitted — under review
									</div>
									{@const sigFiles = filesForItem(item.id)}
									{#if sigFiles.length > 0}
										<div class="signature-preview-img">
											<img src="/api/files/{sigFiles[0].id}" alt="Your signature" />
										</div>
									{/if}
								{:else if needsAction}
									<SignaturePad
										onSignature={(sigData) => handleSignature(item.id, sigData)}
										disabled={signingItems.has(item.id)}
									/>
								{/if}
							{/if}

							<!-- Comments -->
							{#if commentsForItem(item.id).length > 0}
								<div class="comments-thread">
									{#each commentsForItem(item.id) as comment}
										<div class="comment" class:comment-pro={comment.author_type === 'pro'} class:comment-client={comment.author_type === 'client'}>
											<div class="comment-header">
												<span class="comment-author">{comment.author_name}</span>
												<span class="comment-badge" class:badge-pro={comment.author_type === 'pro'} class:badge-client={comment.author_type === 'client'}>
													{comment.author_type === 'pro' ? 'Agent' : 'You'}
												</span>
												<span class="comment-time">{formatRelativeTime(comment.created_at)}</span>
											</div>
											<p class="comment-body">{comment.content}</p>
										</div>
									{/each}
								</div>
							{/if}

							<form method="POST" action="?/addComment" use:enhance class="comment-form">
								<input type="hidden" name="checklistItemId" value={item.id} />
								<input type="text" name="content" placeholder="Ask a question or leave a comment…" required class="comment-input" />
								<button type="submit" class="comment-send" title="Send">
									<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
									</svg>
								</button>
							</form>
						</div>
					{/if}
				</div>
			{/each}
		</div>

		<FilePreview file={previewFile} onclose={() => { previewFile = null; }} />
		<ActivityToast transactionId={txn.id} />
	</div>
{/if}

<style>
	.error-state {
		text-align: center;
		padding: var(--space-xxl);
	}

	.error-state h1 {
		font-size: var(--font-size-xl);
		margin-bottom: var(--space-md);
	}

	.error-state p {
		color: var(--text-secondary);
	}

	.portal-header {
		margin-bottom: var(--space-xl);
	}

	.portal-header h1 {
		font-size: var(--font-size-xl);
		font-weight: 700;
		margin-bottom: var(--space-xs);
	}

	.due-info {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
	}

	/* Progress card */
	.progress-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.progress-info {
		display: flex;
		justify-content: space-between;
		margin-bottom: var(--space-sm);
	}

	.progress-label {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.progress-pct {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-accent);
	}

	.progress-bar {
		height: 8px;
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

	/* Step progress indicator */
	.step-progress {
		display: flex;
		align-items: center;
		margin-top: var(--space-lg);
		gap: 0;
	}

	.step {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		flex-shrink: 0;
	}

	.step-dot {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid var(--border-color);
		background: var(--bg-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
		color: #fff;
	}

	.step.active .step-dot {
		border-color: var(--color-accent);
		background: var(--color-accent);
	}

	.step.done .step-dot {
		border-color: var(--color-accent);
		background: var(--color-accent);
	}

	.step-label {
		font-size: 11px;
		color: var(--text-tertiary);
		font-weight: 500;
		white-space: nowrap;
	}

	.step.active .step-label {
		color: var(--color-accent);
		font-weight: 600;
	}

	.step-line {
		flex: 1;
		height: 2px;
		background: var(--border-color);
		margin: 0 var(--space-xs);
		margin-bottom: 22px;
		transition: background var(--transition-fast);
		min-width: 20px;
	}

	.step-line.filled {
		background: var(--color-accent);
	}

	/* Items list */
	.items-list {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.item-card {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
		transition: border-color var(--transition-fast);
	}

	.item-card.needs-action { border-left: 3px solid var(--color-accent); }
	.item-card.done { opacity: 0.7; }

	.item-toggle {
		width: 100%;
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		color: var(--text-primary);
	}

	.item-toggle:hover { background: var(--bg-tertiary); }

	.item-icon {
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		background: var(--bg-tertiary);
		flex-shrink: 0;
	}

	.item-number {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-tertiary);
	}

	.item-info {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		min-width: 0;
	}

	.item-name {
		font-weight: 500;
		font-size: var(--font-size-md);
	}

	.item-badges-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
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

	.chevron {
		color: var(--text-tertiary);
		flex-shrink: 0;
		transition: transform var(--transition-fast);
	}

	.chevron.open { transform: rotate(180deg); }

	/* Item body */
	.item-body {
		padding: 0 var(--space-lg) var(--space-lg);
		padding-left: calc(var(--space-lg) + 32px + var(--space-md));
	}

	.item-desc {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
	}

	.rejection-note {
		padding: var(--space-sm) var(--space-md);
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-md);
		color: var(--color-error);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-md);
	}

	/* Upload zone */
	.upload-zone {
		border: 2px dashed var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-xl);
		text-align: center;
		cursor: pointer;
		transition: border-color var(--transition-fast), background var(--transition-fast);
	}

	.upload-zone:hover {
		border-color: var(--color-accent);
		background: rgba(16, 185, 129, 0.05);
	}

	.upload-zone.uploading {
		border-color: var(--color-accent);
		background: rgba(16, 185, 129, 0.05);
		pointer-events: none;
	}

	.upload-zone svg {
		color: var(--text-tertiary);
		margin-bottom: var(--space-sm);
	}

	.upload-zone p {
		color: var(--text-secondary);
		font-size: var(--font-size-sm);
		margin-bottom: var(--space-xs);
	}

	.upload-hint {
		color: var(--text-tertiary);
		font-size: var(--font-size-xs);
	}

	.upload-spinner {
		width: 24px;
		height: 24px;
		border: 2.5px solid var(--border-color);
		border-top-color: var(--color-accent);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
		margin: 0 auto var(--space-sm);
	}

	@keyframes spin { to { transform: rotate(360deg); } }

	.upload-success {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.2);
		border-radius: var(--radius-md);
		color: var(--color-success, #10b981);
		font-size: var(--font-size-sm);
		margin-top: var(--space-sm);
	}

	.upload-error {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		border-radius: var(--radius-md);
		color: var(--color-error, #ef4444);
		font-size: var(--font-size-sm);
		margin-top: var(--space-sm);
	}

	.uploaded-files {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-bottom: var(--space-md);
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
	.file-name { flex: 1; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.file-link { color: var(--color-accent); text-decoration: none; }
	.file-link:hover { text-decoration: underline; }
	.file-preview-btn { background: none; border: none; padding: 0; cursor: pointer; font-size: inherit; font-family: inherit; text-align: left; }
	.file-size { color: var(--text-tertiary); font-size: var(--font-size-xs); flex-shrink: 0; }

	.from-agent-badge {
		font-size: 10px;
		padding: 1px 8px;
		border-radius: var(--radius-full);
		font-weight: 500;
		background: rgba(139, 92, 246, 0.15);
		color: #8b5cf6;
		white-space: nowrap;
		flex-shrink: 0;
	}

	/* Question form */
	textarea {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-md);
		font-family: inherit;
		resize: vertical;
		margin-bottom: var(--space-sm);
	}

	textarea:focus { outline: none; border-color: var(--color-accent); }

	.btn-submit {
		padding: var(--space-xs) var(--space-lg);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.btn-submit:hover { background: var(--color-accent-hover); }

	.submitted-answer {
		padding: var(--space-sm) var(--space-md);
		background: var(--bg-primary);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
	}

	.answer-label {
		color: var(--text-tertiary);
		font-weight: 500;
		display: block;
		margin-bottom: var(--space-xs);
	}

	/* Checkbox */
	.btn-checkbox {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-lg);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-md);
		border: none;
		cursor: pointer;
		transition: background var(--transition-fast);
	}

	.btn-checkbox:hover { background: var(--color-accent-hover); }

	.checkbox-done {
		color: var(--color-success);
		font-size: var(--font-size-sm);
	}

	/* Signature states */
	.signature-status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: var(--font-size-sm);
		font-weight: 500;
		padding: var(--space-xs) var(--space-md);
		border-radius: var(--radius-md);
	}

	.signature-status.done {
		color: var(--color-success);
		background: rgba(16, 185, 129, 0.1);
	}

	.signature-status.pending {
		color: var(--color-info, #3b82f6);
		background: rgba(59, 130, 246, 0.1);
	}

	.signature-preview-img {
		margin-top: var(--space-sm);
		padding: var(--space-md);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		text-align: center;
	}

	.signature-preview-img img {
		max-width: 300px;
		max-height: 150px;
		object-fit: contain;
	}

	/* Comments */
	.comments-thread {
		margin-top: var(--space-md);
		padding-left: var(--space-md);
		border-left: 2px solid var(--border-color);
		margin-bottom: var(--space-sm);
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

	.badge-pro {
		background: rgba(139, 92, 246, 0.15);
		color: #8b5cf6;
	}

	.badge-client {
		background: rgba(16, 185, 129, 0.15);
		color: var(--color-accent);
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
		margin-top: var(--space-md);
	}

	.comment-input {
		flex: 1;
		padding: var(--space-xs) var(--space-sm);
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		color: var(--text-primary);
		font-size: var(--font-size-sm);
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
		width: 36px;
		height: 36px;
		background: var(--color-accent);
		color: var(--text-inverse);
		border: none;
		border-radius: var(--radius-md);
		cursor: pointer;
		flex-shrink: 0;
		transition: background var(--transition-fast);
	}

	.comment-send:hover { background: var(--color-accent-hover); }

	/* Notification prompt banner */
	.notif-prompt {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: rgba(59, 130, 246, 0.08);
		border: 1px solid rgba(59, 130, 246, 0.2);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-lg);
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: translateY(-8px); }
		to { opacity: 1; transform: translateY(0); }
	}

	.notif-prompt-content {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex: 1;
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}

	.notif-prompt-content svg {
		color: #3b82f6;
		flex-shrink: 0;
	}

	.notif-enable {
		background: none;
		border: none;
		color: #3b82f6;
		font-weight: 600;
		font-size: var(--font-size-sm);
		cursor: pointer;
		white-space: nowrap;
		padding: 2px 4px;
		border-radius: var(--radius-sm);
	}

	.notif-enable:hover {
		text-decoration: underline;
	}

	.notif-dismiss {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		background: none;
		border: none;
		color: var(--text-tertiary);
		cursor: pointer;
		border-radius: var(--radius-sm);
		flex-shrink: 0;
	}

	.notif-dismiss:hover {
		color: var(--text-primary);
		background: rgba(0, 0, 0, 0.05);
	}

	/* Install PWA prompt — reuses notif-prompt styling */
	.install-prompt {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-md);
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.2);
		border-radius: var(--radius-lg);
		margin-bottom: var(--space-lg);
		animation: fadeIn 0.3s ease;
	}

	.install-prompt svg {
		color: var(--color-accent);
		flex-shrink: 0;
	}
</style>
