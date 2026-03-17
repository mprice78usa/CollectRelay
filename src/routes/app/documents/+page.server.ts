import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getDocumentLibrary, addDocumentLibraryItem, deleteDocumentLibraryItem, updateDocumentLibraryFile } from '$lib/server/db/document-library';
import type { DbDocumentLibraryItem } from '$lib/server/db/document-library';
import { sanitizeTextInput, sanitizeFilename } from '$lib/server/sanitize';
import { TEMPLATE_DEFINITIONS } from '$lib/server/pdf-templates';
import { buildTemplatePdf } from '$lib/server/pdf-builder';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mock data
		const mockDocs: DbDocumentLibraryItem[] = [
			{ id: 'sys-lender-01', workspace_id: 'SYSTEM', category: 'lender', name: 'Uniform Residential Loan Application (1003)', description: 'Standard mortgage application form required by most lenders', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z', external_url: null },
			{ id: 'sys-agent-01', workspace_id: 'SYSTEM', category: 'agent', name: 'Purchase Agreement / Sales Contract', description: 'Primary contract between buyer and seller', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z', external_url: null },
			{ id: 'sys-agent-03', workspace_id: 'SYSTEM', category: 'agent', name: 'Seller Disclosure Statement', description: "Seller's disclosure of known property conditions and defects", filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z', external_url: null },
			{ id: 'sys-agent-05', workspace_id: 'SYSTEM', category: 'agent', name: 'Buyer Agency Agreement', description: 'Agreement establishing the buyer-agent relationship', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z', external_url: null },
		];
		return {
			documents: mockDocs,
			industry: 'real_estate' as string,
			userProfile: { name: 'Dev User', email: 'dev@test.com', phone: '555-0100' },
			companyName: 'Dev Company'
		};
	}

	// Load workspace info + user profile for template pre-fill
	const ws = await db
		.prepare('SELECT industry, brand_name, name FROM workspaces WHERE id = ?')
		.bind(workspaceId)
		.first<{ industry: string; brand_name: string | null; name: string }>();
	const industry = ws?.industry || 'real_estate';

	const userRow = await db
		.prepare('SELECT name, email, phone FROM users WHERE id = ?')
		.bind(locals.user!.id)
		.first<{ name: string; email: string; phone: string | null }>();

	const documents = await getDocumentLibrary(db, workspaceId, undefined, industry);
	return {
		documents,
		industry,
		userProfile: {
			name: userRow?.name || '',
			email: userRow?.email || '',
			phone: userRow?.phone || ''
		},
		companyName: ws?.brand_name || ws?.name || ''
	};
};

export const actions: Actions = {
	addDocument: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const rawName = (formData.get('name') as string)?.trim();
		const rawDescription = (formData.get('description') as string)?.trim();
		const category = formData.get('category') as string;

		if (!rawName) return fail(400, { error: 'Name is required' });
		const validCategories = ['lender', 'agent', 'contracts', 'compliance', 'general', 'custom'];
		if (!validCategories.includes(category)) return fail(400, { error: 'Invalid category' });

		const name = sanitizeTextInput(rawName, 200);
		const description = rawDescription ? sanitizeTextInput(rawDescription, 1000) : undefined;

		await addDocumentLibraryItem(db, {
			workspaceId: user.workspaceId,
			category,
			name,
			description,
			createdBy: user.id
		});

		return { success: true };
	},

	deleteDocument: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const user = locals.user;
		if (!db || !user?.workspaceId) return fail(400, { error: 'Database not available' });

		const formData = await request.formData();
		const documentId = formData.get('documentId') as string;
		if (!documentId) return fail(400, { error: 'Document ID required' });

		await deleteDocumentLibraryItem(db, documentId, user.workspaceId);
		return { success: true };
	},

	generateTemplate: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const bucket = platform?.env?.FILES_BUCKET;
		const user = locals.user;
		if (!db || !bucket || !user?.workspaceId) return fail(400, { error: 'Storage not available' });

		const formData = await request.formData();
		const documentId = formData.get('documentId') as string;

		if (!documentId) return fail(400, { error: 'Document ID required' });

		const templateDef = TEMPLATE_DEFINITIONS[documentId];
		if (!templateDef) return fail(400, { error: 'No template available for this document' });

		// Get workspace branding
		const ws = await db
			.prepare('SELECT brand_name, brand_logo_r2_key, name FROM workspaces WHERE id = ?')
			.bind(user.workspaceId)
			.first<{ brand_name: string | null; brand_logo_r2_key: string | null; name: string }>();
		const companyName = ws?.brand_name || ws?.name || 'Company';

		// Fetch logo from R2 if available
		let logoBytes: ArrayBuffer | null = null;
		let logoMimeType: string | undefined;
		if (ws?.brand_logo_r2_key) {
			try {
				const logoObj = await bucket.get(ws.brand_logo_r2_key);
				if (logoObj) {
					logoBytes = await logoObj.arrayBuffer();
					logoMimeType = logoObj.httpMetadata?.contentType || undefined;
				}
			} catch {
				// Skip logo
			}
		}

		// Get custom document name from form
		const rawDocName = (formData.get('docName') as string)?.trim();
		const docName = rawDocName ? sanitizeTextInput(rawDocName, 200) : templateDef.title;

		// Extract field values from form data
		const proFields: Record<string, string> = {};
		const clientFields: Record<string, string> = {};
		let bodyText = templateDef.bodyTemplate;

		for (const field of templateDef.fields) {
			const value = (formData.get(field.name) as string)?.trim() || '';
			if (field.section === 'pro' && value) {
				proFields[field.label] = value;
			} else if (field.section === 'client' && value) {
				clientFields[field.label] = value;
			} else if (field.section === 'body' && value) {
				bodyText = value;
			}
		}

		// Build the PDF
		const today = new Date().toLocaleDateString('en-US', {
			year: 'numeric', month: 'long', day: 'numeric'
		});

		const pdfBytes = await buildTemplatePdf({
			title: templateDef.title,
			companyName,
			date: today,
			proFields,
			clientFields,
			bodyText,
			logoBytes,
			logoMimeType,
		});

		// Create a workspace-owned doc in the "custom" category
		const newDocId = await addDocumentLibraryItem(db, {
			workspaceId: user.workspaceId,
			category: 'custom',
			name: docName,
			description: `Generated from ${templateDef.title} template on ${today}`,
			createdBy: user.id,
		});

		// Upload PDF to R2
		const filename = `${docName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
		const r2Key = `documents/${user.workspaceId}/${newDocId}/${filename}`;

		await bucket.put(r2Key, pdfBytes, {
			httpMetadata: { contentType: 'application/pdf' }
		});

		// Attach file to the new doc
		await updateDocumentLibraryFile(db, newDocId, user.workspaceId, {
			filename,
			r2Key,
			fileSize: pdfBytes.length,
			mimeType: 'application/pdf',
		});

		return { success: true, generated: true };
	},

	uploadFile: async ({ request, locals, platform }) => {
		const db = platform?.env?.DB;
		const bucket = platform?.env?.FILES_BUCKET;
		const user = locals.user;
		if (!db || !bucket || !user?.workspaceId) return fail(400, { error: 'Storage not available' });

		const formData = await request.formData();
		const file = formData.get('file') as File;
		const documentId = formData.get('documentId') as string;

		if (!file || !documentId) return fail(400, { error: 'Missing file or document ID' });
		if (file.size > 50 * 1024 * 1024) return fail(413, { error: 'File too large (max 50 MB)' });

		const safeName = sanitizeFilename(file.name);
		const r2Key = `documents/${user.workspaceId}/${documentId}/${safeName}`;

		await bucket.put(r2Key, file.stream(), {
			httpMetadata: { contentType: file.type || 'application/octet-stream' }
		});

		await updateDocumentLibraryFile(db, documentId, user.workspaceId, {
			filename: safeName,
			r2Key,
			fileSize: file.size,
			mimeType: file.type || 'application/octet-stream'
		});

		return { success: true };
	}
};
