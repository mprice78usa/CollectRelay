<script lang="ts">
	import Card from '$components/ui/Card.svelte';
	import Badge from '$components/ui/Badge.svelte';
	import { getTerms } from '$lib/terminology';
	import { addToSyncQueue } from '$lib/offline/db';
	import { getOfflineState } from '$lib/offline/status.svelte';
	import { refreshPendingCount, registerBackgroundSync } from '$lib/offline/sync';

	const offlineState = getOfflineState();

	let { data } = $props();

	let terms = $derived(getTerms(data.industry));

	const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
		active: { label: 'Active', variant: 'success' },
		in_review: { label: 'In Review', variant: 'warning' },
		completed: { label: 'Completed', variant: 'info' },
		cancelled: { label: 'Cancelled', variant: 'error' },
		draft: { label: 'Draft', variant: 'default' }
	};

	let actionLabels = $derived<Record<string, string>>({
		file_uploaded: 'uploaded a file',
		item_accepted: `accepted an ${terms.item.toLowerCase()}`,
		item_rejected: `rejected an ${terms.item.toLowerCase()}`,
		item_waived: `waived an ${terms.item.toLowerCase()}`,
		answer_submitted: 'submitted an answer',
		magic_link_sent: 'sent a client link',
		status_changed: 'changed status',
		transaction_created: `created ${terms.transaction.toLowerCase()}`
	});

	const actionIcons: Record<string, { path: string; color: string }> = {
		file_uploaded: { path: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M17 8l-5-5-5 5 M12 3v12', color: '#3b82f6' },
		item_accepted: { path: 'M22 11.08V12a10 10 0 11-5.93-9.14 M22 4L12 14.01l-3-3', color: '#10b981' },
		item_rejected: { path: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M15 9l-6 6 M9 9l6 6', color: '#ef4444' },
		item_waived: { path: 'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11', color: '#8b5cf6' },
		answer_submitted: { path: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z', color: '#f59e0b' },
		magic_link_sent: { path: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6', color: '#06b6d4' },
		status_changed: { path: 'M1 4v6h6 M23 20v-6h-6 M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15', color: '#8b5cf6' },
		transaction_created: { path: 'M12 5v14 M5 12h14', color: '#10b981' }
	};

	function formatRelativeTime(iso: string): string {
		const now = Date.now();
		const then = new Date(iso).getTime();
		const diff = now - then;
		const minutes = Math.floor(diff / 60000);
		const hours = Math.floor(diff / 3600000);
		const days = Math.floor(diff / 86400000);

		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		if (hours < 24) return `${hours}h ago`;
		if (days < 7) return `${days}d ago`;
		return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatDate(iso: string): string {
		return new Date(iso).toLocaleDateString('en-US', {
			month: 'short', day: 'numeric'
		});
	}

	function progressPercent(completed: number, total: number): number {
		if (total === 0) return 0;
		return Math.round((completed / total) * 100);
	}

	function formatCurrency(value: number | null): string {
		if (value == null || value === 0) return '$0';
		if (value >= 1000000) return '$' + (value / 1000000).toFixed(1) + 'M';
		if (value >= 1000) return '$' + (value / 1000).toFixed(0) + 'K';
		return '$' + value.toLocaleString();
	}

	function formatCurrencyFull(value: number | null): string {
		if (value == null) return '—';
		return '$' + value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
	}

	function riskLevel(sale: any): 'green' | 'yellow' | 'red' {
		const pct = sale.item_count > 0 ? (sale.completed_count / sale.item_count) * 100 : 0;
		const now = Date.now();
		const dueDate = sale.due_date ? new Date(sale.due_date).getTime() : null;
		const lastUpdate = new Date(sale.updated_at).getTime();
		const daysSinceUpdate = (now - lastUpdate) / 86400000;

		// Red: past due or no activity in 7+ days
		if (dueDate && now > dueDate) return 'red';
		if (daysSinceUpdate > 7) return 'red';

		// Yellow: progress <50% with due date within 7 days, or has rejected items
		if (dueDate && (dueDate - now) < 7 * 86400000 && pct < 50) return 'yellow';

		return 'green';
	}

	// Quick Add state
	let showQuickAdd = $state(false);
	type QuickAddTab = 'voice' | 'text' | 'photo';
	let quickAddTab = $state<QuickAddTab>('voice');
	type QuickAddStep = 'input' | 'assign' | 'processing' | 'review' | 'success' | 'error';
	let quickAddStep = $state<QuickAddStep>('input');

	// Voice recording state (for Quick Add)
	let qaRecordingDuration = $state(0);
	let qaRecordingTimer: ReturnType<typeof setInterval> | null = null;
	let qaMediaRecorder: MediaRecorder | null = null;
	let qaAudioChunks: Blob[] = [];
	let qaAudioBlob = $state<Blob | null>(null);
	let qaVoiceNoteId = $state<string | null>(null);
	let qaVoiceResult = $state<{ transcript: string; actions: any } | null>(null);
	let qaVoiceError = $state<string | null>(null);
	let qaPollingTimer: ReturnType<typeof setInterval> | null = null;
	let qaRelayLoading = $state(false);
	let qaSelectedActions = $state<Set<number>>(new Set());
	let qaEditableActions = $state<Array<{ task: string; priority: string }>>([]);
	let qaEditableSummary = $state('');
	let qaIsRecording = $state(false);

	// Text note state
	let textTitle = $state('');
	let textContent = $state('');
	let textDestination = $state<'project' | 'library'>('project');
	let textSaving = $state(false);

	// Photo note state
	let qaPhotoFile = $state<File | null>(null);
	let qaPhotoPreview = $state<string | null>(null);
	let qaPhotoTitle = $state('');
	let qaPhotoNotes = $state('');
	let qaPhotoAnalyze = $state(false);
	let qaPhotoAudit = $state(false);
	let qaPhotoNoteId = $state<string | null>(null);
	let qaPhotoResult = $state<{ ai_description: string; actions: any } | null>(null);
	let qaAuditResult = $state<{ summary: string; overallSeverity: string; findings: any[]; findingCount: number; criticalCount: number; warningCount: number } | null>(null);
	let qaAuditId = $state<string | null>(null);
	let qaPhotoError = $state<string | null>(null);
	let qaPhotoUploading = $state(false);
	let qaPhotoPollingTimer: ReturnType<typeof setInterval> | null = null;
	let qaAuditPollingTimer: ReturnType<typeof setInterval> | null = null;
	let qaSelectedFindings = $state<Set<number>>(new Set());

	// Shared
	let selectedTransactionId = $state('');
	let qaSuccessMessage = $state('');

	function openQuickAdd() {
		showQuickAdd = true;
		quickAddTab = 'voice';
		quickAddStep = 'input';
		resetQuickAdd();
	}

	function resetQuickAdd() {
		qaRecordingDuration = 0;
		qaAudioBlob = null;
		qaVoiceNoteId = null;
		qaVoiceResult = null;
		qaVoiceError = null;
		qaIsRecording = false;
		qaEditableActions = [];
		qaEditableSummary = '';
		qaSelectedActions = new Set();
		qaRelayLoading = false;
		textTitle = '';
		textContent = '';
		textDestination = 'project';
		textSaving = false;
		qaPhotoFile = null;
		qaPhotoPreview = null;
		qaPhotoTitle = '';
		qaPhotoNotes = '';
		qaPhotoAnalyze = false;
		qaPhotoAudit = false;
		qaPhotoNoteId = null;
		qaPhotoResult = null;
		qaAuditResult = null;
		qaAuditId = null;
		qaPhotoError = null;
		qaPhotoUploading = false;
		qaSelectedFindings = new Set();
		if (qaPhotoPollingTimer) { clearInterval(qaPhotoPollingTimer); qaPhotoPollingTimer = null; }
		if (qaAuditPollingTimer) { clearInterval(qaAuditPollingTimer); qaAuditPollingTimer = null; }
		selectedTransactionId = '';
		qaSuccessMessage = '';
		if (qaRecordingTimer) { clearInterval(qaRecordingTimer); qaRecordingTimer = null; }
		if (qaPollingTimer) { clearInterval(qaPollingTimer); qaPollingTimer = null; }
	}

	function closeQuickAdd() {
		if (qaMediaRecorder && qaMediaRecorder.state === 'recording') {
			qaMediaRecorder.stop();
		}
		resetQuickAdd();
		showQuickAdd = false;
	}

	async function qaStartRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			qaAudioChunks = [];
			qaMediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
			qaMediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) qaAudioChunks.push(e.data);
			};
			qaMediaRecorder.onstop = () => {
				stream.getTracks().forEach(t => t.stop());
				if (qaRecordingTimer) { clearInterval(qaRecordingTimer); qaRecordingTimer = null; }
				qaAudioBlob = new Blob(qaAudioChunks, { type: 'audio/webm' });
				qaIsRecording = false;
				quickAddStep = 'assign';
			};
			qaMediaRecorder.start(250);
			qaIsRecording = true;
			qaRecordingDuration = 0;
			qaRecordingTimer = setInterval(() => {
				qaRecordingDuration++;
				if (qaRecordingDuration >= 120) qaStopRecording();
			}, 1000);
		} catch {
			qaVoiceError = 'Microphone access denied.';
			quickAddStep = 'error';
		}
	}

	function qaStopRecording() {
		if (qaMediaRecorder && qaMediaRecorder.state === 'recording') {
			qaMediaRecorder.stop();
		}
	}

	async function qaUploadAndProcess() {
		if (!qaAudioBlob || !selectedTransactionId) return;

		// Offline: queue for later sync
		if (!offlineState.isOnline) {
			try {
				const fileData = await qaAudioBlob.arrayBuffer();
				await addToSyncQueue({
					type: 'voice',
					transactionId: selectedTransactionId,
					payload: {
						transactionId: selectedTransactionId,
						duration: qaRecordingDuration
					},
					fileData,
					fileName: 'recording.webm',
					mimeType: 'audio/webm',
					createdAt: Date.now(),
					retryCount: 0,
					status: 'pending'
				});
				await refreshPendingCount();
				registerBackgroundSync();
				const txnName = data.assignableTransactions?.find((t: any) => t.id === selectedTransactionId)?.title || 'project';
				qaSuccessMessage = `Voice note queued for ${txnName} — will sync when online`;
				quickAddStep = 'success';
			} catch (err: any) {
				qaVoiceError = err.message || 'Failed to queue offline';
				quickAddStep = 'error';
			}
			return;
		}

		quickAddStep = 'processing';

		try {
			const formData = new FormData();
			formData.append('audio', qaAudioBlob, 'recording.webm');
			formData.append('transactionId', selectedTransactionId);
			formData.append('duration', qaRecordingDuration.toString());

			const res = await fetch('/api/voice-note', { method: 'POST', body: formData });
			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Upload failed' }));
				throw new Error(err.message || 'Upload failed');
			}
			const result = await res.json();
			qaVoiceNoteId = result.id;
			qaStartPolling();
		} catch (err: any) {
			qaVoiceError = err.message || 'Upload failed';
			quickAddStep = 'error';
		}
	}

	function qaStartPolling() {
		let elapsed = 0;
		qaPollingTimer = setInterval(async () => {
			elapsed += 2;
			if (elapsed > 60 || !qaVoiceNoteId) {
				if (qaPollingTimer) clearInterval(qaPollingTimer);
				qaVoiceError = 'Processing timed out.';
				quickAddStep = 'error';
				return;
			}
			try {
				const res = await fetch(`/api/voice-note/${qaVoiceNoteId}`);
				if (!res.ok) return;
				const d = await res.json();
				if (d.status === 'completed') {
					if (qaPollingTimer) clearInterval(qaPollingTimer);
					qaVoiceResult = { transcript: d.transcript, actions: d.actions };
					qaEditableActions = (d.actions?.new_actions || []).map((a: any) => ({ task: a.task, priority: a.priority || 'Medium' }));
					qaEditableSummary = d.actions?.summary || '';
					qaSelectedActions = new Set(qaEditableActions.map((_: any, i: number) => i));
					quickAddStep = 'review';
				} else if (d.status === 'failed') {
					if (qaPollingTimer) clearInterval(qaPollingTimer);
					qaVoiceError = 'Processing failed.';
					quickAddStep = 'error';
				}
			} catch { /* keep polling */ }
		}, 2000);
	}

	function qaAddAction() {
		qaEditableActions = [...qaEditableActions, { task: '', priority: 'Medium' }];
		qaSelectedActions = new Set([...qaSelectedActions, qaEditableActions.length - 1]);
	}

	function qaRemoveAction(index: number) {
		qaEditableActions = qaEditableActions.filter((_, i) => i !== index);
		const next = new Set<number>();
		for (const i of qaSelectedActions) {
			if (i < index) next.add(i);
			else if (i > index) next.add(i - 1);
		}
		qaSelectedActions = next;
	}

	async function qaRelayActions() {
		if (!qaVoiceNoteId || qaEditableActions.length === 0) return;
		qaRelayLoading = true;

		const actions = qaEditableActions
			.filter((_, i) => qaSelectedActions.has(i))
			.filter(a => a.task.trim());

		if (actions.length === 0) {
			qaRelayLoading = false;
			return;
		}

		try {
			const res = await fetch(`/api/voice-note/${qaVoiceNoteId}/relay`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ actions, summary: qaEditableSummary })
			});
			if (res.ok) {
				const txnName = data.assignableTransactions?.find((t: any) => t.id === selectedTransactionId)?.title || 'project';
				qaSuccessMessage = `${actions.length} task${actions.length === 1 ? '' : 's'} added to ${txnName}`;
				quickAddStep = 'success';
			} else {
				qaVoiceError = 'Failed to relay actions';
				quickAddStep = 'error';
			}
		} catch {
			qaVoiceError = 'Failed to relay actions';
			quickAddStep = 'error';
		}
		qaRelayLoading = false;
	}

	async function saveTextNote() {
		if (!textTitle.trim()) return;
		textSaving = true;

		const body: any = {
			destination: textDestination,
			title: textTitle.trim(),
			content: textContent.trim()
		};
		if (textDestination === 'project') {
			if (!selectedTransactionId) { textSaving = false; return; }
			body.transactionId = selectedTransactionId;
		}

		// Offline: queue for later sync (project notes only)
		if (!offlineState.isOnline && textDestination === 'project') {
			try {
				await addToSyncQueue({
					type: 'text',
					transactionId: selectedTransactionId,
					payload: body,
					createdAt: Date.now(),
					retryCount: 0,
					status: 'pending'
				});
				await refreshPendingCount();
				registerBackgroundSync();
				const txnName = data.assignableTransactions?.find((t: any) => t.id === selectedTransactionId)?.title || 'project';
				qaSuccessMessage = `Note queued for ${txnName} — will sync when online`;
				quickAddStep = 'success';
			} catch {
				qaVoiceError = 'Failed to queue offline';
				quickAddStep = 'error';
			}
			textSaving = false;
			return;
		}

		try {
			const res = await fetch('/api/text-note', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});

			if (res.ok) {
				if (textDestination === 'project') {
					const txnName = data.assignableTransactions?.find((t: any) => t.id === selectedTransactionId)?.title || 'project';
					qaSuccessMessage = `Note added to ${txnName}`;
				} else {
					qaSuccessMessage = 'Note saved to Document Library';
				}
				quickAddStep = 'success';
			} else {
				qaVoiceError = 'Failed to save note';
				quickAddStep = 'error';
			}
		} catch {
			qaVoiceError = 'Failed to save note';
			quickAddStep = 'error';
		}
		textSaving = false;
	}

	function qaHandlePhotoSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		qaPhotoFile = file;
		qaPhotoTitle = file.name.replace(/\.[^.]+$/, '');
		const reader = new FileReader();
		reader.onload = () => { qaPhotoPreview = reader.result as string; };
		reader.readAsDataURL(file);
	}

	function qaRemovePhoto() {
		qaPhotoFile = null;
		qaPhotoPreview = null;
		qaPhotoTitle = '';
		qaPhotoNotes = '';
	}

	async function qaUploadPhoto() {
		if (!qaPhotoFile || !selectedTransactionId) return;
		qaPhotoUploading = true;
		qaPhotoError = null;

		// Offline: queue for later sync
		if (!offlineState.isOnline) {
			try {
				const fileData = await qaPhotoFile.arrayBuffer();
				await addToSyncQueue({
					type: 'photo',
					transactionId: selectedTransactionId,
					payload: {
						transactionId: selectedTransactionId,
						title: qaPhotoTitle.trim() || null,
						notes: qaPhotoNotes.trim() || null,
						analyzeWithAI: qaPhotoAnalyze
					},
					fileData,
					fileName: qaPhotoFile.name,
					mimeType: qaPhotoFile.type,
					createdAt: Date.now(),
					retryCount: 0,
					status: 'pending'
				});
				await refreshPendingCount();
				registerBackgroundSync();
				const txnName = data.assignableTransactions?.find((t: any) => t.id === selectedTransactionId)?.title || 'project';
				qaSuccessMessage = `Photo queued for ${txnName} — will sync when online`;
				quickAddStep = 'success';
			} catch (err: any) {
				qaPhotoError = err.message || 'Failed to queue offline';
				quickAddStep = 'error';
			}
			qaPhotoUploading = false;
			return;
		}

		try {
			const formData = new FormData();
			formData.append('photo', qaPhotoFile);
			formData.append('transactionId', selectedTransactionId);
			if (qaPhotoTitle.trim()) formData.append('title', qaPhotoTitle.trim());
			if (qaPhotoNotes.trim()) formData.append('notes', qaPhotoNotes.trim());
			formData.append('analyzeWithAI', qaPhotoAnalyze.toString());

			const res = await fetch('/api/photo-note', { method: 'POST', body: formData });
			if (!res.ok) {
				const err = await res.json().catch(() => ({ message: 'Upload failed' }));
				throw new Error(err.message || 'Upload failed');
			}
			const result = await res.json();
			qaPhotoNoteId = result.id;

			if (qaPhotoAnalyze) {
				quickAddStep = 'processing';
				qaStartPhotoPolling();
			} else {
				const txnName = data.assignableTransactions?.find((t: any) => t.id === selectedTransactionId)?.title || 'project';
				qaSuccessMessage = `Photo added to ${txnName}`;
				quickAddStep = 'success';
			}
		} catch (err: any) {
			qaPhotoError = err.message || 'Upload failed';
			quickAddStep = 'error';
		}
		qaPhotoUploading = false;
	}

	function qaStartPhotoPolling() {
		let elapsed = 0;
		qaPhotoPollingTimer = setInterval(async () => {
			elapsed += 2;
			if (elapsed > 60 || !qaPhotoNoteId) {
				if (qaPhotoPollingTimer) clearInterval(qaPhotoPollingTimer);
				qaPhotoError = 'Processing timed out.';
				quickAddStep = 'error';
				return;
			}
			try {
				const res = await fetch(`/api/photo-note/${qaPhotoNoteId}`);
				if (!res.ok) return;
				const d = await res.json();
				if (d.status === 'completed') {
					if (qaPhotoPollingTimer) clearInterval(qaPhotoPollingTimer);
					qaPhotoResult = { ai_description: d.ai_description, actions: d.actions };
					qaEditableActions = (d.actions?.new_actions || []).map((a: any) => ({ task: a.task, priority: a.priority || 'Medium' }));
					qaEditableSummary = d.actions?.summary || '';
					qaSelectedActions = new Set(qaEditableActions.map((_: any, i: number) => i));
					quickAddStep = 'review';
				} else if (d.status === 'failed') {
					if (qaPhotoPollingTimer) clearInterval(qaPhotoPollingTimer);
					qaPhotoError = 'AI analysis failed.';
					quickAddStep = 'error';
				}
			} catch { /* keep polling */ }
		}, 2000);
	}

	async function qaRelayPhotoActions() {
		if (!qaPhotoNoteId || qaEditableActions.length === 0) return;
		qaRelayLoading = true;

		const actions = qaEditableActions
			.filter((_, i) => qaSelectedActions.has(i))
			.filter(a => a.task.trim());

		if (actions.length === 0) {
			qaRelayLoading = false;
			return;
		}

		try {
			const res = await fetch(`/api/photo-note/${qaPhotoNoteId}/relay`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ actions, summary: qaEditableSummary })
			});
			if (res.ok) {
				const txnName = data.assignableTransactions?.find((t: any) => t.id === selectedTransactionId)?.title || 'project';
				qaSuccessMessage = `${actions.length} task${actions.length === 1 ? '' : 's'} added to ${txnName}`;
				quickAddStep = 'success';
			} else {
				qaPhotoError = 'Failed to relay actions';
				quickAddStep = 'error';
			}
		} catch {
			qaPhotoError = 'Failed to relay actions';
			quickAddStep = 'error';
		}
		qaRelayLoading = false;
	}

	async function qaUploadPhotoForAudit() {
		if (!qaPhotoFile || !selectedTransactionId) return;
		qaPhotoUploading = true;
		qaPhotoError = null;

		try {
			// Step 1: Upload the photo (without AI analysis)
			const formData = new FormData();
			formData.append('photo', qaPhotoFile);
			formData.append('transactionId', selectedTransactionId);
			if (qaPhotoTitle.trim()) formData.append('title', qaPhotoTitle.trim());
			if (qaPhotoNotes.trim()) formData.append('notes', qaPhotoNotes.trim());
			formData.append('analyzeWithAI', 'false');

			const uploadRes = await fetch('/api/photo-note', { method: 'POST', body: formData });
			if (!uploadRes.ok) {
				const err = await uploadRes.json().catch(() => ({ message: 'Upload failed' }));
				throw new Error(err.message || 'Upload failed');
			}
			const uploadResult = await uploadRes.json();
			qaPhotoNoteId = uploadResult.id;

			// Step 2: Start safety audit
			const auditRes = await fetch('/api/site-audit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ photoNoteId: uploadResult.id, transactionId: selectedTransactionId })
			});
			if (!auditRes.ok) {
				const err = await auditRes.json().catch(() => ({ message: 'Audit failed' }));
				throw new Error(err.message || 'Failed to start audit');
			}
			const auditResult = await auditRes.json();
			qaAuditId = auditResult.id;
			quickAddStep = 'processing';
			qaStartAuditPolling();
		} catch (err: any) {
			qaPhotoError = err.message || 'Upload failed';
			quickAddStep = 'error';
		}
		qaPhotoUploading = false;
	}

	function qaStartAuditPolling() {
		let elapsed = 0;
		qaAuditPollingTimer = setInterval(async () => {
			elapsed += 2;
			if (elapsed > 90 || !qaAuditId) {
				if (qaAuditPollingTimer) clearInterval(qaAuditPollingTimer);
				qaPhotoError = 'Audit processing timed out.';
				quickAddStep = 'error';
				return;
			}
			try {
				const res = await fetch(`/api/site-audit/${qaAuditId}`);
				if (!res.ok) return;
				const d = await res.json();
				if (d.status === 'completed') {
					if (qaAuditPollingTimer) clearInterval(qaAuditPollingTimer);
					qaAuditResult = {
						summary: d.summary,
						overallSeverity: d.overallSeverity,
						findings: d.findings || [],
						findingCount: d.findingCount,
						criticalCount: d.criticalCount,
						warningCount: d.warningCount
					};
					qaSelectedFindings = new Set(qaAuditResult.findings.map((_: any, i: number) => i));
					quickAddStep = 'review';
				} else if (d.status === 'failed') {
					if (qaAuditPollingTimer) clearInterval(qaAuditPollingTimer);
					qaPhotoError = 'Safety audit failed.';
					quickAddStep = 'error';
				}
			} catch { /* keep polling */ }
		}, 2000);
	}

	async function qaRelayAuditFindings() {
		if (!qaAuditId || !qaAuditResult) return;
		qaRelayLoading = true;

		const findings = qaAuditResult.findings
			.filter((_: any, i: number) => qaSelectedFindings.has(i));

		if (findings.length === 0) {
			qaRelayLoading = false;
			return;
		}

		try {
			const res = await fetch(`/api/site-audit/${qaAuditId}/relay`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ findings })
			});
			if (res.ok) {
				const txnName = data.assignableTransactions?.find((t: any) => t.id === selectedTransactionId)?.title || 'project';
				qaSuccessMessage = `${findings.length} finding${findings.length === 1 ? '' : 's'} relayed to ${txnName}`;
				quickAddStep = 'success';
			} else {
				qaPhotoError = 'Failed to relay findings';
				quickAddStep = 'error';
			}
		} catch {
			qaPhotoError = 'Failed to relay findings';
			quickAddStep = 'error';
		}
		qaRelayLoading = false;
	}

	async function qaDownloadAuditReport() {
		if (!qaAuditId) return;
		try {
			const res = await fetch('/api/site-audit/report', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ auditId: qaAuditId })
			});
			if (res.ok) {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `Safety-Audit-${qaAuditId.slice(0, 8)}.pdf`;
				a.click();
				URL.revokeObjectURL(url);
			}
		} catch { /* non-critical */ }
	}

	function formatDuration(seconds: number): string {
		const m = Math.floor(seconds / 60);
		const s = seconds % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}
</script>

<svelte:head>
	<title>Dashboard — CollectRelay</title>
</svelte:head>

<div class="dashboard">
	<div class="page-header">
		<div>
			<h1>Dashboard</h1>
			<p class="subtitle">Overview of your document collection activity.</p>
		</div>
		<a href="/app/transactions/new" class="btn-primary">
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
				<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
			</svg>
			{terms.newTransaction}
		</a>
	</div>

	<!-- Stats Row -->
	<div class="stats-grid">
		<div class="stat-card">
			<div class="stat-icon stat-active">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{data.counts.active}</span>
				<span class="stat-label">Active</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-review">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{data.counts.pending_review}</span>
				<span class="stat-label">In Review</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-completed">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{data.counts.completed}</span>
				<span class="stat-label">Completed</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-total">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{data.counts.total}</span>
				<span class="stat-label">Total</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-pipeline">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{formatCurrency(data.pipelineValue)}</span>
				<span class="stat-label">Pipeline Value</span>
			</div>
		</div>
		<div class="stat-card">
			<div class="stat-icon stat-commission">
				<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
				</svg>
			</div>
			<div class="stat-content">
				<span class="stat-value">{formatCurrency(data.totalCommission)}</span>
				<span class="stat-label">Expected Commissions</span>
			</div>
		</div>
	</div>

	<!-- Pending Sales Panel -->
	{#if data.pendingSales && data.pendingSales.length > 0}
		<div class="panel pending-sales-panel">
			<div class="panel-header">
				<h2>Pending Sales</h2>
				<a href="/app/transactions" class="panel-link">View all</a>
			</div>
			<div class="sales-table">
				<div class="sales-table-header">
					<span class="col-health"></span>
					<span class="col-title">{terms.transaction}</span>
					<span class="col-client">Client</span>
					<span class="col-price">Sale Price</span>
					<span class="col-commission">Commission</span>
					<span class="col-progress">Progress</span>
					<span class="col-status">Status</span>
				</div>
				{#each data.pendingSales as sale}
					{@const risk = riskLevel(sale)}
					<a href="/app/transactions/{sale.id}" class="sales-row">
						<span class="col-health">
							<span class="risk-dot risk-{risk}" title="{risk === 'red' ? 'At risk' : risk === 'yellow' ? 'Needs attention' : 'On track'}"></span>
						</span>
						<span class="col-title sale-title">{sale.title}</span>
						<span class="col-client sale-client">{sale.client_name}</span>
						<span class="col-price">{formatCurrencyFull(sale.sale_price)}</span>
						<span class="col-commission">{formatCurrencyFull(sale.commission_amount)}</span>
						<span class="col-progress">
							<div class="progress-bar-mini">
								<div class="progress-fill-mini" style="width: {progressPercent(sale.completed_count, sale.item_count)}%"></div>
							</div>
							<span class="progress-text-mini">{sale.completed_count}/{sale.item_count}</span>
						</span>
						<span class="col-status">
							<Badge variant={statusConfig[sale.status]?.variant ?? 'default'}>
								{statusConfig[sale.status]?.label ?? sale.status}
							</Badge>
						</span>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<div class="dashboard-grid">
		<!-- Recent Transactions -->
		<div class="panel">
			<div class="panel-header">
				<h2>Recent {terms.transactions}</h2>
				<a href="/app/transactions" class="panel-link">View all</a>
			</div>
			{#if data.recentTransactions.length === 0}
				<div class="panel-empty">
					<p>No {terms.transactions.toLowerCase()} yet.</p>
					<a href="/app/transactions/new" class="empty-action">Create your first {terms.transaction.toLowerCase()}</a>
				</div>
			{:else}
				<div class="transactions-list">
					{#each data.recentTransactions as txn}
						<a href="/app/transactions/{txn.id}" class="txn-row">
							<div class="txn-info">
								<span class="txn-title">{txn.title}</span>
								<span class="txn-client">{txn.client_name}</span>
							</div>
							<div class="txn-progress">
								<div class="progress-bar-mini">
									<div class="progress-fill-mini" style="width: {progressPercent(txn.completed_count, txn.item_count)}%"></div>
								</div>
								<span class="progress-text-mini">{txn.completed_count}/{txn.item_count}</span>
							</div>
							<div class="txn-status">
								<Badge variant={statusConfig[txn.status]?.variant ?? 'default'}>
									{statusConfig[txn.status]?.label ?? txn.status}
								</Badge>
							</div>
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Activity Feed -->
		<div class="panel">
			<div class="panel-header">
				<h2>Recent Activity</h2>
			</div>
			{#if data.recentActivity.length === 0}
				<div class="panel-empty">
					<p>No activity yet. Events will appear here as you and your clients interact.</p>
				</div>
			{:else}
				<div class="activity-feed">
					{#each data.recentActivity as event}
						{@const icon = actionIcons[event.action] ?? { path: 'M12 5v14 M5 12h14', color: '#6b7280' }}
						<div class="activity-item">
							<div class="activity-icon" style="background: {icon.color}20; color: {icon.color}">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
									<path d={icon.path} />
								</svg>
							</div>
							<div class="activity-content">
								<p class="activity-text">
									<strong>{event.actor_name}</strong>
									{actionLabels[event.action] ?? event.action}
								</p>
								<p class="activity-context">
									<a href="/app/transactions/{event.transaction_id}" class="activity-link">{event.transaction_title}</a>
									<span class="activity-time">{formatRelativeTime(event.created_at)}</span>
								</p>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Mortgage Rates Ticker -->
	{#if data.mortgageRates && data.industry === 'real_estate'}
		<div class="rates-ticker">
			<div class="rates-header">
				<div class="rates-title-row">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
					</svg>
					<h3>Mortgage Rates</h3>
				</div>
				<span class="rates-source">Freddie Mac PMMS</span>
			</div>
			<div class="rates-values">
				<div class="rate-item">
					<span class="rate-label">30-Year Fixed</span>
					<span class="rate-value">{data.mortgageRates.rate_30yr?.toFixed(2) ?? '—'}%</span>
				</div>
				<div class="rate-divider"></div>
				<div class="rate-item">
					<span class="rate-label">15-Year Fixed</span>
					<span class="rate-value">{data.mortgageRates.rate_15yr?.toFixed(2) ?? '—'}%</span>
				</div>
			</div>
			{#if data.mortgageRates.updated_at}
				<span class="rates-updated">Updated {formatDate(data.mortgageRates.updated_at)}</span>
			{/if}
		</div>
	{/if}

	<!-- Quick Actions -->
	<div class="quick-actions">
		<a href="/app/transactions/new" class="action-card">
			<div class="action-icon action-new">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
					<line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
				</svg>
			</div>
			<span class="action-label">{terms.newTransaction}</span>
			<span class="action-desc">Start collecting documents from a client</span>
		</a>
		<a href="/app/templates" class="action-card">
			<div class="action-icon action-templates">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
					<rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
				</svg>
			</div>
			<span class="action-label">Manage Templates</span>
			<span class="action-desc">Create and edit reusable checklists</span>
		</a>
		<a href="/app/transactions" class="action-card">
			<div class="action-icon action-view">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
				</svg>
			</div>
			<span class="action-label">All {terms.transactions}</span>
			<span class="action-desc">View and manage all {terms.transactions.toLowerCase()}</span>
		</a>
		<button type="button" class="action-card" onclick={openQuickAdd}>
			<div class="action-icon action-quickadd">
				<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
				</svg>
			</div>
			<span class="action-label">Quick Add</span>
			<span class="action-desc">Voice memo or text note</span>
		</button>
	</div>
</div>

<!-- Quick Add Modal -->
{#if showQuickAdd}
	<div class="qa-overlay" onclick={closeQuickAdd}>
		<div class="qa-modal" onclick={(e) => e.stopPropagation()}>
			<div class="qa-header">
				<h2>Quick Add</h2>
				<button type="button" class="qa-close" onclick={closeQuickAdd}>
					<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
				</button>
			</div>

			{#if quickAddStep === 'success'}
				<div class="qa-success">
					<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
					<p>{qaSuccessMessage}</p>
					<button class="qa-btn-primary" onclick={closeQuickAdd}>Done</button>
				</div>
			{:else if quickAddStep === 'error'}
				<div class="qa-error">
					<p>{qaVoiceError || qaPhotoError || 'Something went wrong'}</p>
					<button class="qa-btn-secondary" onclick={() => { quickAddStep = 'input'; qaVoiceError = null; qaPhotoError = null; }}>Try Again</button>
				</div>
			{:else}
				<!-- Tabs -->
				{#if quickAddStep === 'input'}
					<div class="qa-tabs">
						<button class="qa-tab" class:active={quickAddTab === 'voice'} onclick={() => quickAddTab = 'voice'}>
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/>
							</svg>
							Voice Note
						</button>
						<button class="qa-tab" class:active={quickAddTab === 'text'} onclick={() => quickAddTab = 'text'}>
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
							</svg>
							Text Note
						</button>
						<button class="qa-tab" class:active={quickAddTab === 'photo'} onclick={() => quickAddTab = 'photo'}>
							<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
							</svg>
							Photo
						</button>
					</div>
				{/if}

				<!-- Voice Note Tab -->
				{#if quickAddTab === 'voice'}
					{#if quickAddStep === 'input'}
						{#if !qaIsRecording && !qaAudioBlob}
							<div class="qa-body qa-center">
								<button class="qa-mic-btn" onclick={qaStartRecording}>
									<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
										<path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/><path d="M19 10v2a7 7 0 01-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
									</svg>
								</button>
								<p class="qa-hint">Tap to start recording</p>
							</div>
						{:else if qaIsRecording}
							<div class="qa-body qa-center">
								<div class="qa-recording-indicator">
									<div class="qa-pulse"></div>
									<span class="qa-duration">{formatDuration(qaRecordingDuration)}</span>
								</div>
								<div class="qa-waveform">
									{#each Array(16) as _, i}
										<div class="qa-wave-bar" style="animation-delay: {i * 0.05}s"></div>
									{/each}
								</div>
								{#if qaRecordingDuration >= 100}
									<p class="qa-warn">Recording will stop at 2:00</p>
								{/if}
								<button class="qa-stop-btn" onclick={qaStopRecording}>
									<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
									Stop Recording
								</button>
							</div>
						{/if}
					{:else if quickAddStep === 'assign'}
						<div class="qa-body">
							<p class="qa-recorded-info">
								<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
								Recorded {formatDuration(qaRecordingDuration)}
							</p>
							<label class="qa-label">Assign to {terms.transaction}</label>
							<select class="qa-select" bind:value={selectedTransactionId}>
								<option value="">Select a {terms.transaction.toLowerCase()}...</option>
								{#each data.assignableTransactions as txn}
									<option value={txn.id}>{txn.title} — {txn.client_name}</option>
								{/each}
							</select>
							<div class="qa-actions">
								<button class="qa-btn-secondary" onclick={() => { quickAddStep = 'input'; qaAudioBlob = null; }}>Back</button>
								<button class="qa-btn-primary" disabled={!selectedTransactionId} onclick={qaUploadAndProcess}>
									Upload & Process
								</button>
							</div>
						</div>
					{:else if quickAddStep === 'processing'}
						<div class="qa-body qa-center">
							<div class="qa-waveform processing-wave">
								{#each Array(16) as _, i}
									<div class="qa-wave-bar" style="animation-delay: {i * 0.05}s"></div>
								{/each}
							</div>
							<p class="qa-processing-label">Relaying your notes...</p>
							<p class="qa-hint">Transcribing audio and extracting tasks</p>
						</div>
					{:else if quickAddStep === 'review' && qaVoiceResult}
						<div class="qa-body">
							{#if qaVoiceResult.transcript}
								<div class="qa-transcript">
									<p>"{qaVoiceResult.transcript}"</p>
								</div>
							{/if}
							<div class="qa-field">
								<label class="qa-label">Summary</label>
								<textarea class="qa-textarea" bind:value={qaEditableSummary} rows="2"></textarea>
							</div>
							{#if qaEditableActions.length > 0}
								<div class="qa-field">
									<label class="qa-label">Proposed Actions</label>
									{#each qaEditableActions as action, i}
										<div class="qa-action-row">
											<input type="checkbox" checked={qaSelectedActions.has(i)} onchange={() => {
												const next = new Set(qaSelectedActions);
												if (next.has(i)) next.delete(i); else next.add(i);
												qaSelectedActions = next;
											}} />
											<input type="text" class="qa-action-input" bind:value={qaEditableActions[i].task} placeholder="Task..." />
											<select class="qa-priority-select" bind:value={qaEditableActions[i].priority}>
												<option value="High">High</option>
												<option value="Medium">Medium</option>
												<option value="Low">Low</option>
											</select>
											<button type="button" class="qa-remove-btn" onclick={() => qaRemoveAction(i)}>
												<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
											</button>
										</div>
									{/each}
									<button type="button" class="qa-add-action-btn" onclick={qaAddAction}>+ Add Task</button>
								</div>
							{:else}
								<button type="button" class="qa-add-action-btn" onclick={qaAddAction}>+ Add Task Manually</button>
							{/if}
							<div class="qa-actions">
								<button class="qa-btn-secondary" onclick={() => { quickAddStep = 'input'; resetQuickAdd(); }}>Discard</button>
								<button class="qa-btn-primary" onclick={qaRelayActions} disabled={qaRelayLoading || qaSelectedActions.size === 0}>
									{qaRelayLoading ? 'Relaying...' : `Relay ${qaSelectedActions.size} Task${qaSelectedActions.size === 1 ? '' : 's'}`}
								</button>
							</div>
						</div>
					{/if}
				{/if}

				<!-- Text Note Tab -->
				{#if quickAddTab === 'text' && quickAddStep === 'input'}
					<div class="qa-body">
						<div class="qa-field">
							<label class="qa-label">Title</label>
							<input type="text" class="qa-input" bind:value={textTitle} placeholder="Note title..." />
						</div>
						<div class="qa-field">
							<label class="qa-label">Content</label>
							<textarea class="qa-textarea" bind:value={textContent} rows="4" placeholder="Type your note..."></textarea>
						</div>
						<div class="qa-field">
							<label class="qa-label">Destination</label>
							<div class="qa-dest-toggle">
								<button class="qa-dest-btn" class:active={textDestination === 'project'} onclick={() => textDestination = 'project'}>
									Add to {terms.transaction}
								</button>
								<button class="qa-dest-btn" class:active={textDestination === 'library'} onclick={() => textDestination = 'library'}>
									Document Library
								</button>
							</div>
						</div>
						{#if textDestination === 'project'}
							<div class="qa-field">
								<label class="qa-label">Select {terms.transaction}</label>
								<select class="qa-select" bind:value={selectedTransactionId}>
									<option value="">Select a {terms.transaction.toLowerCase()}...</option>
									{#each data.assignableTransactions as txn}
										<option value={txn.id}>{txn.title} — {txn.client_name}</option>
									{/each}
								</select>
							</div>
						{/if}
						<div class="qa-actions">
							<button class="qa-btn-secondary" onclick={closeQuickAdd}>Cancel</button>
							<button class="qa-btn-primary" onclick={saveTextNote} disabled={textSaving || !textTitle.trim() || (textDestination === 'project' && !selectedTransactionId)}>
								{textSaving ? 'Saving...' : 'Save Note'}
							</button>
						</div>
					</div>
				{/if}

				<!-- Photo Tab -->
				{#if quickAddTab === 'photo'}
					{#if quickAddStep === 'input'}
						<div class="qa-body">
							{#if !qaPhotoFile}
								<div class="qa-center">
									<label class="qa-photo-upload-btn">
										<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
											<path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/>
										</svg>
										<input type="file" accept="image/*" capture="environment" onchange={qaHandlePhotoSelect} style="display:none" />
									</label>
									<p class="qa-hint">Tap to take a photo or choose from gallery</p>
								</div>
							{:else}
								{#if qaPhotoPreview}
									<div class="qa-photo-preview">
										<img src={qaPhotoPreview} alt="Preview" />
										<button type="button" class="qa-photo-remove" onclick={qaRemovePhoto}>
											<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
										</button>
									</div>
								{/if}
								<div class="qa-field">
									<label class="qa-label">Title</label>
									<input type="text" class="qa-input" bind:value={qaPhotoTitle} placeholder="Photo title..." />
								</div>
								<div class="qa-field">
									<label class="qa-label">Notes</label>
									<textarea class="qa-textarea" bind:value={qaPhotoNotes} rows="2" placeholder="Add notes about this photo..."></textarea>
								</div>
								<div class="qa-field">
									<label class="qa-toggle-row">
										<input type="checkbox" bind:checked={qaPhotoAnalyze} onchange={() => { if (qaPhotoAnalyze) qaPhotoAudit = false; }} />
										<span>Analyze with AI</span>
									</label>
									{#if qaPhotoAnalyze}
										<p class="qa-hint" style="margin-top: 4px">AI will describe what it sees and suggest tasks</p>
									{/if}
								</div>
								<div class="qa-field">
									<label class="qa-toggle-row">
										<input type="checkbox" bind:checked={qaPhotoAudit} onchange={() => { if (qaPhotoAudit) qaPhotoAnalyze = false; }} />
										<span>Safety Audit</span>
									</label>
									{#if qaPhotoAudit}
										<p class="qa-hint" style="margin-top: 4px">AI inspects for OSHA violations, PPE, fall protection, and other safety hazards</p>
									{/if}
								</div>
								<div class="qa-field">
									<label class="qa-label">Assign to {terms.transaction}</label>
									<select class="qa-select" bind:value={selectedTransactionId}>
										<option value="">Select a {terms.transaction.toLowerCase()}...</option>
										{#each data.assignableTransactions as txn}
											<option value={txn.id}>{txn.title} — {txn.client_name}</option>
										{/each}
									</select>
								</div>
								<div class="qa-actions">
									<button class="qa-btn-secondary" onclick={qaRemovePhoto}>Back</button>
									<button class="qa-btn-primary" onclick={qaPhotoAudit ? qaUploadPhotoForAudit : qaUploadPhoto} disabled={qaPhotoUploading || !selectedTransactionId}>
										{qaPhotoUploading ? 'Uploading...' : qaPhotoAudit ? 'Upload & Audit' : qaPhotoAnalyze ? 'Upload & Analyze' : 'Upload Photo'}
									</button>
								</div>
							{/if}
						</div>
					{:else if quickAddStep === 'processing'}
						<div class="qa-body qa-center">
							<div class="qa-waveform processing-wave">
								{#each Array(16) as _, i}
									<div class="qa-wave-bar" style="animation-delay: {i * 0.05}s"></div>
								{/each}
							</div>
							<p class="qa-processing-label">{qaPhotoAudit ? 'Running safety audit...' : 'Analyzing your photo...'}</p>
							<p class="qa-hint">{qaPhotoAudit ? 'AI is inspecting for safety hazards and compliance issues' : 'AI is describing what it sees and extracting tasks'}</p>
						</div>
					{:else if quickAddStep === 'review' && qaAuditResult}
						<div class="qa-body">
							<div class="qa-audit-header">
								<span class="qa-audit-severity qa-severity-{qaAuditResult.overallSeverity}">{qaAuditResult.overallSeverity.toUpperCase()}</span>
								<span class="qa-audit-counts">
									{#if qaAuditResult.criticalCount > 0}<span class="qa-count-critical">{qaAuditResult.criticalCount} Critical</span>{/if}
									{#if qaAuditResult.warningCount > 0}<span class="qa-count-warning">{qaAuditResult.warningCount} Warning</span>{/if}
									{#if qaAuditResult.findingCount - qaAuditResult.criticalCount - qaAuditResult.warningCount > 0}<span class="qa-count-info">{qaAuditResult.findingCount - qaAuditResult.criticalCount - qaAuditResult.warningCount} Info</span>{/if}
								</span>
							</div>
							{#if qaAuditResult.summary}
								<div class="qa-transcript">
									<p>{qaAuditResult.summary}</p>
								</div>
							{/if}
							{#if qaAuditResult.findings.length > 0}
								<div class="qa-field">
									<label class="qa-label">Findings</label>
									{#each qaAuditResult.findings as finding, i}
										<div class="qa-finding-row qa-finding-{finding.severity}">
											<div class="qa-finding-header">
												<input type="checkbox" checked={qaSelectedFindings.has(i)} onchange={() => {
													const next = new Set(qaSelectedFindings);
													if (next.has(i)) next.delete(i); else next.add(i);
													qaSelectedFindings = next;
												}} />
												<span class="qa-finding-code">{finding.code}</span>
												<span class="qa-finding-severity-badge qa-severity-{finding.severity}">{finding.severity}</span>
												<span class="qa-finding-category">{finding.category}</span>
											</div>
											<p class="qa-finding-desc">{finding.description}</p>
											<p class="qa-finding-rec">{finding.recommendation}</p>
											{#if finding.osha_reference}
												<p class="qa-finding-osha">Ref: {finding.osha_reference}</p>
											{/if}
										</div>
									{/each}
								</div>
							{:else}
								<p class="qa-hint">No safety issues found — site appears compliant.</p>
							{/if}
							<div class="qa-actions">
								<button class="qa-btn-secondary" onclick={qaDownloadAuditReport}>Download PDF</button>
								<button class="qa-btn-secondary" onclick={() => { quickAddStep = 'input'; resetQuickAdd(); }}>Discard</button>
								{#if qaAuditResult.findings.length > 0}
									<button class="qa-btn-primary" onclick={qaRelayAuditFindings} disabled={qaRelayLoading || qaSelectedFindings.size === 0}>
										{qaRelayLoading ? 'Relaying...' : `Relay ${qaSelectedFindings.size} Finding${qaSelectedFindings.size === 1 ? '' : 's'}`}
									</button>
								{/if}
							</div>
						</div>
					{:else if quickAddStep === 'review' && qaPhotoResult}
						<div class="qa-body">
							{#if qaPhotoResult.ai_description}
								<div class="qa-transcript">
									<p class="qa-label" style="margin-bottom: 4px">AI Description</p>
									<p>{qaPhotoResult.ai_description}</p>
								</div>
							{/if}
							<div class="qa-field">
								<label class="qa-label">Summary</label>
								<textarea class="qa-textarea" bind:value={qaEditableSummary} rows="2"></textarea>
							</div>
							{#if qaEditableActions.length > 0}
								<div class="qa-field">
									<label class="qa-label">Proposed Actions</label>
									{#each qaEditableActions as action, i}
										<div class="qa-action-row">
											<input type="checkbox" checked={qaSelectedActions.has(i)} onchange={() => {
												const next = new Set(qaSelectedActions);
												if (next.has(i)) next.delete(i); else next.add(i);
												qaSelectedActions = next;
											}} />
											<input type="text" class="qa-action-input" bind:value={qaEditableActions[i].task} placeholder="Task..." />
											<select class="qa-priority-select" bind:value={qaEditableActions[i].priority}>
												<option value="High">High</option>
												<option value="Medium">Medium</option>
												<option value="Low">Low</option>
											</select>
											<button type="button" class="qa-remove-btn" onclick={() => qaRemoveAction(i)}>
												<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
											</button>
										</div>
									{/each}
									<button type="button" class="qa-add-action-btn" onclick={qaAddAction}>+ Add Task</button>
								</div>
							{:else}
								<button type="button" class="qa-add-action-btn" onclick={qaAddAction}>+ Add Task Manually</button>
							{/if}
							<div class="qa-actions">
								<button class="qa-btn-secondary" onclick={() => { quickAddStep = 'input'; resetQuickAdd(); }}>Discard</button>
								<button class="qa-btn-primary" onclick={qaRelayPhotoActions} disabled={qaRelayLoading || qaSelectedActions.size === 0}>
									{qaRelayLoading ? 'Relaying...' : `Relay ${qaSelectedActions.size} Task${qaSelectedActions.size === 1 ? '' : 's'}`}
								</button>
							</div>
						</div>
					{/if}
				{/if}
			{/if}
		</div>
	</div>
{/if}

<style>
	.dashboard {
		max-width: 1000px;
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

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-lg);
		background: var(--color-accent);
		color: var(--text-inverse);
		font-size: var(--font-size-sm);
		font-weight: 600;
		border-radius: var(--radius-md);
		transition: background var(--transition-fast);
		white-space: nowrap;
	}

	.btn-primary:hover { background: var(--color-accent-hover); color: var(--text-inverse); }

	/* Stats Grid */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: var(--space-md);
		margin-bottom: var(--space-xl);
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
	}

	.stat-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-md);
		flex-shrink: 0;
	}

	.stat-active { background: rgba(16, 185, 129, 0.15); color: #10b981; }
	.stat-review { background: rgba(234, 179, 8, 0.15); color: #eab308; }
	.stat-completed { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
	.stat-total { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
	.stat-pipeline { background: rgba(6, 182, 212, 0.15); color: #06b6d4; }
	.stat-commission { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

	.stat-content {
		display: flex;
		flex-direction: column;
	}

	.stat-value {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.stat-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	/* Dashboard Grid */
	.dashboard-grid {
		display: grid;
		grid-template-columns: 1.2fr 1fr;
		gap: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.panel {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg) var(--space-lg) var(--space-md);
	}

	.panel-header h2 {
		font-size: var(--font-size-md);
		font-weight: 600;
	}

	.panel-link {
		font-size: var(--font-size-xs);
		color: var(--color-accent);
		font-weight: 500;
	}

	.panel-link:hover { text-decoration: underline; }

	.panel-empty {
		padding: var(--space-xxl) var(--space-lg);
		text-align: center;
		color: var(--text-muted);
		font-size: var(--font-size-sm);
	}

	.empty-action {
		display: inline-block;
		margin-top: var(--space-sm);
		color: var(--color-accent);
		font-weight: 500;
	}

	/* Transactions List */
	.transactions-list {
		display: flex;
		flex-direction: column;
	}

	.txn-row {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--border-color);
		transition: background var(--transition-fast);
		color: var(--text-primary);
	}

	.txn-row:hover { background: var(--bg-tertiary); }

	.txn-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.txn-title {
		font-size: var(--font-size-sm);
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.txn-client {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.txn-progress {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		flex-shrink: 0;
		width: 100px;
	}

	.progress-bar-mini {
		flex: 1;
		height: 4px;
		background: var(--bg-tertiary);
		border-radius: var(--radius-full);
		overflow: hidden;
	}

	.progress-fill-mini {
		height: 100%;
		background: var(--color-accent);
		border-radius: var(--radius-full);
		transition: width 0.3s ease;
	}

	.progress-text-mini {
		font-size: 11px;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.txn-status {
		flex-shrink: 0;
	}

	/* Activity Feed */
	.activity-feed {
		display: flex;
		flex-direction: column;
	}

	.activity-item {
		display: flex;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		border-top: 1px solid var(--border-color);
	}

	.activity-icon {
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-full);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.activity-content {
		flex: 1;
		min-width: 0;
	}

	.activity-text {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		line-height: 1.4;
	}

	.activity-text strong {
		font-weight: 600;
	}

	.activity-context {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-top: 2px;
	}

	.activity-link {
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 180px;
	}

	.activity-link:hover { color: var(--color-accent); }

	.activity-time {
		white-space: nowrap;
		flex-shrink: 0;
	}

	.activity-time::before {
		content: '·';
		margin-right: var(--space-sm);
	}

	/* Quick Actions */
	.quick-actions {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: var(--space-md);
	}

	.action-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-sm);
		padding: var(--space-xl) var(--space-lg);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		text-align: center;
		transition: all var(--transition-fast);
		color: var(--text-primary);
		cursor: pointer;
		font-family: inherit;
	}

	.action-card:hover {
		border-color: var(--color-accent);
		background: var(--bg-tertiary);
		transform: translateY(-2px);
	}

	.action-icon {
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-lg);
	}

	.action-new { background: rgba(16, 185, 129, 0.15); color: #10b981; }
	.action-templates { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
	.action-view { background: rgba(139, 92, 246, 0.15); color: #8b5cf6; }
	.action-quickadd { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }

	.action-label {
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	.action-desc {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		line-height: 1.4;
	}

	/* Pending Sales */
	.pending-sales-panel {
		margin-bottom: var(--space-xl);
	}

	.sales-table {
		overflow-x: auto;
	}

	.sales-table-header {
		display: grid;
		grid-template-columns: 30px 1.5fr 1fr 0.8fr 0.8fr 120px 90px;
		gap: var(--space-sm);
		padding: var(--space-sm) var(--space-lg);
		border-top: 1px solid var(--border-color);
		font-size: var(--font-size-xs);
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.5px;
		font-weight: 600;
	}

	.sales-row {
		display: grid;
		grid-template-columns: 30px 1.5fr 1fr 0.8fr 0.8fr 120px 90px;
		gap: var(--space-sm);
		align-items: center;
		padding: var(--space-md) var(--space-lg);
		border-top: 1px solid var(--border-color);
		color: var(--text-primary);
		transition: background var(--transition-fast);
		font-size: var(--font-size-sm);
	}

	.sales-row:hover {
		background: var(--bg-tertiary);
	}

	.col-health {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.risk-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}

	.risk-green {
		background: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
	}

	.risk-yellow {
		background: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
		animation: pulse-risk 2s ease-in-out infinite;
	}

	.risk-red {
		background: #ef4444;
		box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
		animation: pulse-risk 1.5s ease-in-out infinite;
	}

	@keyframes pulse-risk {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}

	.sale-title {
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.sale-client {
		color: var(--text-secondary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.col-progress {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}

	/* Mortgage Rates Ticker */
	.rates-ticker {
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: var(--space-lg);
		margin-bottom: var(--space-xl);
	}

	.rates-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: var(--space-md);
	}

	.rates-title-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--text-primary);
	}

	.rates-title-row h3 {
		font-size: var(--font-size-sm);
		font-weight: 600;
	}

	.rates-source {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.rates-values {
		display: flex;
		align-items: center;
		gap: var(--space-xl);
	}

	.rate-item {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.rate-label {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.rate-value {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
	}

	.rate-divider {
		width: 1px;
		height: 36px;
		background: var(--border-color);
	}

	.rates-updated {
		display: block;
		margin-top: var(--space-sm);
		font-size: 11px;
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.stats-grid { grid-template-columns: repeat(2, 1fr); }
		.dashboard-grid { grid-template-columns: 1fr; }
		.quick-actions { grid-template-columns: repeat(2, 1fr); }
		.sales-table-header { display: none; }
		.sales-row {
			grid-template-columns: 30px 1fr;
			grid-template-rows: auto auto;
		}
		.col-price, .col-commission, .col-progress, .col-status, .col-client { display: none; }
	}

	/* Quick Add Modal */
	.qa-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
	}
	.qa-modal {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-xl, 16px);
		width: 90%;
		max-width: 520px;
		max-height: 85vh;
		overflow-y: auto;
	}
	.qa-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-lg) var(--space-xl);
		border-bottom: 1px solid var(--border-color);
	}
	.qa-header h2 {
		font-size: var(--font-size-lg);
		font-weight: 700;
	}
	.qa-close {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
	}
	.qa-close:hover { color: var(--text-primary); }

	/* Tabs */
	.qa-tabs {
		display: flex;
		border-bottom: 1px solid var(--border-color);
	}
	.qa-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: var(--space-xs);
		padding: var(--space-md);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.qa-tab:hover { color: var(--text-primary); }
	.qa-tab.active {
		color: var(--color-accent);
		border-bottom-color: var(--color-accent);
	}

	/* Body */
	.qa-body {
		padding: var(--space-xl);
	}
	.qa-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-xxl) var(--space-xl);
	}

	/* Voice recording */
	.qa-mic-btn {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: rgba(245, 158, 11, 0.15);
		border: 2px solid rgba(245, 158, 11, 0.3);
		color: #f59e0b;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all var(--transition-fast);
	}
	.qa-mic-btn:hover {
		background: rgba(245, 158, 11, 0.25);
		border-color: #f59e0b;
		transform: scale(1.05);
	}
	.qa-hint {
		font-size: var(--font-size-sm);
		color: var(--text-muted);
	}
	.qa-recording-indicator {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.qa-pulse {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #ef4444;
		animation: qa-pulse-anim 1s ease-in-out infinite;
	}
	@keyframes qa-pulse-anim {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.5; transform: scale(1.2); }
	}
	.qa-duration {
		font-size: var(--font-size-xl);
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.qa-waveform {
		display: flex;
		align-items: center;
		gap: 3px;
		height: 40px;
	}
	.qa-wave-bar {
		width: 3px;
		border-radius: 2px;
		background: var(--color-accent);
		animation: qa-wave 0.8s ease-in-out infinite alternate;
	}
	@keyframes qa-wave {
		from { height: 4px; opacity: 0.3; }
		to { height: 28px; opacity: 1; }
	}
	.qa-waveform.processing-wave .qa-wave-bar {
		background: var(--text-muted);
		animation-duration: 1.2s;
	}
	.qa-warn {
		font-size: var(--font-size-xs);
		color: #f59e0b;
	}
	.qa-stop-btn {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-lg);
		background: #ef4444;
		color: white;
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
	}
	.qa-stop-btn:hover { background: #dc2626; }

	.qa-recorded-info {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-size-sm);
		color: #10b981;
		margin-bottom: var(--space-lg);
	}
	.qa-processing-label {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--text-primary);
	}

	/* Form elements */
	.qa-field {
		margin-bottom: var(--space-lg);
	}
	.qa-label {
		display: block;
		font-size: var(--font-size-xs);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin-bottom: var(--space-xs);
	}
	.qa-input, .qa-textarea, .qa-select {
		width: 100%;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
		font-size: 16px; /* Prevents iOS Safari auto-zoom on focus */
		color: var(--text-primary);
		font-family: inherit;
	}
	.qa-input:focus, .qa-textarea:focus, .qa-select:focus {
		outline: none;
		border-color: var(--color-accent);
	}
	.qa-textarea { resize: vertical; }

	.qa-transcript {
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		margin-bottom: var(--space-lg);
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
		font-style: italic;
	}

	/* Action rows */
	.qa-action-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: var(--space-xs);
	}
	.qa-action-row input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--color-accent);
		flex-shrink: 0;
	}
	.qa-action-input {
		flex: 1;
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		font-family: inherit;
	}
	.qa-action-input:focus { outline: none; border-color: var(--color-accent); }
	.qa-priority-select {
		background: var(--bg-tertiary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-xs) var(--space-sm);
		font-size: var(--font-size-xs);
		color: var(--text-primary);
	}
	.qa-remove-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 2px;
	}
	.qa-remove-btn:hover { color: #ef4444; }
	.qa-add-action-btn {
		background: none;
		border: 1px dashed var(--border-color);
		border-radius: var(--radius-md);
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-size-sm);
		color: var(--text-muted);
		cursor: pointer;
		width: 100%;
		margin-top: var(--space-sm);
	}
	.qa-add-action-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }

	/* Destination toggle */
	.qa-dest-toggle {
		display: flex;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}
	.qa-dest-btn {
		flex: 1;
		padding: var(--space-sm);
		background: var(--bg-tertiary);
		border: none;
		font-size: var(--font-size-xs);
		font-weight: 500;
		color: var(--text-muted);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.qa-dest-btn.active {
		background: var(--color-accent);
		color: var(--text-inverse);
	}

	/* Buttons */
	.qa-actions {
		display: flex;
		justify-content: flex-end;
		gap: var(--space-sm);
		margin-top: var(--space-lg);
	}
	.qa-btn-primary {
		padding: var(--space-sm) var(--space-lg);
		background: var(--color-accent);
		color: var(--text-inverse);
		border: none;
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 600;
		cursor: pointer;
	}
	.qa-btn-primary:hover { background: var(--color-accent-hover); }
	.qa-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.qa-btn-secondary {
		padding: var(--space-sm) var(--space-lg);
		background: var(--bg-tertiary);
		color: var(--text-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
	}
	.qa-btn-secondary:hover { background: var(--bg-elevated); }

	/* Success / Error */
	.qa-success {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-xxl);
		text-align: center;
	}
	.qa-success p {
		font-size: var(--font-size-sm);
		color: var(--text-secondary);
	}
	.qa-error {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: var(--space-md);
		padding: var(--space-xxl);
		text-align: center;
	}
	.qa-error p {
		font-size: var(--font-size-sm);
		color: #ef4444;
	}

	/* Photo tab */
	.qa-photo-upload-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--bg-tertiary);
		border: 2px solid var(--border-color);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.qa-photo-upload-btn:hover {
		background: var(--color-accent-bg);
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
	.qa-photo-preview {
		position: relative;
		margin-bottom: var(--space-md);
		border-radius: var(--radius-md);
		overflow: hidden;
		border: 1px solid var(--border-color);
	}
	.qa-photo-preview img {
		display: block;
		width: 100%;
		max-height: 200px;
		object-fit: cover;
	}
	.qa-photo-remove {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.6);
		border: none;
		color: #fff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.qa-toggle-row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		cursor: pointer;
	}
	.qa-toggle-row input[type="checkbox"] {
		width: 16px;
		height: 16px;
		accent-color: var(--color-accent);
	}

	/* Audit review styles */
	.qa-audit-header {
		display: flex;
		align-items: center;
		gap: var(--space-md);
		margin-bottom: var(--space-md);
	}
	.qa-audit-severity {
		font-size: var(--font-size-xs);
		font-weight: 700;
		padding: 3px 12px;
		border-radius: var(--radius-full);
		text-transform: uppercase;
	}
	.qa-severity-critical { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
	.qa-severity-warning { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
	.qa-severity-pass { background: rgba(16, 185, 129, 0.15); color: #10b981; }
	.qa-severity-info { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
	.qa-audit-counts {
		display: flex;
		gap: var(--space-sm);
		font-size: var(--font-size-xs);
		font-weight: 600;
	}
	.qa-count-critical { color: #ef4444; }
	.qa-count-warning { color: #f59e0b; }
	.qa-count-info { color: #3b82f6; }
	.qa-finding-row {
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-md);
		margin-bottom: var(--space-sm);
		border-left: 3px solid transparent;
	}
	.qa-finding-critical { background: rgba(239, 68, 68, 0.06); border-left-color: #ef4444; }
	.qa-finding-warning { background: rgba(245, 158, 11, 0.06); border-left-color: #f59e0b; }
	.qa-finding-info { background: rgba(59, 130, 246, 0.06); border-left-color: #3b82f6; }
	.qa-finding-header {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		margin-bottom: 4px;
	}
	.qa-finding-header input[type="checkbox"] {
		width: 14px;
		height: 14px;
		accent-color: var(--color-accent);
	}
	.qa-finding-code {
		font-size: var(--font-size-xs);
		font-weight: 700;
		color: var(--text-primary);
	}
	.qa-finding-severity-badge {
		font-size: 10px;
		font-weight: 600;
		padding: 1px 6px;
		border-radius: var(--radius-full);
		text-transform: uppercase;
	}
	.qa-finding-category {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}
	.qa-finding-desc {
		font-size: var(--font-size-sm);
		color: var(--text-primary);
		margin-bottom: 4px;
		padding-left: 22px;
	}
	.qa-finding-rec {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		font-style: italic;
		padding-left: 22px;
	}
	.qa-finding-osha {
		font-size: 10px;
		color: var(--color-accent);
		padding-left: 22px;
		margin-top: 2px;
	}
</style>
