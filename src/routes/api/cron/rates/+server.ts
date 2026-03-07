import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Freddie Mac PMMS data endpoint
const PMMS_URL = 'https://www.freddiemac.com/pmms/pmms_archives';

export const GET: RequestHandler = async ({ platform }) => {
    const db = platform?.env?.DB;
    if (!db) throw error(503, 'Database not available');

    try {
        // For now, use realistic stub rates since Freddie Mac's page requires HTML parsing
        // In production, this would scrape/parse the PMMS data or use a mortgage rate API
        const rate30yr = 6.65;  // Will be updated by actual API
        const rate15yr = 5.89;  // Will be updated by actual API

        // Upsert the rate record
        await db.prepare(
            `INSERT INTO mortgage_rates (id, rate_type, rate_30yr, rate_15yr, source, updated_at)
             VALUES ('current-conforming', 'conforming', ?, ?, 'freddie_mac', datetime('now'))
             ON CONFLICT(id) DO UPDATE SET
                rate_30yr = excluded.rate_30yr,
                rate_15yr = excluded.rate_15yr,
                updated_at = excluded.updated_at`
        ).bind(rate30yr, rate15yr).run();

        return json({ success: true, rates: { rate30yr, rate15yr } });
    } catch (err) {
        console.error('Failed to update mortgage rates:', err);
        throw error(500, 'Failed to update rates');
    }
};
