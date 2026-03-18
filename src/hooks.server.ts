import { dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';
import { getUserById, getWorkspaceForUser, isOnboardingComplete } from '$lib/server/db/users';

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/health', '/pricing', '/features', '/checkout/success', '/checkout/cancel'];
const CLIENT_PATH_PREFIX = '/c/';
const PARTNER_PATH_PREFIX = '/p/';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Initialize locals
	event.locals.user = null;
	event.locals.clientSession = null;
	event.locals.apiKey = null;

	// Public marketing pages and auth pages
	if (PUBLIC_PATHS.some((p) => path === p) || path.startsWith('/industries/') || path.startsWith(PARTNER_PATH_PREFIX)) {
		return addSecurityHeaders(await resolve(event), path);
	}

	// Static assets
	if (path.startsWith('/_app/') || path.startsWith('/favicon')) {
		return resolve(event);
	}

	// Client portal paths — validate magic link token
	if (path.startsWith(CLIENT_PATH_PREFIX)) {
		// Extract token from path: /c/[token]
		const token = path.slice(CLIENT_PATH_PREFIX.length).split('/')[0];

		if (dev) {
			// Dev mode: support shortcut tokens for specific projects
			const demoTokenMap: Record<string, string> = {
				'meridian': 'txn-con-1',    // Commercial closeout — 6/8 complete, mixed statuses
				'henderson': 'txn-con-2',   // Kitchen remodel draw request — 4/5 complete, in review
				'willowbrook': 'txn-con-3', // Custom home submittals — 2/7 complete, has rejected item
				'patel': 'txn-con-4',       // Medical suite — completed project
				'lincoln': 'txn-con-5',     // School renovation permits — 1/6 complete, early stage
				'rivera': 'txn-con-6',      // Condo punch list — completed
				'oakridge': 'txn-con-7',    // Roof replacement — draft, 0/5
				'baxter': 'txn-con-8',      // Pool house — 2 e-signatures needed
			};

			const db = event.platform?.env?.DB;
			const txnId = demoTokenMap[token] || null;

			if (db) {
				// If token matches a shortcut, load that specific project
				const targetId = txnId || 'txn-con-1';
				const demo = await db.prepare('SELECT id, client_email, client_name FROM transactions WHERE id = ?').bind(targetId).first();
				if (demo) {
					event.locals.clientSession = {
						transactionId: demo.id as string,
						clientEmail: demo.client_email as string,
						clientName: demo.client_name as string,
						token
					};
					event.cookies.set('client_token', token, { path: '/', httpOnly: true, secure: false, sameSite: 'lax', maxAge: 72 * 60 * 60 });
					return addSecurityHeaders(await resolve(event), path);
				}
			}
			// Fallback mock
			event.locals.clientSession = {
				transactionId: txnId || 'txn-con-1',
				clientEmail: 'docs@meridiandevelopment.com',
				clientName: 'Meridian Development LLC',
				token
			};
			event.cookies.set('client_token', token, { path: '/', httpOnly: true, secure: false, sameSite: 'lax', maxAge: 72 * 60 * 60 });
			return addSecurityHeaders(await resolve(event), path);
		}

		if (token && event.platform?.env?.MAGIC_LINKS) {
			const { validateMagicLink } = await import('$lib/server/magic-links');
			const session = await validateMagicLink(event.platform.env, token);
			if (session) {
				event.locals.clientSession = {
					transactionId: session.transactionId,
					clientEmail: session.clientEmail,
					clientName: session.clientName,
					token
				};
				// Set cookie so client can also access /api/ routes (uploads, etc.)
				event.cookies.set('client_token', token, {
					path: '/',
					httpOnly: true,
					secure: true,
					sameSite: 'lax',
					maxAge: 72 * 60 * 60 // 72 hours (matches magic link expiry)
				});
				return addSecurityHeaders(await resolve(event), path);
			}
		}

		// Invalid or expired token — still resolve (page will show error)
		return addSecurityHeaders(await resolve(event), path);
	}

	// API health, Stripe webhook (no auth needed)
	if (path === '/api/health' || path === '/api/stripe/webhook') {
		return addSecurityHeaders(await resolve(event), path);
	}

	// Branding logo: GET is public (client portal), POST/DELETE need auth (handled below)
	if (path === '/api/branding/logo' && event.request.method === 'GET') {
		return addSecurityHeaders(await resolve(event), path);
	}

	// Public API v1 — API key authentication
	if (path.startsWith('/api/v1/')) {
		if (dev) {
			// Dev mode: mock API key
			event.locals.apiKey = { id: 'dev-api-key', workspaceId: 'dev-workspace' };
			return addSecurityHeaders(await resolve(event), path);
		}

		const db = event.platform?.env?.DB;
		const kv = event.platform?.env?.SESSIONS;
		if (!db || !kv) {
			return new Response(JSON.stringify({ error: { message: 'Service unavailable' } }), {
				status: 503,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const authHeader = event.request.headers.get('Authorization');
		if (!authHeader?.startsWith('Bearer cr_live_')) {
			return new Response(JSON.stringify({ error: { message: 'Missing or invalid API key. Use Authorization: Bearer cr_live_...' } }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const apiKeyPlaintext = authHeader.slice(7); // Remove "Bearer "
		const { hashApiKey, getWorkspaceByApiKeyHash, updateApiKeyLastUsed } = await import('$lib/server/db/api-keys');
		const keyHash = await hashApiKey(apiKeyPlaintext);
		const keyInfo = await getWorkspaceByApiKeyHash(db, keyHash);

		if (!keyInfo) {
			return new Response(JSON.stringify({ error: { message: 'Invalid or revoked API key' } }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		// Rate limiting
		const { checkApiRateLimit } = await import('$lib/server/rate-limit');
		const rateCheck = await checkApiRateLimit(kv, keyInfo.id);
		if (!rateCheck.allowed) {
			return new Response(JSON.stringify({ error: { message: 'Rate limit exceeded', code: 'rate_limited' } }), {
				status: 429,
				headers: {
					'Content-Type': 'application/json',
					'Retry-After': String(rateCheck.retryAfterSeconds || 60)
				}
			});
		}

		event.locals.apiKey = { id: keyInfo.id, workspaceId: keyInfo.workspaceId };

		// Update last_used_at in the background
		if (event.platform?.context) {
			event.platform.context.waitUntil(updateApiKeyLastUsed(db, keyInfo.id));
		}

		return addSecurityHeaders(await resolve(event), path);
	}

	// In dev mode, create a mock user for /app and /api routes (no KV available)
	if (dev && (path.startsWith('/app') || path.startsWith('/api/'))) {
		event.locals.user = {
			id: 'dev-user',
			email: 'dev@collectrelay.com',
			name: 'Dev User',
			workspaceId: 'dev-workspace',
			role: 'owner'
		};
		return addSecurityHeaders(await resolve(event), path);
	}

	// API routes: try to load user session but don't redirect (endpoints return proper JSON errors)
	if (path.startsWith('/api/')) {
		// Check for pro user session
		const sessionId = event.cookies.get('session');
		if (sessionId && event.platform?.env?.SESSIONS) {
			const session = await validateSession(event.platform.env, sessionId);
			if (session) {
				const user = await getUserById(event.platform.env.DB, session.userId);
				if (user) {
					const workspace = await getWorkspaceForUser(event.platform.env.DB, user.id);
					event.locals.user = {
						id: user.id,
						email: user.email,
						name: user.name,
						workspaceId: workspace?.id || '',
						role: workspace?.role || 'member'
					};
				}
			}
		}

		// Check for client session (from magic link cookie) — enables client uploads & notifications
		// Always check even if pro session exists, so both can coexist (pro auth + client context)
		const clientToken = event.cookies.get('client_token');
		if (dev && clientToken) {
			// Dev mode: resolve token via demo map or DB lookup (same as /c/ path)
			const demoMap: Record<string, string> = {
				'meridian': 'txn-con-1', 'henderson': 'txn-con-2', 'willowbrook': 'txn-con-3',
				'patel': 'txn-con-4', 'lincoln': 'txn-con-5', 'rivera': 'txn-con-6',
				'oakridge': 'txn-con-7', 'baxter': 'txn-con-8'
			};
			const txnId = demoMap[clientToken] || 'txn-con-1';
			const db = event.platform?.env?.DB;
			if (db) {
				const row = await db.prepare('SELECT id, client_email, client_name FROM transactions WHERE id = ?').bind(txnId).first();
				if (row) {
					event.locals.clientSession = {
						transactionId: row.id as string,
						clientEmail: row.client_email as string,
						clientName: row.client_name as string,
						token: clientToken
					};
				}
			}
		} else if (clientToken && event.platform?.env?.MAGIC_LINKS) {
			const { validateMagicLink } = await import('$lib/server/magic-links');
			const clientSession = await validateMagicLink(event.platform.env, clientToken);
			if (clientSession) {
				event.locals.clientSession = {
					transactionId: clientSession.transactionId,
					clientEmail: clientSession.clientEmail,
					clientName: clientSession.clientName,
					token: clientToken
				};
			}
		}

		// Always resolve — endpoints handle their own auth (return 401 JSON, not redirects)
		return addSecurityHeaders(await resolve(event), path);
	}

	// All /app/ routes require Pro auth — redirect to login if not authenticated
	if (path.startsWith('/app')) {
		const sessionId = event.cookies.get('session');
		if (!sessionId || !event.platform?.env?.SESSIONS) {
			throw redirect(303, '/login');
		}

		const session = await validateSession(event.platform.env, sessionId);
		if (!session) {
			event.cookies.delete('session', { path: '/' });
			throw redirect(303, '/login');
		}

		// Load user from D1
		const user = await getUserById(event.platform.env.DB, session.userId);
		if (!user || (user as any).disabled_at) {
			event.cookies.delete('session', { path: '/' });
			throw redirect(303, '/login');
		}

		const workspace = await getWorkspaceForUser(event.platform.env.DB, user.id);
		event.locals.user = {
			id: user.id,
			email: user.email,
			name: user.name,
			workspaceId: workspace?.id || '',
			role: workspace?.role || 'member'
		};

		// Onboarding redirect — new users must complete onboarding first
		if (workspace?.id && event.platform.env.DB) {
			const onboarded = await isOnboardingComplete(event.platform.env.DB, workspace.id);
			if (!onboarded && !path.startsWith('/app/onboarding')) {
				throw redirect(303, '/app/onboarding');
			}
			if (onboarded && path === '/app/onboarding') {
				throw redirect(303, '/app');
			}
		}

		return addSecurityHeaders(await resolve(event), path);
	}

	// Default: resolve
	return addSecurityHeaders(await resolve(event), path);
};

function addSecurityHeaders(response: Response, path: string): Response {
	// Allow same-origin framing for file previews (PDFs/images in iframe),
	// but deny framing for everything else to prevent clickjacking
	const isFileRoute = path.startsWith('/api/files/');
	response.headers.set('X-Frame-Options', isFileRoute ? 'SAMEORIGIN' : 'DENY');
	// Prevent MIME-type sniffing
	response.headers.set('X-Content-Type-Options', 'nosniff');
	// Control referrer information
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	// Force HTTPS for 1 year, include subdomains
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
	// Content Security Policy — restrict script/style/connect sources
	// File routes need frame-ancestors 'self' so our preview modal can iframe them
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob:",
			"font-src 'self'",
			"worker-src 'self'",
			"connect-src 'self' https://api.resend.com https://api.stripe.com https://api.twilio.com https://*.push.services.mozilla.com https://fcm.googleapis.com https://*.notify.windows.com",
			isFileRoute ? "frame-ancestors 'self'" : "frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self' https://checkout.stripe.com"
		].join('; ')
	);
	// Restrict browser features
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), payment=()'
	);
	// Legacy XSS protection for older browsers
	response.headers.set('X-XSS-Protection', '1; mode=block');
	return response;
}
