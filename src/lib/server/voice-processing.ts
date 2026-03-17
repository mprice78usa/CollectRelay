/** Voice-to-Task AI processing: Whisper transcription + Claude task extraction */

const WHISPER_MODEL = '@cf/openai/whisper';

const SYSTEM_PROMPT = `You are a construction project assistant for CollectRelay. Your job is to extract structured, actionable information from voice memos recorded by contractors in the field.

Analyze the transcript and extract:
1. A brief summary (1-2 sentences)
2. Any new tasks or action items mentioned
3. Any blockers or issues that need attention
4. Status updates on existing work

For each task, assign a priority: High, Medium, or Low.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief summary of the voice memo",
  "new_actions": [
    { "task": "Description of the task", "priority": "High" }
  ],
  "blockers": ["Description of any blocker"],
  "status_update": "Any progress update mentioned, or null"
}

If no tasks, blockers, or status updates are found, use empty arrays and null respectively.
Do NOT include any text outside the JSON object.`;

export interface AIActions {
	summary: string;
	new_actions: Array<{ task: string; priority: string }>;
	blockers: string[];
	status_update: string | null;
}

/**
 * Transcribe audio using Cloudflare Workers AI (Whisper)
 */
export async function transcribeAudio(
	ai: Ai,
	audioBytes: ArrayBuffer
): Promise<string> {
	const result = await ai.run(WHISPER_MODEL, {
		audio: [...new Uint8Array(audioBytes)]
	}) as { text?: string };

	return result.text || '';
}

/**
 * Extract structured tasks from transcript using Claude API
 */
export async function extractTasks(
	apiKey: string,
	transcript: string,
	projectTitle: string
): Promise<AIActions> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 1024,
			system: SYSTEM_PROMPT,
			messages: [{
				role: 'user',
				content: `Project: ${projectTitle}\n\nField memo transcript:\n${transcript}`
			}],
		}),
	});

	if (!response.ok) {
		const err = await response.text();
		console.error('Claude API error:', response.status, err);
		throw new Error(`Claude API error: ${response.status}`);
	}

	const data = await response.json() as {
		content: Array<{ type: string; text?: string }>;
	};

	const textBlock = data.content.find(b => b.type === 'text');
	if (!textBlock?.text) {
		throw new Error('No text response from Claude');
	}

	try {
		return JSON.parse(textBlock.text) as AIActions;
	} catch {
		console.error('Failed to parse Claude response as JSON:', textBlock.text);
		// Return a fallback with the summary as the raw text
		return {
			summary: textBlock.text.slice(0, 200),
			new_actions: [],
			blockers: [],
			status_update: null,
		};
	}
}

/**
 * Full pipeline: transcribe audio, then extract tasks.
 * Updates DB at each stage.
 */
export async function processVoiceNote(
	env: App.Platform['env'],
	db: D1Database,
	noteId: string,
	r2Key: string,
	projectTitle: string
): Promise<void> {
	try {
		// Mark transcription as processing
		await db.prepare("UPDATE voice_notes SET transcript_status = 'processing' WHERE id = ?")
			.bind(noteId).run();

		// Fetch audio from R2
		const object = await env.FILES_BUCKET.get(r2Key);
		if (!object) {
			await db.prepare("UPDATE voice_notes SET transcript_status = 'failed' WHERE id = ?")
				.bind(noteId).run();
			return;
		}

		// Step 1: Whisper transcription
		const audioBytes = await object.arrayBuffer();
		const transcript = await transcribeAudio(env.AI, audioBytes);

		await db.prepare("UPDATE voice_notes SET transcript = ?, transcript_status = 'completed' WHERE id = ?")
			.bind(transcript, noteId).run();

		if (!transcript.trim()) {
			await db.prepare("UPDATE voice_notes SET ai_status = 'completed', ai_actions = ? WHERE id = ?")
				.bind(JSON.stringify({ summary: 'No speech detected', new_actions: [], blockers: [], status_update: null }), noteId).run();
			return;
		}

		// Step 2: Claude task extraction
		const anthropicKey = env.ANTHROPIC_API_KEY;
		if (!anthropicKey) {
			console.error('ANTHROPIC_API_KEY not configured');
			await db.prepare("UPDATE voice_notes SET ai_status = 'failed' WHERE id = ?")
				.bind(noteId).run();
			return;
		}

		await db.prepare("UPDATE voice_notes SET ai_status = 'processing' WHERE id = ?")
			.bind(noteId).run();

		const actions = await extractTasks(anthropicKey, transcript, projectTitle);

		await db.prepare("UPDATE voice_notes SET ai_actions = ?, ai_status = 'completed' WHERE id = ?")
			.bind(JSON.stringify(actions), noteId).run();

	} catch (err) {
		console.error('Voice note processing error:', err);
		await db.prepare("UPDATE voice_notes SET transcript_status = CASE WHEN transcript_status = 'processing' THEN 'failed' ELSE transcript_status END, ai_status = CASE WHEN ai_status = 'processing' THEN 'failed' ELSE ai_status END WHERE id = ?")
			.bind(noteId).run();
	}
}
