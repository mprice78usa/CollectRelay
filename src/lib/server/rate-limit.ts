/** Rate limiting using Cloudflare KV
 * Tracks attempts by IP address with sliding window.
 */

interface RateLimitConfig {
	/** Maximum attempts allowed in the window */
	maxAttempts: number;
	/** Window duration in seconds */
	windowSeconds: number;
}

interface RateLimitEntry {
	attempts: number;
	firstAttempt: number; // epoch ms
}

const AUTH_RATE_LIMIT: RateLimitConfig = {
	maxAttempts: 10,
	windowSeconds: 900 // 15 minutes
};

const MAGIC_LINK_RATE_LIMIT: RateLimitConfig = {
	maxAttempts: 5,
	windowSeconds: 300 // 5 minutes
};

/**
 * Check and increment rate limit for a given action + IP.
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds }.
 */
export async function checkRateLimit(
	kv: KVNamespace,
	action: 'login' | 'register' | 'magic_link',
	ip: string
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
	const config = action === 'magic_link' ? MAGIC_LINK_RATE_LIMIT : AUTH_RATE_LIMIT;
	const key = `ratelimit:${action}:${ip}`;

	const raw = await kv.get(key);
	const now = Date.now();

	if (raw) {
		const entry: RateLimitEntry = JSON.parse(raw);
		const elapsed = (now - entry.firstAttempt) / 1000;

		if (elapsed < config.windowSeconds) {
			if (entry.attempts >= config.maxAttempts) {
				const retryAfterSeconds = Math.ceil(config.windowSeconds - elapsed);
				return { allowed: false, retryAfterSeconds };
			}

			// Increment attempts
			entry.attempts += 1;
			await kv.put(key, JSON.stringify(entry), {
				expirationTtl: config.windowSeconds
			});
			return { allowed: true };
		}
	}

	// New window or expired — start fresh
	const entry: RateLimitEntry = { attempts: 1, firstAttempt: now };
	await kv.put(key, JSON.stringify(entry), {
		expirationTtl: config.windowSeconds
	});
	return { allowed: true };
}
