/** Notification helpers using audit_events + notification_seen_at */

export interface NotificationEvent {
	id: string;
	transaction_id: string;
	transaction_title: string;
	actor_type: string;
	actor_name: string;
	action: string;
	detail: string | null;
	created_at: string;
}

/**
 * Get count of unseen notifications for a user.
 * Uses audit_events from clients since the user's notification_seen_at.
 */
export async function getUnreadNotificationCount(
	db: D1Database,
	workspaceId: string,
	userId: string
): Promise<number> {
	// Get user's last seen timestamp
	const user = await db
		.prepare('SELECT notification_seen_at FROM users WHERE id = ?')
		.bind(userId)
		.first<{ notification_seen_at: string | null }>();

	const seenAt = user?.notification_seen_at;

	let query = `
		SELECT COUNT(*) as count
		FROM audit_events ae
		JOIN transactions t ON ae.transaction_id = t.id
		WHERE t.workspace_id = ?
		  AND ae.actor_type = 'client'`;

	const values: string[] = [workspaceId];

	if (seenAt) {
		query += ' AND ae.created_at > ?';
		values.push(seenAt);
	}

	const result = await db.prepare(query).bind(...values).first<{ count: number }>();
	return result?.count ?? 0;
}

/**
 * Get recent notification events for the activity feed.
 */
export async function getNotificationEvents(
	db: D1Database,
	workspaceId: string,
	limit = 50
): Promise<NotificationEvent[]> {
	const result = await db
		.prepare(
			`SELECT ae.id, ae.transaction_id, t.title as transaction_title,
				ae.actor_type, ae.actor_name, ae.action, ae.detail, ae.created_at
			 FROM audit_events ae
			 JOIN transactions t ON ae.transaction_id = t.id
			 WHERE t.workspace_id = ?
			 ORDER BY ae.created_at DESC
			 LIMIT ?`
		)
		.bind(workspaceId, limit)
		.all<NotificationEvent>();

	return result.results;
}

/**
 * Mark all notifications as seen for a user.
 */
export async function markNotificationsSeen(
	db: D1Database,
	userId: string
): Promise<void> {
	await db
		.prepare("UPDATE users SET notification_seen_at = datetime('now') WHERE id = ?")
		.bind(userId)
		.run();
}
