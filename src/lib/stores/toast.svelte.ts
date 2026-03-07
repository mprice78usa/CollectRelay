/** Toast notification store (Svelte 5 runes) */

export interface Toast {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
}

let toasts = $state<Toast[]>([]);

export function getToasts() {
	return toasts;
}

export function addToast(message: string, type: Toast['type'] = 'info', duration = 5000) {
	const id = crypto.randomUUID();
	toasts.push({ id, message, type });

	if (duration > 0) {
		setTimeout(() => removeToast(id), duration);
	}
}

export function removeToast(id: string) {
	toasts = toasts.filter((t) => t.id !== id);
}
