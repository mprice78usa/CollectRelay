/** Milestone CRUD operations */
import { generateId } from '$server/auth';
import { addBusinessDays, formatDateISO } from '$lib/server/business-days';

export interface DbMilestone {
	id: string;
	transaction_id: string;
	milestone_type: string;
	label: string;
	date: string | null;
	completed: number;
	sort_order: number;
	created_at: string;
}

export async function getMilestonesForTransaction(
	db: D1Database,
	transactionId: string
): Promise<DbMilestone[]> {
	const result = await db
		.prepare('SELECT * FROM transaction_milestones WHERE transaction_id = ? ORDER BY sort_order, date')
		.bind(transactionId)
		.all<DbMilestone>();
	return result.results;
}

export async function createMilestone(
	db: D1Database,
	data: {
		transactionId: string;
		milestoneType?: string;
		label: string;
		date?: string;
		sortOrder?: number;
	}
): Promise<string> {
	const id = generateId();
	await db
		.prepare(
			`INSERT INTO transaction_milestones (id, transaction_id, milestone_type, label, date, sort_order)
			 VALUES (?, ?, ?, ?, ?, ?)`
		)
		.bind(
			id,
			data.transactionId,
			data.milestoneType || 'custom',
			data.label,
			data.date || null,
			data.sortOrder ?? 0
		)
		.run();
	return id;
}

export async function updateMilestone(
	db: D1Database,
	milestoneId: string,
	transactionId: string,
	data: { label?: string; date?: string | null; completed?: number }
): Promise<void> {
	const sets: string[] = [];
	const values: (string | number | null)[] = [];

	if (data.label !== undefined) { sets.push('label = ?'); values.push(data.label); }
	if (data.date !== undefined) { sets.push('date = ?'); values.push(data.date); }
	if (data.completed !== undefined) { sets.push('completed = ?'); values.push(data.completed); }

	if (sets.length === 0) return;

	values.push(milestoneId, transactionId);
	await db
		.prepare(`UPDATE transaction_milestones SET ${sets.join(', ')} WHERE id = ? AND transaction_id = ?`)
		.bind(...values)
		.run();
}

export async function deleteMilestone(
	db: D1Database,
	milestoneId: string,
	transactionId: string
): Promise<void> {
	await db
		.prepare('DELETE FROM transaction_milestones WHERE id = ? AND transaction_id = ?')
		.bind(milestoneId, transactionId)
		.run();
}

/**
 * Default milestone offsets from contract date (in business days).
 */
const DEFAULT_MILESTONES = [
	{ type: 'contract_date', label: 'Contract Date', offset: 0, sortOrder: 0 },
	{ type: 'inspection', label: 'Inspection Deadline', offset: 10, sortOrder: 1 },
	{ type: 'appraisal', label: 'Appraisal Due', offset: 15, sortOrder: 2 },
	{ type: 'title_review', label: 'Title Review', offset: 25, sortOrder: 3 },
	{ type: 'loan_commitment', label: 'Loan Commitment', offset: 30, sortOrder: 4 },
	{ type: 'final_walkthrough', label: 'Final Walkthrough', offset: 44, sortOrder: 5 },
	{ type: 'closing', label: 'Closing', offset: 45, sortOrder: 6 }
];

/**
 * Seed default milestones for a transaction based on a contract date.
 * Calculates dates using business day offsets.
 */
export async function seedDefaultMilestones(
	db: D1Database,
	transactionId: string,
	contractDate: string
): Promise<void> {
	const baseDate = new Date(contractDate + 'T12:00:00');
	const statements: D1PreparedStatement[] = [];

	for (const ms of DEFAULT_MILESTONES) {
		const date = ms.offset === 0 ? baseDate : addBusinessDays(baseDate, ms.offset);
		statements.push(
			db
				.prepare(
					`INSERT INTO transaction_milestones (id, transaction_id, milestone_type, label, date, sort_order)
					 VALUES (?, ?, ?, ?, ?, ?)`
				)
				.bind(
					generateId(),
					transactionId,
					ms.type,
					ms.label,
					formatDateISO(date),
					ms.sortOrder
				)
		);
	}

	await db.batch(statements);
}
