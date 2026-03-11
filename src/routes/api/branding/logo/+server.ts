import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateWorkspace } from '$lib/server/db/users';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket || !user?.workspaceId) {
		throw error(400, 'Not available');
	}

	const formData = await request.formData();
	const file = formData.get('logo') as File | null;

	if (!file || file.size === 0) {
		throw error(400, 'No file provided');
	}

	if (file.size > MAX_SIZE) {
		throw error(400, 'File too large. Maximum 2MB.');
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		throw error(400, 'Invalid file type. Use PNG, JPG, SVG, or WebP.');
	}

	// Determine extension
	const extMap: Record<string, string> = {
		'image/png': 'png',
		'image/jpeg': 'jpg',
		'image/svg+xml': 'svg',
		'image/webp': 'webp'
	};
	const ext = extMap[file.type] || 'png';
	const r2Key = `workspaces/${user.workspaceId}/branding/logo.${ext}`;

	// Upload to R2
	await bucket.put(r2Key, file.stream(), {
		httpMetadata: {
			contentType: file.type
		}
	});

	// Update workspace record
	await updateWorkspace(db, user.workspaceId, { brand_logo_r2_key: r2Key });

	return json({ success: true, r2Key });
};

export const DELETE: RequestHandler = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	const user = locals.user;

	if (!db || !bucket || !user?.workspaceId) {
		throw error(400, 'Not available');
	}

	// Get current logo key
	const row = await db
		.prepare('SELECT brand_logo_r2_key FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ brand_logo_r2_key: string | null }>();

	if (row?.brand_logo_r2_key) {
		try {
			await bucket.delete(row.brand_logo_r2_key);
		} catch {
			// Ignore if file doesn't exist
		}
	}

	// Clear the column
	await updateWorkspace(db, user.workspaceId, { brand_logo_r2_key: null });

	return json({ success: true });
};
