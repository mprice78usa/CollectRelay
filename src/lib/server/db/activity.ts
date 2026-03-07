/** Activity tracking for in-app notifications */

export interface ItemActivityInfo {
	checklistItemId: string;
	lastActivityAt: string;
	lastActivityType: string;
	lastActorType: string;
	lastActorName: string | null;
}

/**
 * Record activity on a checklist item (upsert).
 * Called when comments, files, reviews, or status changes happen.
 */
export async function recordItemActivity(
	db: D1Database,
	checklistItemId: string,
	transactionId: string,
	activityType: string,
	actorType: 'pro' | 'client',
	actorName?: string
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO item_activity (checklist_item_id, transaction_id, last_activity_at, last_activity_type, last_actor_type, last_actor_name)
			 VALUES (?, ?, datetime('now'), ?, ?, ?)
			 ON CONFLICT(checklist_item_id) DO UPDATE SET
			   last_activity_at = datetime('now'),
			   last_activity_type = excluded.last_activity_type,
			   last_actor_type = excluded.last_actor_type,
			   last_actor_name = excluded.last_actor_name`
		)
		.bind(checklistItemId, transactionId, activityType, actorType, actorName || null)
		.run();
}

/**
 * Mark a transaction as "seen" by a viewer (upsert).
 * Called when a pro or client loads the transaction page.
 */
export async function markTransactionSeen(
	db: D1Database,
	transactionId: string,
	viewerType: 'pro' | 'client',
	viewerId: string
): Promise<void> {
	await db
		.prepare(
			`INSERT INTO activity_seen (transaction_id, viewer_type, viewer_id, last_seen_at)
			 VALUES (?, ?, ?, datetime('now'))
			 ON CONFLICT(transaction_id, viewer_type, viewer_id) DO UPDATE SET
			   last_seen_at = datetime('now')`
		)
		.bind(transactionId, viewerType, viewerId)
		.run();
}

/**
 * Get last seen timestamp for a viewer on a specific transaction.
 */
export async function getLastSeen(
	db: D1Database,
	transactionId: string,
	viewerType: 'pro' | 'client',
	viewerId: string
): Promise<string | null> {
	const row = await db
		.prepare(
			'SELECT last_seen_at FROM activity_seen WHERE transaction_id = ? AND viewer_type = ? AND viewer_id = ?'
		)
		.bind(transactionId, viewerType, viewerId)
		.first<{ last_seen_at: string }>();
	return row?.last_seen_at || null;
}

/**
 * Get count of unseen items for a viewer on a specific transaction.
 * "Unseen" = item_activity.last_activity_at > activity_seen.last_seen_at
 *            AND the activity was by the OTHER party (not yourself).
 */
export async function getUnseenItemCount(
	db: D1Database,
	transactionId: string,
	viewerType: 'pro' | 'client',
	viewerId: string
): Promise<number> {
	const oppositeType = viewerType === 'pro' ? 'client' : 'pro';

	const row = await db
		.prepare(
			`SELECT COUNT(*) as cnt FROM item_activity ia
			 LEFT JOIN activity_seen asn
			   ON asn.transaction_id = ia.transaction_id
			   AND asn.viewer_type = ?
			   AND asn.viewer_id = ?
			 WHERE ia.transaction_id = ?
			   AND ia.last_actor_type = ?
			   AND (asn.last_seen_at IS NULL OR ia.last_activity_at > asn.last_seen_at)`
		)
		.bind(viewerType, viewerId, transactionId, oppositeType)
		.first<{ cnt: number }>();
	return row?.cnt || 0;
}

/**
 * Get unseen counts for multiple transactions at once (for transaction list).
 */
export async function getUnseenCountsForTransactions(
	db: D1Database,
	transactionIds: string[],
	viewerType: 'pro' | 'client',
	viewerId: string
): Promise<Map<string, number>> {
	if (transactionIds.length === 0) return new Map();

	const oppositeType = viewerType === 'pro' ? 'client' : 'pro';
	const placeholders = transactionIds.map(() => '?').join(',');

	const result = await db
		.prepare(
			`SELECT ia.transaction_id, COUNT(*) as cnt FROM item_activity ia
			 LEFT JOIN activity_seen asn
			   ON asn.transaction_id = ia.transaction_id
			   AND asn.viewer_type = ?
			   AND asn.viewer_id = ?
			 WHERE ia.transaction_id IN (${placeholders})
			   AND ia.last_actor_type = ?
			   AND (asn.last_seen_at IS NULL OR ia.last_activity_at > asn.last_seen_at)
			 GROUP BY ia.transaction_id`
		)
		.bind(viewerType, viewerId, ...transactionIds, oppositeType)
		.all<{ transaction_id: string; cnt: number }>();

	const map = new Map<string, number>();
	for (const row of result.results) {
		map.set(row.transaction_id, row.cnt);
	}
	return map;
}

/**
 * Get per-item activity info for a transaction (for notification dots).
 */
export async function getItemActivityMap(
	db: D1Database,
	transactionId: string
): Promise<ItemActivityInfo[]> {
	const result = await db
		.prepare(
			'SELECT checklist_item_id as checklistItemId, last_activity_at as lastActivityAt, last_activity_type as lastActivityType, last_actor_type as lastActorType, last_actor_name as lastActorName FROM item_activity WHERE transaction_id = ?'
		)
		.bind(transactionId)
		.all<ItemActivityInfo>();
	return result.results;
}

/**
 * Get new activity since a given timestamp for a transaction (for polling).
 * Returns only activity by the OTHER party.
 */
export async function getActivitySince(
	db: D1Database,
	transactionId: string,
	since: string,
	viewerType: 'pro' | 'client'
): Promise<ItemActivityInfo[]> {
	const oppositeType = viewerType === 'pro' ? 'client' : 'pro';
	const result = await db
		.prepare(
			`SELECT checklist_item_id as checklistItemId, last_activity_at as lastActivityAt,
			        last_activity_type as lastActivityType, last_actor_type as lastActorType,
			        last_actor_name as lastActorName
			 FROM item_activity
			 WHERE transaction_id = ? AND last_activity_at > ? AND last_actor_type = ?
			 ORDER BY last_activity_at DESC`
		)
		.bind(transactionId, since, oppositeType)
		.all<ItemActivityInfo>();
	return result.results;
}

/**
 * Get new activity across all transactions for a workspace (for pro polling without specific txn).
 */
export async function getActivitySinceForWorkspace(
	db: D1Database,
	workspaceId: string,
	since: string
): Promise<(ItemActivityInfo & { transactionId: string; transactionTitle: string })[]> {
	const result = await db
		.prepare(
			`SELECT ia.checklist_item_id as checklistItemId, ia.transaction_id as transactionId,
			        t.title as transactionTitle,
			        ia.last_activity_at as lastActivityAt, ia.last_activity_type as lastActivityType,
			        ia.last_actor_type as lastActorType, ia.last_actor_name as lastActorName
			 FROM item_activity ia
			 JOIN transactions t ON ia.transaction_id = t.id
			 WHERE t.workspace_id = ? AND ia.last_activity_at > ? AND ia.last_actor_type = 'client'
			 ORDER BY ia.last_activity_at DESC
			 LIMIT 20`
		)
		.bind(workspaceId, since)
		.all<ItemActivityInfo & { transactionId: string; transactionTitle: string }>();
	return result.results;
}
