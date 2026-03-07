/** ICS calendar file generation (RFC 5545) */

interface IcsEvent {
	uid: string;
	summary: string;
	date: string; // YYYY-MM-DD
	description?: string;
	location?: string;
}

/**
 * Escape special characters for ICS format.
 */
function escapeIcs(text: string): string {
	return text
		.replace(/\\/g, '\\\\')
		.replace(/;/g, '\\;')
		.replace(/,/g, '\\,')
		.replace(/\n/g, '\\n');
}

/**
 * Format a date string (YYYY-MM-DD) as ICS all-day date (YYYYMMDD).
 */
function toIcsDate(dateStr: string): string {
	return dateStr.replace(/-/g, '');
}

/**
 * Get the next day in YYYYMMDD format (for DTEND of all-day events).
 */
function nextDay(dateStr: string): string {
	const d = new Date(dateStr + 'T12:00:00');
	d.setDate(d.getDate() + 1);
	return d.toISOString().split('T')[0].replace(/-/g, '');
}

/**
 * Generate a single ICS event.
 */
export function generateIcsEvent(event: IcsEvent): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//CollectRelay//Calendar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'BEGIN:VEVENT',
		`UID:${event.uid}@collectrelay.com`,
		`DTSTART;VALUE=DATE:${toIcsDate(event.date)}`,
		`DTEND;VALUE=DATE:${nextDay(event.date)}`,
		`SUMMARY:${escapeIcs(event.summary)}`,
		`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`
	];

	if (event.description) {
		lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
	}
	if (event.location) {
		lines.push(`LOCATION:${escapeIcs(event.location)}`);
	}

	lines.push('END:VEVENT', 'END:VCALENDAR');
	return lines.join('\r\n');
}

/**
 * Generate an ICS calendar with multiple events.
 */
export function generateIcsCalendar(events: IcsEvent[]): string {
	const lines = [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//CollectRelay//Calendar//EN',
		'CALSCALE:GREGORIAN',
		'METHOD:PUBLISH',
		'X-WR-CALNAME:CollectRelay Key Dates'
	];

	for (const event of events) {
		lines.push(
			'BEGIN:VEVENT',
			`UID:${event.uid}@collectrelay.com`,
			`DTSTART;VALUE=DATE:${toIcsDate(event.date)}`,
			`DTEND;VALUE=DATE:${nextDay(event.date)}`,
			`SUMMARY:${escapeIcs(event.summary)}`,
			`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`
		);

		if (event.description) {
			lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
		}
		if (event.location) {
			lines.push(`LOCATION:${escapeIcs(event.location)}`);
		}

		lines.push('END:VEVENT');
	}

	lines.push('END:VCALENDAR');
	return lines.join('\r\n');
}
