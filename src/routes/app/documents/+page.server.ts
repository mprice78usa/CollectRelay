import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getDocumentLibrary, addDocumentLibraryItem, deleteDocumentLibraryItem, updateDocumentLibraryFile } from '$lib/server/db/document-library';
import type { DbDocumentLibraryItem } from '$lib/server/db/document-library';
import { sanitizeTextInput, sanitizeFilename } from '$lib/server/sanitize';

export const load: PageServerLoad = async ({ locals, platform }) => {
	const db = platform?.env?.DB;
	const workspaceId = locals.user?.workspaceId;

	if (!db || !workspaceId) {
		// Dev mock data
		const mockDocs: DbDocumentLibraryItem[] = [
			{ id: 'sys-lender-01', workspace_id: 'SYSTEM', category: 'lender', name: 'Uniform Residential Loan Application (1003)', description: 'Standard mortgage application form required by most lenders', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-lender-02', workspace_id: 'SYSTEM', category: 'lender', name: 'Loan Estimate (LE)', description: 'Itemized estimate of loan terms, projected payments, and closing costs', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-lender-03', workspace_id: 'SYSTEM', category: 'lender', name: 'Closing Disclosure (CD)', description: 'Final accounting of all loan terms and closing costs', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-lender-04', workspace_id: 'SYSTEM', category: 'lender', name: 'HUD-1 Settlement Statement', description: 'Detailed listing of all charges in a real estate transaction', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-lender-05', workspace_id: 'SYSTEM', category: 'lender', name: 'Truth in Lending Disclosure (TIL)', description: 'Disclosure of APR, finance charges, and payment schedule', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-agent-01', workspace_id: 'SYSTEM', category: 'agent', name: 'Purchase Agreement / Sales Contract', description: 'Primary contract between buyer and seller', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-agent-02', workspace_id: 'SYSTEM', category: 'agent', name: 'Listing Agreement', description: 'Contract between property owner and listing agent', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-agent-03', workspace_id: 'SYSTEM', category: 'agent', name: 'Seller Disclosure Statement', description: "Seller's disclosure of known property conditions and defects", filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-agent-04', workspace_id: 'SYSTEM', category: 'agent', name: 'Home Inspection Contingency', description: 'Addendum allowing buyer to withdraw based on inspection results', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
			{ id: 'sys-agent-05', workspace_id: 'SYSTEM', category: 'agent', name: 'Buyer Agency Agreement', description: 'Agreement establishing the buyer-agent relationship', filename: null, r2_key: null, file_size: null, mime_type: null, is_system: 1, created_by: 'system', created_at: '2026-01-01T00:00:00Z' },
		];
		return { documents: mockDocs };
	}

	const documents = await getDocumentLibrary(db, workspaceId);
	return { documents };
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
		if (!['lender', 'agent', 'custom'].includes(category)) return fail(400, { error: 'Invalid category' });

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
