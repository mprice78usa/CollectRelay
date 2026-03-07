/** Business day calculation utility (skips Saturday and Sunday) */

/**
 * Add business days to a date (skips Sat/Sun).
 */
export function addBusinessDays(start: Date, days: number): Date {
	const result = new Date(start);
	let added = 0;
	const direction = days >= 0 ? 1 : -1;
	const absDays = Math.abs(days);

	while (added < absDays) {
		result.setDate(result.getDate() + direction);
		const dow = result.getDay();
		if (dow !== 0 && dow !== 6) {
			added++;
		}
	}

	return result;
}

/**
 * Format a Date as YYYY-MM-DD string.
 */
export function formatDateISO(date: Date): string {
	return date.toISOString().split('T')[0];
}
