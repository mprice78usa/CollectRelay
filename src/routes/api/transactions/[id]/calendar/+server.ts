import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTransactionById } from '$lib/server/db/transactions';
import { getMilestonesForTransaction } from '$lib/server/db/milestones';
import { generateIcsEvent, generateIcsCalendar } from '$lib/server/ics';

export const GET: RequestHandler = async ({ params, locals, platform, url }) => {
	const db = platform?.env?.DB;
	const user = locals.user;
	if (!db || !user?.workspaceId) throw error(401, 'Unauthorized');

	const transaction = await getTransactionById(db, params.id, user.workspaceId);
	if (!transaction) throw error(404, 'Transaction not found');

	const milestoneId = url.searchParams.get('milestone');
	const milestones = await getMilestonesForTransaction(db, params.id);

	let icsContent: string;
	let filename: string;

	if (milestoneId) {
		// Single milestone
		const milestone = milestones.find(m => m.id === milestoneId);
		if (!milestone || !milestone.date) throw error(404, 'Milestone not found or has no date');

		icsContent = generateIcsEvent({
			uid: `milestone-${milestone.id}`,
			summary: `${milestone.label} — ${transaction.title}`,
			date: milestone.date,
			description: `Key date for ${transaction.title} (${transaction.client_name})`
		});
		filename = `${milestone.label.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
	} else {
		// All milestones + due date
		const events = milestones
			.filter(m => m.date)
			.map(m => ({
				uid: `milestone-${m.id}`,
				summary: `${m.label} — ${transaction.title}`,
				date: m.date!,
				description: `Key date for ${transaction.title} (${transaction.client_name})`
			}));

		// Add due date if exists
		if (transaction.due_date) {
			events.push({
				uid: `due-${transaction.id}`,
				summary: `Due Date — ${transaction.title}`,
				date: transaction.due_date,
				description: `Documents due for ${transaction.title} (${transaction.client_name})`
			});
		}

		if (events.length === 0) throw error(400, 'No dates to export');

		icsContent = generateIcsCalendar(events);
		filename = `${transaction.title.replace(/[^a-zA-Z0-9]/g, '_')}_dates.ics`;
	}

	return new Response(icsContent, {
		headers: {
			'Content-Type': 'text/calendar; charset=utf-8',
			'Content-Disposition': `attachment; filename="${filename}"`
		}
	});
};
