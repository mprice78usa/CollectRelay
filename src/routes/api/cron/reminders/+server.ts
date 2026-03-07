import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
    const db = platform?.env?.DB;
    if (!db) throw error(503, 'Database not available');

    try {
        // Find transactions needing reminders:
        // - status = 'active'
        // - reminder_enabled = 1
        // - has outstanding (pending/rejected) items
        // - last_reminder_at is null or older than reminder_interval_days
        const transactions = await db.prepare(
            `SELECT t.id, t.title, t.client_name, t.client_email, t.client_phone,
                    t.reminder_interval_days, t.last_reminder_at,
                    u.name as pro_name, u.email as pro_email
             FROM transactions t
             JOIN users u ON t.created_by = u.id
             WHERE t.status = 'active'
               AND t.reminder_enabled = 1
               AND EXISTS (
                   SELECT 1 FROM checklist_items ci
                   WHERE ci.transaction_id = t.id
                     AND ci.status IN ('pending', 'rejected')
               )
               AND (
                   t.last_reminder_at IS NULL
                   OR datetime(t.last_reminder_at, '+' || t.reminder_interval_days || ' days') <= datetime('now')
               )`
        ).all();

        let sentCount = 0;
        for (const txn of transactions.results as any[]) {
            try {
                if (platform?.env?.MAGIC_LINKS) {
                    const { generateMagicLink } = await import('$lib/server/magic-links');
                    const token = await generateMagicLink(platform.env, {
                        transactionId: txn.id,
                        clientEmail: txn.client_email,
                        clientName: txn.client_name
                    });

                    const appUrl = platform.env.APP_URL || url.origin;
                    const magicLinkUrl = `${appUrl}/c/${token}`;

                    const { sendReminderEmail } = await import('$lib/server/email');
                    await sendReminderEmail(platform.env, {
                        to: txn.client_email,
                        clientName: txn.client_name,
                        proName: txn.pro_name,
                        transactionTitle: txn.title,
                        magicLinkUrl
                    });

                    // Send SMS if client has phone number
                    if (txn.client_phone) {
                        const { sendReminderSms } = await import('$lib/server/sms');
                        await sendReminderSms(platform.env, {
                            to: txn.client_phone,
                            proName: txn.pro_name,
                            transactionTitle: txn.title,
                            magicLinkUrl
                        });
                    }

                    // Update last_reminder_at
                    await db.prepare(
                        "UPDATE transactions SET last_reminder_at = datetime('now') WHERE id = ?"
                    ).bind(txn.id).run();

                    sentCount++;
                }
            } catch (err) {
                console.error(`Failed to send reminder for txn ${txn.id}:`, err);
            }
        }

        return json({ success: true, reminders_sent: sentCount });
    } catch (err) {
        console.error('Reminder cron failed:', err);
        throw error(500, 'Reminder cron failed');
    }
};
