import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform }) => {
	const checks: Record<string, string> = {
		status: 'ok',
		timestamp: new Date().toISOString()
	};

	// Test D1 database access
	try {
		const db = platform?.env?.DB;
		if (db) {
			const result = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>();
			checks.db = `ok (${result?.count ?? 0} users)`;
		} else {
			checks.db = 'no binding';
		}
	} catch (e: any) {
		checks.db = `error: ${e?.message || String(e)}`;
	}

	// Test KV access
	try {
		const kv = platform?.env?.SESSIONS;
		if (kv) {
			await kv.get('health_check_test');
			checks.kv = 'ok';
		} else {
			checks.kv = 'no binding';
		}
	} catch (e: any) {
		checks.kv = `error: ${e?.message || String(e)}`;
	}

	// Test R2 access
	try {
		const r2 = platform?.env?.FILES_BUCKET;
		if (r2) {
			checks.r2 = 'binding exists';
		} else {
			checks.r2 = 'no binding';
		}
	} catch (e: any) {
		checks.r2 = `error: ${e?.message || String(e)}`;
	}

	return json(checks);
};
