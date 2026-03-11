/**
 * Web Push notification sender using pure crypto.subtle (no npm deps).
 * Implements RFC 8291 (Message Encryption for Web Push) and RFC 8292 (VAPID).
 *
 * Works on Cloudflare Workers which support the Web Crypto API.
 */

export interface PushSubscriptionData {
	endpoint: string;
	p256dh: string; // base64url
	auth: string; // base64url
}

export interface VapidKeys {
	publicKey: string; // base64url-encoded uncompressed P-256 public key (65 bytes)
	privateKey: string; // base64url-encoded raw P-256 private key (32 bytes)
}

export interface PushResult {
	success: boolean;
	statusCode: number;
	gone: boolean; // true if 410 — subscription expired
}

// --- Base64url helpers ---

function base64urlEncode(buffer: ArrayBuffer | Uint8Array): string {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Uint8Array {
	const padded = str + '='.repeat((4 - (str.length % 4)) % 4);
	const binary = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return bytes;
}

// --- VAPID JWT ---

async function createVapidJwt(
	audience: string,
	subject: string,
	vapidPrivateKey: string
): Promise<string> {
	const header = { typ: 'JWT', alg: 'ES256' };
	const now = Math.floor(Date.now() / 1000);
	const payload = { aud: audience, exp: now + 12 * 3600, sub: subject };

	const encoder = new TextEncoder();
	const headerB64 = base64urlEncode(encoder.encode(JSON.stringify(header)));
	const payloadB64 = base64urlEncode(encoder.encode(JSON.stringify(payload)));
	const unsignedToken = `${headerB64}.${payloadB64}`;

	// Import private key for ECDSA signing
	const privateKeyBytes = base64urlDecode(vapidPrivateKey);
	const key = await crypto.subtle.importKey(
		'pkcs8',
		buildPkcs8(privateKeyBytes),
		{ name: 'ECDSA', namedCurve: 'P-256' },
		false,
		['sign']
	);

	const signature = await crypto.subtle.sign(
		{ name: 'ECDSA', hash: 'SHA-256' },
		key,
		encoder.encode(unsignedToken)
	);

	// Convert DER signature to raw r||s format (64 bytes)
	const rawSig = derToRaw(new Uint8Array(signature));
	const signatureB64 = base64urlEncode(rawSig);

	return `${unsignedToken}.${signatureB64}`;
}

/**
 * Build PKCS#8 wrapper around raw 32-byte P-256 private key.
 */
function buildPkcs8(rawKey: Uint8Array): ArrayBuffer {
	// PKCS#8 header for P-256 EC private key
	const header = new Uint8Array([
		0x30, 0x41, 0x02, 0x01, 0x00, 0x30, 0x13, 0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
		0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07, 0x04, 0x27, 0x30, 0x25,
		0x02, 0x01, 0x01, 0x04, 0x20
	]);
	const result = new Uint8Array(header.length + rawKey.length);
	result.set(header);
	result.set(rawKey, header.length);
	return result.buffer;
}

/**
 * Convert DER-encoded ECDSA signature to raw r||s (64 bytes).
 */
function derToRaw(der: Uint8Array): Uint8Array {
	// DER format: 0x30 <len> 0x02 <rlen> <r> 0x02 <slen> <s>
	const raw = new Uint8Array(64);

	let offset = 2; // skip 0x30 and total length
	// r
	offset += 1; // skip 0x02
	const rLen = der[offset++];
	const rStart = offset;
	offset += rLen;
	// s
	offset += 1; // skip 0x02
	const sLen = der[offset++];
	const sStart = offset;

	// Pad or trim r to 32 bytes
	if (rLen <= 32) {
		raw.set(der.slice(rStart, rStart + rLen), 32 - rLen);
	} else {
		// Leading zero padding — take last 32 bytes
		raw.set(der.slice(rStart + rLen - 32, rStart + rLen), 0);
	}

	// Pad or trim s to 32 bytes
	if (sLen <= 32) {
		raw.set(der.slice(sStart, sStart + sLen), 64 - sLen);
	} else {
		raw.set(der.slice(sStart + sLen - 32, sStart + sLen), 32);
	}

	return raw;
}

// --- RFC 8291 payload encryption ---

async function encryptPayload(
	payload: string,
	clientPublicKeyB64: string,
	clientAuthB64: string
): Promise<{ ciphertext: Uint8Array; serverPublicKey: Uint8Array; salt: Uint8Array }> {
	const encoder = new TextEncoder();

	// Generate ephemeral ECDH key pair
	const serverKeyPair = (await crypto.subtle.generateKey(
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		['deriveBits']
	)) as CryptoKeyPair;

	// Export server public key (uncompressed, 65 bytes)
	const serverPublicKeyRaw = new Uint8Array(
		await crypto.subtle.exportKey('raw', serverKeyPair.publicKey)
	);

	// Import client public key
	const clientPublicKeyBytes = base64urlDecode(clientPublicKeyB64);
	const clientPublicKey = await crypto.subtle.importKey(
		'raw',
		clientPublicKeyBytes,
		{ name: 'ECDH', namedCurve: 'P-256' },
		false,
		[]
	);

	// ECDH shared secret
	const sharedSecret = new Uint8Array(
		await crypto.subtle.deriveBits(
			{ name: 'ECDH', public: clientPublicKey },
			serverKeyPair.privateKey,
			256
		)
	);

	// Client auth secret
	const clientAuth = base64urlDecode(clientAuthB64);

	// Generate salt (16 bytes)
	const salt = crypto.getRandomValues(new Uint8Array(16));

	// HKDF extract: PRK = HMAC-SHA-256(clientAuth, sharedSecret)
	const authInfo = encoder.encode('WebPush: info\0');
	const keyInfoBuf = new Uint8Array(authInfo.length + clientPublicKeyBytes.length + serverPublicKeyRaw.length);
	keyInfoBuf.set(authInfo);
	keyInfoBuf.set(clientPublicKeyBytes, authInfo.length);
	keyInfoBuf.set(serverPublicKeyRaw, authInfo.length + clientPublicKeyBytes.length);

	// IKM = HKDF(clientAuth, sharedSecret, "WebPush: info\0" || client_public || server_public, 32)
	const ikm = await hkdf(clientAuth, sharedSecret, keyInfoBuf, 32);

	// Content encryption key: HKDF(salt, ikm, "Content-Encoding: aes128gcm\0", 16)
	const cekInfo = encoder.encode('Content-Encoding: aes128gcm\0');
	const cek = await hkdf(salt, ikm, cekInfo, 16);

	// Nonce: HKDF(salt, ikm, "Content-Encoding: nonce\0", 12)
	const nonceInfo = encoder.encode('Content-Encoding: nonce\0');
	const nonce = await hkdf(salt, ikm, nonceInfo, 12);

	// Pad and encrypt payload
	const payloadBytes = encoder.encode(payload);
	// Add padding delimiter (0x02) — required by aes128gcm
	const padded = new Uint8Array(payloadBytes.length + 1);
	padded.set(payloadBytes);
	padded[payloadBytes.length] = 2; // delimiter

	const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
	const encrypted = new Uint8Array(
		await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, padded)
	);

	// Build aes128gcm header: salt (16) + rs (4) + idlen (1) + keyid (65) + ciphertext
	const rs = encrypted.length + 86; // record size (header + content)
	const header = new Uint8Array(86);
	header.set(salt, 0);
	header[16] = (rs >>> 24) & 0xff;
	header[17] = (rs >>> 16) & 0xff;
	header[18] = (rs >>> 8) & 0xff;
	header[19] = rs & 0xff;
	header[20] = 65; // key id length (uncompressed P-256 point)
	header.set(serverPublicKeyRaw, 21);

	const body = new Uint8Array(header.length + encrypted.length);
	body.set(header);
	body.set(encrypted, header.length);

	return { ciphertext: body, serverPublicKey: serverPublicKeyRaw, salt };
}

/**
 * HKDF using crypto.subtle (extract + expand).
 */
async function hkdf(
	salt: Uint8Array,
	ikm: Uint8Array,
	info: Uint8Array,
	length: number
): Promise<Uint8Array> {
	// Extract
	const key = await crypto.subtle.importKey('raw', ikm, { name: 'HKDF' }, false, [
		'deriveBits'
	]);

	const bits = await crypto.subtle.deriveBits(
		{ name: 'HKDF', hash: 'SHA-256', salt, info },
		key,
		length * 8
	);

	return new Uint8Array(bits);
}

// --- Main send function ---

export async function sendPushNotification(
	subscription: PushSubscriptionData,
	payload: { title: string; body: string; url?: string; tag?: string },
	vapidKeys: VapidKeys
): Promise<PushResult> {
	const payloadJson = JSON.stringify(payload);

	// Encrypt payload
	const { ciphertext } = await encryptPayload(
		payloadJson,
		subscription.p256dh,
		subscription.auth
	);

	// Build VAPID Authorization header
	const endpoint = new URL(subscription.endpoint);
	const audience = `${endpoint.protocol}//${endpoint.host}`;
	const jwt = await createVapidJwt(audience, 'mailto:noreply@collectrelay.com', vapidKeys.privateKey);

	const response = await fetch(subscription.endpoint, {
		method: 'POST',
		headers: {
			Authorization: `vapid t=${jwt},k=${vapidKeys.publicKey}`,
			'Content-Encoding': 'aes128gcm',
			'Content-Type': 'application/octet-stream',
			TTL: '86400'
		},
		body: ciphertext
	});

	return {
		success: response.status >= 200 && response.status < 300,
		statusCode: response.status,
		gone: response.status === 410
	};
}
