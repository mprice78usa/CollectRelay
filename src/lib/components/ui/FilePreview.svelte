<script lang="ts">
	let { file, onclose }: { file: { id: string; filename: string; mime_type: string; file_size: number } | null; onclose: () => void } = $props();

	function isImage(mime: string) {
		return mime.startsWith('image/');
	}

	function isPdf(mime: string) {
		return mime === 'application/pdf';
	}

	function formatFileSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if file}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="preview-overlay" onclick={handleBackdropClick}>
		<div class="preview-modal" class:preview-wide={isPdf(file.mime_type)}>
			<div class="preview-header">
				<div class="preview-title">
					<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14 2 14 8 20 8"/>
					</svg>
					<span class="preview-filename">{file.filename}</span>
					<span class="preview-size">{formatFileSize(file.file_size)}</span>
				</div>
				<div class="preview-actions">
					<a href="/api/files/{file.id}" download class="preview-download" title="Download">
						<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
							<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
							<polyline points="7 10 12 15 17 10"/>
							<line x1="12" y1="15" x2="12" y2="3"/>
						</svg>
					</a>
					<button class="preview-close" onclick={onclose} title="Close">
						<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
							<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
						</svg>
					</button>
				</div>
			</div>
			<div class="preview-content">
				{#if isPdf(file.mime_type)}
					<iframe src="/api/files/{file.id}" title="PDF Preview" class="pdf-frame"></iframe>
				{:else if isImage(file.mime_type)}
					<img src="/api/files/{file.id}" alt={file.filename} class="image-preview" />
				{:else}
					<div class="no-preview">
						<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
							<polyline points="14 2 14 8 20 8"/>
						</svg>
						<p>Preview not available for this file type</p>
						<a href="/api/files/{file.id}" download class="btn-download">
							<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
								<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
								<polyline points="7 10 12 15 17 10"/>
								<line x1="12" y1="15" x2="12" y2="3"/>
							</svg>
							Download File
						</a>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.preview-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.75);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
		animation: fadeIn 0.15s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.preview-modal {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		width: 100%;
		max-width: 640px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.preview-wide {
		max-width: 900px;
	}

	.preview-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-md) var(--space-lg);
		border-bottom: 1px solid var(--border-color);
		gap: var(--space-md);
	}

	.preview-title {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		min-width: 0;
		flex: 1;
	}

	.preview-title svg {
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.preview-filename {
		font-weight: 600;
		font-size: var(--font-size-sm);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.preview-size {
		font-size: var(--font-size-xs);
		color: var(--text-tertiary);
		flex-shrink: 0;
	}

	.preview-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}

	.preview-download, .preview-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: var(--radius-md);
		border: none;
		background: none;
		color: var(--text-secondary);
		cursor: pointer;
		transition: background var(--transition-fast), color var(--transition-fast);
	}

	.preview-download:hover, .preview-close:hover {
		background: var(--bg-tertiary);
		color: var(--text-primary);
	}

	.preview-content {
		flex: 1;
		overflow: auto;
		min-height: 300px;
	}

	.pdf-frame {
		width: 100%;
		height: 75vh;
		border: none;
	}

	.image-preview {
		max-width: 100%;
		max-height: 75vh;
		display: block;
		margin: var(--space-lg) auto;
		border-radius: var(--radius-md);
		object-fit: contain;
	}

	.no-preview {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-xxl);
		gap: var(--space-md);
		color: var(--text-tertiary);
	}

	.no-preview p {
		font-size: var(--font-size-sm);
	}

	.btn-download {
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
	}

	.btn-download:hover {
		background: var(--color-accent-hover);
		color: var(--text-inverse);
	}
</style>
