import { dev } from '$app/environment';
import { redirect, type Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';
import { getUserById, getWorkspaceForUser } from '$lib/server/db/users';

const PUBLIC_PATHS = ['/', '/login', '/register', '/api/health', '/pricing', '/checkout/success', '/checkout/cancel'];
const CLIENT_PATH_PREFIX = '/c/';
const PARTNER_PATH_PREFIX = '/p/';

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Initialize locals
	event.locals.user = null;
	event.locals.clientSession = null;

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
			// Dev mode: mock client session
			event.locals.clientSession = {
				transactionId: 'mock-txn-1',
				clientEmail: 'sarah@example.com',
				clientName: 'Sarah Johnson',
				token
			};
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

	// API health + Stripe webhook (no auth needed, Stripe signs these)
	if (path === '/api/health' || path === '/api/stripe/webhook') {
		return resolve(event);
	}

	// In dev mode, create a mock user for /app and /api routes (no KV available)
	if (dev && (path.startsWith('/app') || path.startsWith('/api/'))) {
		event.locals.user = {
			id: 'dev-user',
			email: 'dev@collectrelay.com',
			name: 'Dev User',
			workspaceId: 'dev-workspace'
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
						workspaceId: workspace?.id || ''
					};
				}
			}
		}

		// Check for client session (from magic link cookie) — enables client uploads & notifications
		// Always check even if pro session exists, so both can coexist (pro auth + client context)
		const clientToken = event.cookies.get('client_token');
		if (clientToken && event.platform?.env?.MAGIC_LINKS) {
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
			workspaceId: workspace?.id || ''
		};

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
			"connect-src 'self' https://api.resend.com https://api.stripe.com https://api.twilio.com",
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
