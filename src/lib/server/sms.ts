/** SMS sending via Twilio REST API (Workers-compatible, no SDK) */

interface TwilioEnv {
	TWILIO_ACCOUNT_SID?: string;
	TWILIO_AUTH_TOKEN?: string;
	TWILIO_PHONE_NUMBER?: string;
}

interface SendSmsParams {
	to: string;
	body: string;
}

/**
 * Send an SMS via Twilio REST API.
 * In dev mode (no credentials), logs to console.
 */
export async function sendSms(
	env: TwilioEnv,
	params: SendSmsParams
): Promise<boolean> {
	const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = env;

	if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
		console.log('--- SMS (dev mode) ---');
		console.log(`To: ${params.to}`);
		console.log(`Body: ${params.body}`);
		console.log('----------------------');
		return true;
	}

	try {
		const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
		const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

		const body = new URLSearchParams({
			To: params.to,
			From: TWILIO_PHONE_NUMBER,
			Body: params.body
		});

		const response = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Basic ${auth}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: body.toString()
		});

		if (!response.ok) {
			const errBody = await response.text().catch(() => 'unknown');
			console.error(`SMS send failed (${response.status}): ${errBody}`);
			return false;
		}

		return true;
	} catch (err) {
		console.error('Failed to send SMS:', err);
		return false;
	}
}

/**
 * Send a magic link SMS to a client.
 */
export async function sendMagicLinkSms(
	env: TwilioEnv,
	params: { to: string; proName: string; transactionTitle: string; magicLinkUrl: string }
): Promise<boolean> {
	const body = `${params.proName} has requested documents from you for "${params.transactionTitle}". Access your portal here: ${params.magicLinkUrl}`;
	return sendSms(env, { to: params.to, body });
}

/**
 * Send a reminder SMS to a client.
 */
export async function sendReminderSms(
	env: TwilioEnv,
	params: { to: string; proName: string; transactionTitle: string; magicLinkUrl: string }
): Promise<boolean> {
	const body = `Reminder from ${params.proName}: You have outstanding items for "${params.transactionTitle}". Complete them here: ${params.magicLinkUrl}`;
	return sendSms(env, { to: params.to, body });
}
