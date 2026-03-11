/** User database operations */
import { generateId } from '$server/auth';

export interface DbUser {
	id: string;
	email: string;
	name: string;
	password_hash: string;
	password_salt: string;
	company: string | null;
	phone: string | null;
	avatar_url: string | null;
	notify_submissions: number;
	notify_review_reminders: number;
	notify_completed: number;
	created_at: string;
	updated_at: string;
}

export async function getUserByEmail(db: D1Database, email: string): Promise<DbUser | null> {
	return db
		.prepare('SELECT * FROM users WHERE email = ?')
		.bind(email.toLowerCase())
		.first<DbUser>();
}

export async function getUserById(db: D1Database, id: string): Promise<DbUser | null> {
	return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<DbUser>();
}

export async function createUser(
	db: D1Database,
	data: { email: string; name: string; passwordHash: string; passwordSalt: string; company?: string }
): Promise<{ userId: string; workspaceId: string }> {
	const userId = generateId();
	const workspaceId = generateId();

	const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

	await db.batch([
		db
			.prepare(
				'INSERT INTO users (id, email, name, password_hash, password_salt, company) VALUES (?, ?, ?, ?, ?, ?)'
			)
			.bind(userId, data.email.toLowerCase(), data.name, data.passwordHash, data.passwordSalt, data.company || null),
		db
			.prepare('INSERT INTO workspaces (id, name, owner_id, trial_ends_at, onboarding_completed) VALUES (?, ?, ?, ?, 0)')
			.bind(workspaceId, `${data.name}'s Workspace`, userId, trialEndsAt),
		db
			.prepare('INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)')
			.bind(workspaceId, userId, 'owner')
	]);

	return { userId, workspaceId };
}

export async function getWorkspaceForUser(
	db: D1Database,
	userId: string
): Promise<{ id: string; name: string; role: string } | null> {
	return db
		.prepare(
			`SELECT w.id, w.name, wm.role
			 FROM workspaces w
			 JOIN workspace_members wm ON w.id = wm.workspace_id
			 WHERE wm.user_id = ?
			 LIMIT 1`
		)
		.bind(userId)
		.first<{ id: string; name: string; role: string }>();
}

export async function updateWorkspace(
	db: D1Database,
	workspaceId: string,
	data: {
		name?: string;
		brand_logo_r2_key?: string | null;
		brand_color?: string | null;
		brand_name?: string | null;
	}
): Promise<void> {
	const sets: string[] = [];
	const values: (string | null)[] = [];

	if (data.name !== undefined) {
		sets.push('name = ?');
		values.push(data.name);
	}
	if (data.brand_logo_r2_key !== undefined) {
		sets.push('brand_logo_r2_key = ?');
		values.push(data.brand_logo_r2_key);
	}
	if (data.brand_color !== undefined) {
		sets.push('brand_color = ?');
		values.push(data.brand_color);
	}
	if (data.brand_name !== undefined) {
		sets.push('brand_name = ?');
		values.push(data.brand_name);
	}

	if (sets.length === 0) return;

	sets.push("updated_at = datetime('now')");
	values.push(workspaceId);

	await db
		.prepare(`UPDATE workspaces SET ${sets.join(', ')} WHERE id = ?`)
		.bind(...values)
		.run();
}

export interface WorkspaceBranding {
	brand_logo_r2_key: string | null;
	brand_color: string | null;
	brand_name: string | null;
}

export async function getWorkspaceBranding(
	db: D1Database,
	workspaceId: string
): Promise<WorkspaceBranding | null> {
	return db
		.prepare('SELECT brand_logo_r2_key, brand_color, brand_name FROM workspaces WHERE id = ?')
		.bind(workspaceId)
		.first<WorkspaceBranding>();
}

export async function updateUser(
	db: D1Database,
	userId: string,
	data: { name?: string; company?: string; phone?: string }
): Promise<void> {
	const sets: string[] = [];
	const values: (string | null)[] = [];

	if (data.name !== undefined) {
		sets.push('name = ?');
		values.push(data.name);
	}
	if (data.company !== undefined) {
		sets.push('company = ?');
		values.push(data.company);
	}
	if (data.phone !== undefined) {
		sets.push('phone = ?');
		values.push(data.phone);
	}

	if (sets.length === 0) return;

	sets.push("updated_at = datetime('now')");
	values.push(userId);

	await db
		.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`)
		.bind(...values)
		.run();
}

// --- Notification Preferences ---

export async function updateNotificationPrefs(
	db: D1Database,
	userId: string,
	prefs: { notifySubmissions: number; notifyReviewReminders: number; notifyCompleted: number }
): Promise<void> {
	await db
		.prepare(
			`UPDATE users SET notify_submissions = ?, notify_review_reminders = ?, notify_completed = ?, updated_at = datetime('now') WHERE id = ?`
		)
		.bind(prefs.notifySubmissions, prefs.notifyReviewReminders, prefs.notifyCompleted, userId)
		.run();
}

export async function getNotificationPrefs(
	db: D1Database,
	userId: string
): Promise<{ notify_submissions: number; notify_review_reminders: number; notify_completed: number } | null> {
	return db
		.prepare('SELECT notify_submissions, notify_review_reminders, notify_completed FROM users WHERE id = ?')
		.bind(userId)
		.first();
}

// --- Billing / Trial helpers ---

export interface BillingInfo {
	planKey: string;
	billingInterval: string | null;
	subscriptionStatus: string;
	trialEndsAt: string | null;
	currentPeriodEnd: string | null;
	isTrialActive: boolean;
	isTrialExpired: boolean;
	trialDaysLeft: number;
	hasActiveSubscription: boolean;
}

export async function getBillingInfo(db: D1Database, workspaceId: string): Promise<BillingInfo> {
	const row = await db
		.prepare(
			'SELECT plan_key, billing_interval, subscription_status, trial_ends_at, current_period_end FROM workspaces WHERE id = ?'
		)
		.bind(workspaceId)
		.first<{
			plan_key: string;
			billing_interval: string | null;
			subscription_status: string;
			trial_ends_at: string | null;
			current_period_end: string | null;
		}>();

	const planKey = row?.plan_key || 'free';
	const subscriptionStatus = row?.subscription_status || 'inactive';
	const trialEndsAt = row?.trial_ends_at || null;
	const currentPeriodEnd = row?.current_period_end || null;
	const billingInterval = row?.billing_interval || null;

	const hasActiveSubscription = subscriptionStatus === 'active';
	const now = Date.now();
	const trialEnd = trialEndsAt ? new Date(trialEndsAt).getTime() : 0;
	const isTrialActive = !hasActiveSubscription && !!trialEndsAt && trialEnd > now;
	const isTrialExpired = !hasActiveSubscription && !!trialEndsAt && trialEnd <= now;
	const trialDaysLeft = isTrialActive ? Math.ceil((trialEnd - now) / (24 * 60 * 60 * 1000)) : 0;

	return {
		planKey,
		billingInterval,
		subscriptionStatus,
		trialEndsAt,
		currentPeriodEnd,
		isTrialActive,
		isTrialExpired,
		trialDaysLeft,
		hasActiveSubscription
	};
}

// --- Onboarding ---

export async function isOnboardingComplete(db: D1Database, workspaceId: string): Promise<boolean> {
	const row = await db
		.prepare('SELECT onboarding_completed FROM workspaces WHERE id = ?')
		.bind(workspaceId)
		.first<{ onboarding_completed: number }>();
	return row?.onboarding_completed === 1;
}

export async function markOnboardingComplete(db: D1Database, workspaceId: string): Promise<void> {
	await db
		.prepare("UPDATE workspaces SET onboarding_completed = 1, updated_at = datetime('now') WHERE id = ?")
		.bind(workspaceId)
		.run();
}
