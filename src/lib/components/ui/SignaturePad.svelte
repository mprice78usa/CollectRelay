<script lang="ts">
	interface Props {
		onSignature: (data: { blob: Blob; mode: 'draw' | 'type'; typedName?: string }) => void;
		disabled?: boolean;
	}

	let { onSignature, disabled = false }: Props = $props();

	let mode = $state<'draw' | 'type'>('draw');
	let canvas: HTMLCanvasElement | undefined = $state();
	let isDrawing = $state(false);
	let hasDrawn = $state(false);
	let typedName = $state('');
	let consentChecked = $state(false);
	let submitting = $state(false);

	// Canvas drawing state
	let ctx: CanvasRenderingContext2D | null = null;
	let lastX = 0;
	let lastY = 0;

	function initCanvas() {
		if (!canvas) return;
		ctx = canvas.getContext('2d');
		if (!ctx) return;

		const dpr = window.devicePixelRatio || 1;
		const rect = canvas.getBoundingClientRect();
		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;
		ctx.scale(dpr, dpr);

		ctx.strokeStyle = '#18181b';
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
	}

	function getPos(e: PointerEvent): { x: number; y: number } {
		const rect = canvas!.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top
		};
	}

	function onPointerDown(e: PointerEvent) {
		if (disabled || !ctx) return;
		isDrawing = true;
		const pos = getPos(e);
		lastX = pos.x;
		lastY = pos.y;
		canvas!.setPointerCapture(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!isDrawing || !ctx) return;
		const pos = getPos(e);
		ctx.beginPath();
		ctx.moveTo(lastX, lastY);
		ctx.lineTo(pos.x, pos.y);
		ctx.stroke();
		lastX = pos.x;
		lastY = pos.y;
		hasDrawn = true;
	}

	function onPointerUp() {
		isDrawing = false;
	}

	function clearCanvas() {
		if (!canvas || !ctx) return;
		const dpr = window.devicePixelRatio || 1;
		ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
		hasDrawn = false;
	}

	function switchMode(newMode: 'draw' | 'type') {
		mode = newMode;
		if (newMode === 'draw') {
			// Re-init canvas after mode switch
			setTimeout(() => initCanvas(), 0);
		}
	}

	$effect(() => {
		if (canvas && mode === 'draw') {
			initCanvas();
		}
	});

	let canSign = $derived(
		consentChecked && !disabled && !submitting &&
		((mode === 'draw' && hasDrawn) || (mode === 'type' && typedName.trim().length > 0))
	);

	async function handleSign() {
		if (!canSign) return;
		submitting = true;

		try {
			let blob: Blob;

			if (mode === 'draw' && canvas) {
				blob = await new Promise<Blob>((resolve, reject) => {
					canvas!.toBlob((b) => {
						if (b) resolve(b);
						else reject(new Error('Failed to create signature image'));
					}, 'image/png');
				});
			} else {
				// Type mode: render typed name onto a canvas to get a PNG
				const offscreen = document.createElement('canvas');
				const dpr = window.devicePixelRatio || 1;
				offscreen.width = 400 * dpr;
				offscreen.height = 200 * dpr;
				const offCtx = offscreen.getContext('2d')!;
				offCtx.scale(dpr, dpr);
				offCtx.fillStyle = 'transparent';
				offCtx.clearRect(0, 0, 400, 200);
				offCtx.fillStyle = '#18181b';
				offCtx.font = '40px "Segoe Script", "Brush Script MT", "Apple Chancery", cursive';
				offCtx.textAlign = 'center';
				offCtx.textBaseline = 'middle';
				offCtx.fillText(typedName.trim(), 200, 100, 380);

				blob = await new Promise<Blob>((resolve, reject) => {
					offscreen.toBlob((b) => {
						if (b) resolve(b);
						else reject(new Error('Failed to create signature image'));
					}, 'image/png');
				});
			}

			onSignature({ blob, mode, typedName: mode === 'type' ? typedName.trim() : undefined });
		} catch (err) {
			console.error('Signature error:', err);
			submitting = false;
		}
	}
</script>

<div class="signature-pad" class:disabled>
	<div class="mode-tabs">
		<button
			type="button"
			class="mode-tab"
			class:active={mode === 'draw'}
			onclick={() => switchMode('draw')}
			{disabled}
		>
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" /><circle cx="11" cy="11" r="2" />
			</svg>
			Draw
		</button>
		<button
			type="button"
			class="mode-tab"
			class:active={mode === 'type'}
			onclick={() => switchMode('type')}
			{disabled}
		>
			<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
			</svg>
			Type
		</button>
	</div>

	<div class="pad-area">
		{#if mode === 'draw'}
			<canvas
				bind:this={canvas}
				class="draw-canvas"
				onpointerdown={onPointerDown}
				onpointermove={onPointerMove}
				onpointerup={onPointerUp}
				onpointerleave={onPointerUp}
			></canvas>
			<div class="canvas-footer">
				<span class="canvas-hint">Sign above using your mouse or finger</span>
				{#if hasDrawn}
					<button type="button" class="btn-clear" onclick={clearCanvas}>Clear</button>
				{/if}
			</div>
		{:else}
			<div class="type-area">
				<input
					type="text"
					class="type-input"
					placeholder="Type your full legal name"
					bind:value={typedName}
					{disabled}
				/>
				{#if typedName.trim()}
					<div class="type-preview">
						<span class="type-rendered">{typedName.trim()}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>

	<label class="consent-row">
		<input type="checkbox" bind:checked={consentChecked} {disabled} />
		<span class="consent-text">I agree that this electronic signature is legally binding and represents my intent to sign.</span>
	</label>

	<button
		type="button"
		class="btn-sign"
		onclick={handleSign}
		disabled={!canSign}
	>
		{#if submitting}
			Submitting...
		{:else}
			<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M2 17l4-4 4 4 4-4 4 4 4-4" /><path d="M2 21h20" />
			</svg>
			Sign
		{/if}
	</button>
</div>

<style>
	.signature-pad {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.signature-pad.disabled {
		opacity: 0.5;
		pointer-events: none;
	}

	.mode-tabs {
		display: flex;
		gap: var(--space-xs);
		background: var(--bg-tertiary);
		border-radius: var(--radius-md);
		padding: 3px;
	}

	.mode-tab {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: var(--space-xs) var(--space-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.mode-tab.active {
		background: var(--bg-secondary);
		color: var(--text-primary);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
	}

	.mode-tab:hover:not(.active) {
		color: var(--text-primary);
	}

	.pad-area {
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.draw-canvas {
		display: block;
		width: 100%;
		height: 180px;
		background: var(--bg-primary);
		cursor: crosshair;
		touch-action: none;
	}

	.canvas-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: var(--space-xs) var(--space-md);
		border-top: 1px dashed var(--border-color);
		background: var(--bg-secondary);
	}

	.canvas-hint {
		font-size: var(--font-size-xs);
		color: var(--text-muted);
	}

	.btn-clear {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		background: transparent;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-sm);
		padding: 2px 10px;
		cursor: pointer;
		transition: all var(--transition-fast);
	}

	.btn-clear:hover {
		color: var(--color-error);
		border-color: var(--color-error);
	}

	.type-area {
		padding: var(--space-lg);
		background: var(--bg-primary);
	}

	.type-input {
		width: 100%;
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-size-md);
		color: var(--text-primary);
		background: var(--bg-secondary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-md);
		font-family: inherit;
		box-sizing: border-box;
	}

	.type-input:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
	}

	.type-preview {
		margin-top: var(--space-md);
		padding: var(--space-md);
		border: 1px dashed var(--border-color);
		border-radius: var(--radius-md);
		text-align: center;
		min-height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.type-rendered {
		font-family: 'Segoe Script', 'Brush Script MT', 'Apple Chancery', cursive;
		font-size: 36px;
		color: var(--text-primary);
		line-height: 1.2;
	}

	.consent-row {
		display: flex;
		align-items: flex-start;
		gap: var(--space-sm);
		cursor: pointer;
	}

	.consent-row input[type="checkbox"] {
		margin-top: 2px;
		flex-shrink: 0;
		accent-color: var(--color-accent);
	}

	.consent-text {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		line-height: 1.4;
	}

	.btn-sign {
		display: inline-flex;
		align-items: center;
		justify-content: center;
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
	}

	.btn-sign:hover:not(:disabled) {
		background: var(--color-accent-hover);
	}

	.btn-sign:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
