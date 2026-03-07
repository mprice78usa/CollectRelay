/** Template database operations */
import { generateId } from '$server/auth';

export interface DbTemplate {
	id: string;
	workspace_id: string;
	name: string;
	description: string | null;
	category: string;
	is_default: number;
	created_by: string;
	created_at: string;
	updated_at: string;
}

export interface DbTemplateItem {
	id: string;
	template_id: string;
	name: string;
	description: string | null;
	item_type: string;
	required: number;
	sort_order: number;
	allowed_file_types: string | null;
	max_file_size: number | null;
	example_text: string | null;
}

export interface TemplateWithItems extends DbTemplate {
	items: DbTemplateItem[];
}

export async function getTemplatesForWorkspace(
	db: D1Database,
	workspaceId: string
): Promise<DbTemplate[]> {
	const result = await db
		.prepare('SELECT * FROM templates WHERE workspace_id = ? ORDER BY category, name')
		.bind(workspaceId)
		.all<DbTemplate>();
	return result.results;
}

export async function getTemplateById(
	db: D1Database,
	templateId: string,
	workspaceId: string
): Promise<TemplateWithItems | null> {
	const template = await db
		.prepare('SELECT * FROM templates WHERE id = ? AND workspace_id = ?')
		.bind(templateId, workspaceId)
		.first<DbTemplate>();

	if (!template) return null;

	const items = await db
		.prepare('SELECT * FROM template_items WHERE template_id = ? ORDER BY sort_order')
		.bind(templateId)
		.all<DbTemplateItem>();

	return { ...template, items: items.results };
}

export async function createTemplate(
	db: D1Database,
	data: {
		workspaceId: string;
		name: string;
		description?: string;
		category?: string;
		createdBy: string;
	}
): Promise<string> {
	const id = generateId();
	await db
		.prepare(
			'INSERT INTO templates (id, workspace_id, name, description, category, created_by) VALUES (?, ?, ?, ?, ?, ?)'
		)
		.bind(id, data.workspaceId, data.name, data.description || null, data.category || 'custom', data.createdBy)
		.run();
	return id;
}

export async function updateTemplate(
	db: D1Database,
	templateId: string,
	workspaceId: string,
	data: { name?: string; description?: string; category?: string }
): Promise<void> {
	const sets: string[] = [];
	const values: (string | null)[] = [];

	if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
	if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
	if (data.category !== undefined) { sets.push('category = ?'); values.push(data.category); }

	if (sets.length === 0) return;

	sets.push("updated_at = datetime('now')");
	values.push(templateId, workspaceId);

	await db
		.prepare(`UPDATE templates SET ${sets.join(', ')} WHERE id = ? AND workspace_id = ?`)
		.bind(...values)
		.run();
}

export async function deleteTemplate(
	db: D1Database,
	templateId: string,
	workspaceId: string
): Promise<void> {
	await db
		.prepare('DELETE FROM templates WHERE id = ? AND workspace_id = ?')
		.bind(templateId, workspaceId)
		.run();
}

// --- Template items ---

export async function addTemplateItem(
	db: D1Database,
	data: {
		templateId: string;
		name: string;
		description?: string;
		itemType?: string;
		required?: boolean;
		sortOrder?: number;
		allowedFileTypes?: string;
		exampleText?: string;
	}
): Promise<string> {
	const id = generateId();
	await db
		.prepare(
			`INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types, example_text)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			data.templateId,
			data.name,
			data.description || null,
			data.itemType || 'document',
			data.required !== false ? 1 : 0,
			data.sortOrder ?? 0,
			data.allowedFileTypes || null,
			data.exampleText || null
		)
		.run();
	return id;
}

export async function updateTemplateItem(
	db: D1Database,
	itemId: string,
	data: {
		name?: string;
		description?: string;
		itemType?: string;
		required?: boolean;
		sortOrder?: number;
		allowedFileTypes?: string;
		exampleText?: string;
	}
): Promise<void> {
	const sets: string[] = [];
	const values: (string | number | null)[] = [];

	if (data.name !== undefined) { sets.push('name = ?'); values.push(data.name); }
	if (data.description !== undefined) { sets.push('description = ?'); values.push(data.description); }
	if (data.itemType !== undefined) { sets.push('item_type = ?'); values.push(data.itemType); }
	if (data.required !== undefined) { sets.push('required = ?'); values.push(data.required ? 1 : 0); }
	if (data.sortOrder !== undefined) { sets.push('sort_order = ?'); values.push(data.sortOrder); }
	if (data.allowedFileTypes !== undefined) { sets.push('allowed_file_types = ?'); values.push(data.allowedFileTypes); }
	if (data.exampleText !== undefined) { sets.push('example_text = ?'); values.push(data.exampleText); }

	if (sets.length === 0) return;

	values.push(itemId);
	await db.prepare(`UPDATE template_items SET ${sets.join(', ')} WHERE id = ?`).bind(...values).run();
}

export async function deleteTemplateItem(db: D1Database, itemId: string): Promise<void> {
	await db.prepare('DELETE FROM template_items WHERE id = ?').bind(itemId).run();
}

// --- Clone starter templates into a new workspace ---

export async function cloneStarterTemplates(
	db: D1Database,
	workspaceId: string,
	userId: string
): Promise<void> {
	// Get all system default templates
	const defaults = await db
		.prepare('SELECT * FROM templates WHERE workspace_id = ? AND is_default = 1')
		.bind('system')
		.all<DbTemplate>();

	if (defaults.results.length === 0) return;

	const statements: D1PreparedStatement[] = [];

	for (const template of defaults.results) {
		const newTemplateId = generateId();

		statements.push(
			db
				.prepare(
					'INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by) VALUES (?, ?, ?, ?, ?, 0, ?)'
				)
				.bind(newTemplateId, workspaceId, template.name, template.description, template.category, userId)
		);

		// Get items for this template
		const items = await db
			.prepare('SELECT * FROM template_items WHERE template_id = ? ORDER BY sort_order')
			.bind(template.id)
			.all<DbTemplateItem>();

		for (const item of items.results) {
			statements.push(
				db
					.prepare(
						`INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types, max_file_size, example_text)
						 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
					)
					.bind(
						generateId(),
						newTemplateId,
						item.name,
						item.description,
						item.item_type,
						item.required,
						item.sort_order,
						item.allowed_file_types,
						item.max_file_size,
						item.example_text
					)
			);
		}
	}

	// Batch all inserts
	if (statements.length > 0) {
		await db.batch(statements);
	}
}

export async function workspaceHasTemplates(db: D1Database, workspaceId: string): Promise<boolean> {
	const result = await db
		.prepare('SELECT COUNT(*) as count FROM templates WHERE workspace_id = ?')
		.bind(workspaceId)
		.first<{ count: number }>();
	return (result?.count ?? 0) > 0;
}

// --- Duplicate template ---

export async function duplicateTemplate(
	db: D1Database,
	templateId: string,
	workspaceId: string,
	userId: string
): Promise<string> {
	const original = await getTemplateById(db, templateId, workspaceId);
	if (!original) throw new Error('Template not found');

	const newId = generateId();
	const statements: D1PreparedStatement[] = [];

	statements.push(
		db
			.prepare(
				'INSERT INTO templates (id, workspace_id, name, description, category, is_default, created_by) VALUES (?, ?, ?, ?, ?, 0, ?)'
			)
			.bind(newId, workspaceId, `${original.name} (Copy)`, original.description, original.category, userId)
	);

	for (const item of original.items) {
		statements.push(
			db
				.prepare(
					`INSERT INTO template_items (id, template_id, name, description, item_type, required, sort_order, allowed_file_types, max_file_size, example_text)
					 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
				)
				.bind(
					generateId(),
					newId,
					item.name,
					item.description,
					item.item_type,
					item.required,
					item.sort_order,
					item.allowed_file_types,
					item.max_file_size,
					item.example_text
				)
		);
	}

	await db.batch(statements);
	return newId;
}
