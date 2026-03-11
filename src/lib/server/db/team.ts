/**
 * Workspace team management — members + invitations.
 */
import { generateId } from '$server/auth';

// ── Members ──────────────────────────────────────────────────────────

export interface WorkspaceMember {
	userId: string;
	name: string;
	email: string;
	role: string;
	joinedAt: string;
}

export async function getWorkspaceMembers(
	db: D1Database,
	workspaceId: string
): Promise<WorkspaceMember[]> {
	const result = await db
		.prepare(
			`SELECT u.id as userId, u.name, u.email, wm.role, wm.joined_at as joinedAt
			FROM workspace_members wm
			JOIN users u ON u.id = wm.user_id
			WHERE wm.workspace_id = ?
			ORDER BY CASE wm.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, wm.joined_at`
		)
		.bind(workspaceId)
		.all<WorkspaceMember>();

	return result.results;
}

export async function updateMemberRole(
	db: D1Database,
	workspaceId: string,
	userId: string,
	newRole: string
): Promise<boolean> {
	// Prevent changing the owner role
	if (newRole === 'owner') return false;

	const current = await db
		.prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
		.bind(workspaceId, userId)
		.first<{ role: string }>();

	if (!current || current.role === 'owner') return false;

	await db
		.prepare('UPDATE workspace_members SET role = ? WHERE workspace_id = ? AND user_id = ?')
		.bind(newRole, workspaceId, userId)
		.run();

	return true;
}

export async function removeMember(
	db: D1Database,
	workspaceId: string,
	userId: string
): Promise<boolean> {
	// Can't remove the owner
	const current = await db
		.prepare('SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
		.bind(workspaceId, userId)
		.first<{ role: string }>();

	if (!current || current.role === 'owner') return false;

	await db
		.prepare('DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
		.bind(workspaceId, userId)
		.run();

	return true;
}

// ── Invitations ──────────────────────────────────────────────────────

export interface WorkspaceInvitation {
	id: string;
	workspaceId: string;
	email: string;
	role: string;
	invitedBy: string;
	inviterName: string;
	token: string;
	expiresAt: string;
	acceptedAt: string | null;
	createdAt: string;
}

export async function getPendingInvitations(
	db: D1Database,
	workspaceId: string
): Promise<WorkspaceInvitation[]> {
	const result = await db
		.prepare(
			`SELECT wi.id, wi.workspace_id as workspaceId, wi.email, wi.role,
				wi.invited_by as invitedBy, u.name as inviterName, wi.token,
				wi.expires_at as expiresAt, wi.accepted_at as acceptedAt, wi.created_at as createdAt
			FROM workspace_invitations wi
			JOIN users u ON u.id = wi.invited_by
			WHERE wi.workspace_id = ? AND wi.accepted_at IS NULL AND wi.expires_at > datetime('now')
			ORDER BY wi.created_at DESC`
		)
		.bind(workspaceId)
		.all<WorkspaceInvitation>();

	return result.results;
}

export async function createInvitation(
	db: D1Database,
	params: { workspaceId: string; email: string; role: string; invitedBy: string }
): Promise<{ id: string; token: string }> {
	const id = generateId();
	const token = generateId() + generateId(); // 64 hex chars for a strong token
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

	await db
		.prepare(
			`INSERT INTO workspace_invitations (id, workspace_id, email, role, invited_by, token, expires_at)
			VALUES (?, ?, ?, ?, ?, ?, ?)`
		)
		.bind(id, params.workspaceId, params.email.toLowerCase(), params.role, params.invitedBy, token, expiresAt)
		.run();

	return { id, token };
}

export async function getInvitationByToken(
	db: D1Database,
	token: string
): Promise<(WorkspaceInvitation & { workspaceName: string }) | null> {
	return db
		.prepare(
			`SELECT wi.id, wi.workspace_id as workspaceId, wi.email, wi.role,
				wi.invited_by as invitedBy, u.name as inviterName, wi.token,
				wi.expires_at as expiresAt, wi.accepted_at as acceptedAt, wi.created_at as createdAt,
				w.name as workspaceName
			FROM workspace_invitations wi
			JOIN users u ON u.id = wi.invited_by
			JOIN workspaces w ON w.id = wi.workspace_id
			WHERE wi.token = ?`
		)
		.bind(token)
		.first<WorkspaceInvitation & { workspaceName: string }>();
}

export async function acceptInvitation(
	db: D1Database,
	token: string,
	userId: string
): Promise<boolean> {
	const invitation = await getInvitationByToken(db, token);
	if (!invitation) return false;
	if (invitation.acceptedAt) return false;
	if (new Date(invitation.expiresAt) < new Date()) return false;

	// Check user isn't already a member
	const existing = await db
		.prepare('SELECT 1 FROM workspace_members WHERE workspace_id = ? AND user_id = ?')
		.bind(invitation.workspaceId, userId)
		.first();

	if (existing) {
		// Already a member, just mark invitation as accepted
		await db
			.prepare("UPDATE workspace_invitations SET accepted_at = datetime('now') WHERE id = ?")
			.bind(invitation.id)
			.run();
		return true;
	}

	await db.batch([
		db
			.prepare("UPDATE workspace_invitations SET accepted_at = datetime('now') WHERE id = ?")
			.bind(invitation.id),
		db
			.prepare('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)')
			.bind(invitation.workspaceId, userId, invitation.role)
	]);

	return true;
}

export async function revokeInvitation(
	db: D1Database,
	id: string,
	workspaceId: string
): Promise<boolean> {
	const result = await db
		.prepare('DELETE FROM workspace_invitations WHERE id = ? AND workspace_id = ?')
		.bind(id, workspaceId)
		.run();

	return result.meta.changes > 0;
}

export async function resendInvitation(
	db: D1Database,
	id: string,
	workspaceId: string
): Promise<{ token: string } | null> {
	const invitation = await db
		.prepare('SELECT token FROM workspace_invitations WHERE id = ? AND workspace_id = ?')
		.bind(id, workspaceId)
		.first<{ token: string }>();

	if (!invitation) return null;

	const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
	await db
		.prepare('UPDATE workspace_invitations SET expires_at = ? WHERE id = ? AND workspace_id = ?')
		.bind(newExpiry, id, workspaceId)
		.run();

	return { token: invitation.token };
}
