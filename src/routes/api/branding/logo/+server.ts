import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateWorkspace } from '$lib/server/db/users';

/** GET /api/branding/logo?wid=... — Serve the workspace brand logo from R2.
 *  Public access (used in client portal) — requires workspace ID query param. */
export const GET: RequestHandler = async ({ url, platform }) => {
	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	if (!db || !bucket) throw error(503, 'Storage not available');

	const wid = url.searchParams.get('wid');
	if (!wid) throw error(400, 'Missing workspace ID');

	const workspace = await db
		.prepare('SELECT brand_logo_r2_key FROM workspaces WHERE id = ?')
		.bind(wid)
		.first<{ brand_logo_r2_key: string | null }>();

	if (!workspace?.brand_logo_r2_key) {
		throw error(404, 'No logo found');
	}

	const object = await bucket.get(workspace.brand_logo_r2_key);
	if (!object) {
		throw error(404, 'Logo file not found');
	}

	const headers: Record<string, string> = {
		'Content-Type': (object as any).httpMetadata?.contentType || 'image/png',
		'Cache-Control': 'public, max-age=3600',
	};

	return new Response(object.body as ReadableStream, { headers });
};

/** POST /api/branding/logo — Upload a workspace brand logo to R2. Auth required. */
export const POST: RequestHandler = async ({ request, platform, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	if (!db || !bucket) throw error(503, 'Storage not available');

	const formData = await request.formData();
	const file = formData.get('logo') as File | null;

	if (!file || !file.size) {
		throw error(400, 'No file provided');
	}

	// Validate file type
	const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif'];
	if (!allowedTypes.includes(file.type)) {
		return json({ message: 'Invalid file type. Use PNG, JPG, SVG, WebP, or GIF.' }, { status: 400 });
	}

	// Validate file size (max 2MB)
	if (file.size > 2 * 1024 * 1024) {
		return json({ message: 'Logo must be under 2MB.' }, { status: 400 });
	}

	// Delete old logo if it exists
	const existing = await db
		.prepare('SELECT brand_logo_r2_key FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ brand_logo_r2_key: string | null }>();

	if (existing?.brand_logo_r2_key) {
		try {
			await bucket.delete(existing.brand_logo_r2_key);
		} catch {
			// ignore
		}
	}

	// Upload to R2
	const ext = file.name.split('.').pop() || 'png';
	const r2Key = `branding/${user.workspaceId}/logo.${ext}`;

	await bucket.put(r2Key, file.stream(), {
		httpMetadata: { contentType: file.type }
	});

	// Save R2 key to workspace
	await updateWorkspace(db, user.workspaceId, {
		brand_logo_r2_key: r2Key
	});

	return json({ success: true, r2Key });
};

/** DELETE /api/branding/logo — Remove workspace brand logo. Auth required. */
export const DELETE: RequestHandler = async ({ platform, locals }) => {
	const user = locals.user;
	if (!user) throw error(401, 'Unauthorized');

	const db = platform?.env?.DB;
	const bucket = platform?.env?.FILES_BUCKET;
	if (!db || !bucket) throw error(503, 'Storage not available');

	const existing = await db
		.prepare('SELECT brand_logo_r2_key FROM workspaces WHERE id = ?')
		.bind(user.workspaceId)
		.first<{ brand_logo_r2_key: string | null }>();

	if (existing?.brand_logo_r2_key) {
		try {
			await bucket.delete(existing.brand_logo_r2_key);
		} catch {
			// ignore
		}
	}

	await updateWorkspace(db, user.workspaceId, {
		brand_logo_r2_key: null
	});

	return json({ success: true });
};
