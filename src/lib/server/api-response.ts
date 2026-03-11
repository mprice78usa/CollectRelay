/** Standardized API response helpers for /api/v1/ endpoints */
import { json } from '@sveltejs/kit';

/**
 * Return a success JSON response with optional metadata.
 */
export function apiSuccess(data: unknown, meta?: Record<string, unknown>) {
	return json({ data, ...(meta ? { meta } : {}) });
}

/**
 * Return a JSON error response.
 */
export function apiError(status: number, message: string, code?: string) {
	return json(
		{ error: { message, ...(code ? { code } : {}) } },
		{ status }
	);
}
