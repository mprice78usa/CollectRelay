/** Authentication helpers — PBKDF2 password hashing + KV session management */

const PBKDF2_ITERATIONS = 100_000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 32;

function bufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

function hexToBuffer(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

export async function hashPassword(
	password: string,
	existingSalt?: string
): Promise<{ hash: string; salt: string }> {
	const encoder = new TextEncoder();
	const salt = existingSalt
		? hexToBuffer(existingSalt)
		: crypto.getRandomValues(new Uint8Array(SALT_LENGTH));

	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(password),
		'PBKDF2',
		false,
		['deriveBits']
	);

	const derivedBits = await crypto.subtle.deriveBits(
		{
			name: 'PBKDF2',
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: 'SHA-256'
		},
		keyMaterial,
		HASH_LENGTH * 8
	);

	return {
		hash: bufferToHex(derivedBits),
		salt: bufferToHex(salt.buffer as ArrayBuffer)
	};
}

export async function verifyPassword(
	password: string,
	storedHash: string,
	storedSalt: string
): Promise<boolean> {
	const { hash } = await hashPassword(password, storedSalt);
	return hash === storedHash;
}

// --- Session management ---

interface SessionData {
	userId: string;
	created: string;
	ip?: string;
}

export async function createSession(
	env: App.Platform['env'],
	userId: string,
	ip?: string
): Promise<string> {
	const sessionId = crypto.randomUUID();
	const data: SessionData = {
		userId,
		created: new Date().toISOString(),
		ip
	};
	await env.SESSIONS.put(`session_${sessionId}`, JSON.stringify(data), {
		expirationTtl: 604800 // 7 days
	});
	return sessionId;
}

export async function validateSession(
	env: App.Platform['env'],
	sessionId: string
): Promise<SessionData | null> {
	const raw = await env.SESSIONS.get(`session_${sessionId}`);
	if (!raw) return null;
	return JSON.parse(raw) as SessionData;
}

export async function deleteSession(
	env: App.Platform['env'],
	sessionId: string
): Promise<void> {
	await env.SESSIONS.delete(`session_${sessionId}`);
}

export function generateId(): string {
	return crypto.randomUUID().replace(/-/g, '');
}
