/** Email sending via Resend API */
import { escapeHtml } from '$lib/server/sanitize';

/** Extract bare email address from formats like "Name <email>" or plain "email" */
function extractEmail(from: string): string {
	const match = from.match(/<(.+)>/);
	return match ? match[1] : from.trim();
}

interface SendMagicLinkEmailParams {
	to: string;
	clientName: string;
	proName: string;
	transactionTitle: string;
	magicLinkUrl: string;
}

export async function sendMagicLinkEmail(
	env: App.Platform['env'],
	params: SendMagicLinkEmailParams
): Promise<boolean> {
	const apiKey = env.EMAIL_API_KEY;
	const from = env.EMAIL_FROM;

	if (!apiKey || !from) {
		// Dev mode: log to console
		console.log('--- MAGIC LINK EMAIL (dev mode) ---');
		console.log(`To: ${params.to}`);
		console.log(`From: ${params.proName} via CollectRelay`);
		console.log(`Subject: ${params.proName} needs documents from you`);
		console.log(`Link: ${params.magicLinkUrl}`);
		console.log('-----------------------------------');
		return true;
	}

	const bareEmail = extractEmail(from);
	const safeProName = escapeHtml(params.proName);
	const safeTitle = escapeHtml(params.transactionTitle);
	const safeUrl = escapeHtml(params.magicLinkUrl);

	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 20px; margin: 0 0 8px; color: #18181b;">Documents Requested</h1>
    <p style="color: #71717a; margin: 0 0 24px; font-size: 15px;">
      ${safeProName} has requested documents from you for:
    </p>
    <div style="background: #f4f4f5; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <strong style="color: #18181b;">${safeTitle}</strong>
    </div>
    <p style="color: #71717a; font-size: 14px; margin: 0 0 24px;">
      Click the button below to view and upload your documents. This link expires in 72 hours.
    </p>
    <a href="${safeUrl}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px;">
      View &amp; Upload Documents
    </a>
    <p style="color: #a1a1aa; font-size: 12px; margin: 32px 0 0;">
      If you didn't expect this email, you can safely ignore it.
    </p>
  </div>
</body>
</html>`;

	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				from: `${params.proName} via CollectRelay <${bareEmail}>`,
				to: [params.to],
				subject: `${params.proName} needs documents from you`,
				html
			})
		});

		if (!response.ok) {
			const errBody = await response.text().catch(() => 'unknown');
			console.error(`Magic link email failed (${response.status}): ${errBody}`);
		}
		return response.ok;
	} catch (err) {
		console.error('Failed to send email:', err);
		return false;
	}
}

// --- Notification Emails ---

async function sendNotificationEmail(
	env: App.Platform['env'],
	params: { to: string; subject: string; heading: string; body: string; ctaText?: string; ctaUrl?: string; fromName?: string }
): Promise<boolean> {
	const apiKey = env.EMAIL_API_KEY;
	const from = env.EMAIL_FROM;

	if (!apiKey || !from) {
		console.log(`--- EMAIL NOTIFICATION (dev mode) ---`);
		console.log(`To: ${params.to}`);
		console.log(`From: ${params.fromName ? `${params.fromName} via CollectRelay` : 'CollectRelay'}`);
		console.log(`Subject: ${params.subject}`);
		console.log(`Body: ${params.body}`);
		if (params.ctaUrl) console.log(`CTA: ${params.ctaText} → ${params.ctaUrl}`);
		console.log('-------------------------------------');
		return true;
	}

	const bareEmail = extractEmail(from);
	const fromField = params.fromName
		? `${params.fromName} via CollectRelay <${bareEmail}>`
		: `CollectRelay <${bareEmail}>`;

	const safeCtaUrl = params.ctaUrl ? escapeHtml(params.ctaUrl) : '';
	const safeCtaText = escapeHtml(params.ctaText || 'View Details');
	const ctaBlock = params.ctaUrl
		? `<a href="${safeCtaUrl}" style="display: inline-block; background: #10b981; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin-top: 16px;">${safeCtaText}</a>`
		: '';

	const safeHeading = escapeHtml(params.heading);

	const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="font-size: 20px; margin: 0 0 16px; color: #18181b;">${safeHeading}</h1>
    <p style="color: #52525b; margin: 0 0 24px; font-size: 15px; line-height: 1.5;">${params.body}</p>
    ${ctaBlock}
    <p style="color: #a1a1aa; font-size: 12px; margin: 32px 0 0;">Sent by CollectRelay</p>
  </div>
</body>
</html>`;

	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
			body: JSON.stringify({ from: fromField, to: [params.to], subject: params.subject, html })
		});
		if (!response.ok) {
			const errBody = await response.text().catch(() => 'unknown');
			console.error(`Notification email failed (${response.status}) to=${params.to}: ${errBody}`);
		}
		return response.ok;
	} catch (err) {
		console.error('Failed to send notification email:', err);
		return false;
	}
}

export async function sendSubmissionNotification(
	env: App.Platform['env'],
	params: { proEmail: string; proName?: string; clientName: string; transactionTitle: string; itemName: string; appUrl: string; transactionId: string }
): Promise<boolean> {
	const name = escapeHtml(params.clientName);
	const item = escapeHtml(params.itemName);
	const title = escapeHtml(params.transactionTitle);
	return sendNotificationEmail(env, {
		to: params.proEmail,
		subject: `${params.clientName} submitted "${params.itemName}"`,
		heading: 'New Submission',
		body: `${name} submitted <strong>${item}</strong> for <strong>${title}</strong>. Review it now to keep things moving.`,
		ctaText: 'Review Submission',
		ctaUrl: `${params.appUrl}/app/transactions/${params.transactionId}`,
		fromName: params.clientName
	});
}

export async function sendReviewNotification(
	env: App.Platform['env'],
	params: { clientEmail: string; proName: string; transactionTitle: string; itemName: string; action: string; reviewNote?: string; magicLinkUrl?: string }
): Promise<boolean> {
	const actionText = params.action === 'accepted' ? 'approved' : params.action === 'rejected' ? 'requested changes on' : 'waived';
	const name = escapeHtml(params.proName);
	const item = escapeHtml(params.itemName);
	const title = escapeHtml(params.transactionTitle);
	const noteText = params.reviewNote ? `<br><br><strong>Note:</strong> ${escapeHtml(params.reviewNote)}` : '';
	return sendNotificationEmail(env, {
		to: params.clientEmail,
		subject: `Update on "${params.itemName}" — ${params.transactionTitle}`,
		heading: 'Item Reviewed',
		body: `${name} ${actionText} <strong>${item}</strong> for <strong>${title}</strong>.${noteText}`,
		ctaText: 'View Details',
		ctaUrl: params.magicLinkUrl,
		fromName: params.proName
	});
}

export async function sendCommentNotification(
	env: App.Platform['env'],
	params: { to: string; authorName: string; authorType?: string; transactionTitle: string; itemName?: string; comment: string; ctaUrl?: string }
): Promise<boolean> {
	const author = escapeHtml(params.authorName);
	const title = escapeHtml(params.transactionTitle);
	const comment = escapeHtml(params.comment);
	const onItem = params.itemName ? ` on <strong>${escapeHtml(params.itemName)}</strong>` : '';
	return sendNotificationEmail(env, {
		to: params.to,
		subject: `New comment from ${params.authorName} — ${params.transactionTitle}`,
		heading: 'New Comment',
		body: `${author} commented${onItem} for <strong>${title}</strong>:<br><br><div style="background: #f4f4f5; padding: 12px 16px; border-radius: 8px; font-style: italic;">"${comment}"</div>`,
		ctaText: 'View & Reply',
		ctaUrl: params.ctaUrl,
		fromName: params.authorType === 'pro' ? params.authorName : undefined
	});
}

// --- Reminder Emails ---

interface SendReminderEmailParams {
	to: string;
	clientName: string;
	proName: string;
	transactionTitle: string;
	magicLinkUrl: string;
}

export async function sendReminderEmail(
	env: App.Platform['env'],
	params: SendReminderEmailParams
): Promise<boolean> {
	const name = escapeHtml(params.clientName);
	const pro = escapeHtml(params.proName);
	const title = escapeHtml(params.transactionTitle);
	return sendNotificationEmail(env, {
		to: params.to,
		subject: `Reminder: Outstanding items for ${params.transactionTitle}`,
		heading: 'Friendly Reminder',
		body: `Hi ${name},<br><br>This is a friendly reminder from ${pro} that you have outstanding items to complete for <strong>${title}</strong>.<br><br>Click below to access your portal and submit your remaining documents.`,
		ctaText: 'Complete Your Items',
		ctaUrl: params.magicLinkUrl,
		fromName: params.proName
	});
}

// --- Partner Portal Emails ---

export async function sendPartnerInviteEmail(
	env: App.Platform['env'],
	params: { to: string; partnerName: string; proName: string; transactionTitle: string; partnerType: string; portalUrl: string }
): Promise<boolean> {
	const name = escapeHtml(params.partnerName);
	const pro = escapeHtml(params.proName);
	const title = escapeHtml(params.transactionTitle);
	const type = escapeHtml(params.partnerType);
	return sendNotificationEmail(env, {
		to: params.to,
		subject: `${params.proName} shared a transaction with you — ${params.transactionTitle}`,
		heading: 'Partner Portal Access',
		body: `Hi ${name},<br><br>${pro} has shared read-only access to <strong>${title}</strong> with you as a <strong>${type}</strong> partner.<br><br>You can view the transaction progress, checklist status, and key dates through your partner portal. This link expires in 30 days.`,
		ctaText: 'View Transaction',
		ctaUrl: params.portalUrl,
		fromName: params.proName
	});
}
