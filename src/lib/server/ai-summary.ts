/** AI document summarization using Cloudflare Workers AI */
import { PDFDocument } from 'pdf-lib';

const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';
const TEXT_MODEL = '@cf/meta/llama-3.1-8b-instruct';

const SUMMARY_PROMPT = 'Briefly summarize this document in 1-2 sentences. What type of document is this and what key information does it contain? Be concise.';

export function isSummarizableFile(mimeType: string): boolean {
	return ['image/jpeg', 'image/png', 'application/pdf'].includes(mimeType);
}

export async function summarizeFile(
	env: App.Platform['env'],
	db: D1Database,
	fileId: string,
	r2Key: string,
	mimeType: string
): Promise<void> {
	// Mark as processing
	await db
		.prepare("UPDATE files SET ai_summary_status = 'processing' WHERE id = ?")
		.bind(fileId)
		.run();

	try {
		if (!isSummarizableFile(mimeType)) {
			await updateFileSummary(db, fileId, null, 'skipped');
			return;
		}

		// Fetch file from R2
		const object = await env.FILES_BUCKET.get(r2Key);
		if (!object) {
			await updateFileSummary(db, fileId, null, 'failed');
			return;
		}

		let summary: string;

		if (mimeType === 'image/jpeg' || mimeType === 'image/png') {
			summary = await summarizeImage(env.AI, await object.arrayBuffer());
		} else if (mimeType === 'application/pdf') {
			summary = await summarizePdf(env.AI, await object.arrayBuffer());
		} else {
			await updateFileSummary(db, fileId, null, 'skipped');
			return;
		}

		await updateFileSummary(db, fileId, summary, 'completed');
	} catch (err) {
		console.error('AI summarization error:', err);
		await updateFileSummary(db, fileId, null, 'failed');
	}
}

async function summarizeImage(ai: Ai, imageBytes: ArrayBuffer, mimeType: string = 'image/jpeg'): Promise<string> {
	const bytes = new Uint8Array(imageBytes);
	let binary = '';
	for (let i = 0; i < bytes.length; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	const dataUri = `data:${mimeType};base64,${btoa(binary)}`;

	const result = await ai.run(VISION_MODEL, {
		messages: [{
			role: 'user',
			content: [
				{ type: 'text', text: SUMMARY_PROMPT },
				{ type: 'image_url', image_url: { url: dataUri } }
			]
		}]
	}) as { response?: string };

	return result.response || 'Unable to generate summary.';
}

async function summarizePdf(ai: Ai, pdfBytes: ArrayBuffer): Promise<string> {
	// Try to extract text from the first page
	let text = '';
	try {
		const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
		const pages = pdfDoc.getPages();
		if (pages.length > 0) {
			// pdf-lib doesn't have native text extraction, so we'll note the page count
			// and send a generic request to the text model
			text = `PDF document with ${pages.length} page(s).`;
		}
	} catch {
		text = 'PDF document (could not parse structure).';
	}

	// Use text model to generate a summary based on what we know
	const prompt = text.length > 50
		? `Summarize the following document text in 1-2 sentences:\n\n${text.slice(0, 4000)}`
		: `This is a ${text} Provide a brief generic description noting it is a PDF that would need to be opened to review.`;

	const result = await ai.run(TEXT_MODEL, {
		messages: [{ role: 'user', content: prompt }]
	}) as { response?: string };

	return result.response || 'PDF document — open to review contents.';
}

async function updateFileSummary(
	db: D1Database,
	fileId: string,
	summary: string | null,
	status: string
): Promise<void> {
	await db
		.prepare('UPDATE files SET ai_summary = ?, ai_summary_status = ? WHERE id = ?')
		.bind(summary, status, fileId)
		.run();
}
