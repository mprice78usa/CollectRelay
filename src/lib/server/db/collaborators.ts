/** Transaction collaborator database operations */
import { generateId } from '$server/auth';

export interface DbCollaborator {
	id: string;
	transaction_id: string;
	user_id: string;
	role: string;
	invited_by: string;
	invited_at: string;
}

// Extended with user info for display
export interface CollaboratorWithUser extends DbCollaborator {
	user_name: string;
	user_email: string;
}

export async function getCollaboratorsForTransaction(
	db: D1Database,
	transactionId: string
): Promise<CollaboratorWithUser[]> {
	const result = await db
		.prepare(
			`SELECT tc.*, u.name as user_name, u.email as user_email
			 FROM transaction_collaborators tc
			 JOIN users u ON tc.user_id = u.id
			 WHERE tc.transaction_id = ?
			 ORDER BY tc.invited_at`
		)
		.bind(transactionId)
		.all<CollaboratorWithUser>();
	return result.results;
}

export async function addCollaborator(
	db: D1Database,
	data: {
		transactionId: string;
		userId: string;
		role: string;
		invitedBy: string;
	}
): Promise<string> {
	const id = generateId();
	await db
		.prepare(
			`INSERT INTO transaction_collaborators (id, transaction_id, user_id, role, invited_by)
			 VALUES (?, ?, ?, ?, ?)`
		)
		.bind(id, data.transactionId, data.userId, data.role, data.invitedBy)
		.run();
	return id;
}

export async function removeCollaborator(
	db: D1Database,
	collaboratorId: string,
	transactionId: string
): Promise<void> {
	await db
		.prepare(
			'DELETE FROM transaction_collaborators WHERE id = ? AND transaction_id = ?'
		)
		.bind(collaboratorId, transactionId)
		.run();
}

export async function isCollaborator(
	db: D1Database,
	transactionId: string,
	userId: string
): Promise<DbCollaborator | null> {
	return await db
		.prepare(
			'SELECT * FROM transaction_collaborators WHERE transaction_id = ? AND user_id = ?'
		)
		.bind(transactionId, userId)
		.first<DbCollaborator>();
}

export async function getCollaboratedTransactions(
	db: D1Database,
	userId: string
): Promise<Array<{ transaction_id: string; role: string; title: string; client_name: string; status: string }>> {
	const result = await db
		.prepare(
			`SELECT tc.transaction_id, tc.role, t.title, t.client_name, t.status
			 FROM transaction_collaborators tc
			 JOIN transactions t ON tc.transaction_id = t.id
			 WHERE tc.user_id = ?
			 ORDER BY t.updated_at DESC`
		)
		.bind(userId)
		.all();
	return result.results as any;
}
