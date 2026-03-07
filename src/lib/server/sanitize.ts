/** Input sanitization utilities for XSS prevention */

/**
 * Escape HTML special characters to prevent XSS.
 * Use on all user-submitted content before storing or rendering in HTML contexts.
 */
export function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

/**
 * Sanitize user-submitted text content (comments, answers, notes).
 * - Trims whitespace
 * - Limits length
 * - Removes null bytes and other control characters
 */
export function sanitizeTextInput(input: string, maxLength = 5000): string {
	return input
		.trim()
		.slice(0, maxLength)
		// Remove null bytes and most control chars (keep newlines, tabs)
		.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize a filename to prevent path traversal and injection.
 */
export function sanitizeFilename(filename: string): string {
	return filename
		// Remove path separators
		.replace(/[/\\]/g, '')
		// Remove null bytes
		.replace(/\x00/g, '')
		// Limit length
		.slice(0, 255)
		// Trim dots from start (prevents hidden files)
		.replace(/^\.+/, '')
		|| 'unnamed';
}
