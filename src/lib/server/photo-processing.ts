/** Photo-to-Task AI processing: Vision analysis + Claude task extraction */

const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

const VISION_PROMPT = `You are a construction site photo analyst. Describe what you see in this photo in detail, focusing on:
1. Work progress and current state
2. Any safety concerns or code violations
3. Quality issues (cracks, misalignment, water damage, etc.)
4. Materials and equipment visible
5. Weather or site conditions

Be specific and factual. Describe only what you can see.`;

const SYSTEM_PROMPT = `You are a construction project assistant for CollectRelay. Your job is to analyze a description of a site photo and extract structured, actionable information.

Analyze the description and extract:
1. A brief summary (1-2 sentences) of what the photo shows
2. Any action items or tasks that should be created based on what's visible
3. Any safety or quality issues that need attention
4. A status update on visible work progress

For each task, assign a priority: High, Medium, or Low.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief summary of what the photo shows",
  "new_actions": [
    { "task": "Description of the task", "priority": "High" }
  ],
  "blockers": ["Description of any issue or concern"],
  "status_update": "Any progress observation, or null"
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
 * Analyze an image using Cloudflare Workers AI vision model
 */
export async function analyzeImage(
	ai: Ai,
	imageBytes: ArrayBuffer,
	mimeType: string = 'image/jpeg'
): Promise<string> {
	// Convert to base64 data URI for vision model
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
				{ type: 'text', text: VISION_PROMPT },
				{ type: 'image_url', image_url: { url: dataUri } }
			]
		}]
	}) as { response?: string };

	return result.response || '';
}

/**
 * Extract structured tasks from image description using Claude API
 */
export async function extractTasksFromPhoto(
	apiKey: string,
	description: string,
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
				content: `Project: ${projectTitle}\n\nSite photo description:\n${description}`
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
		return {
			summary: textBlock.text.slice(0, 200),
			new_actions: [],
			blockers: [],
			status_update: null,
		};
	}
}

/**
 * Full pipeline: vision analysis, then task extraction.
 * Updates DB at each stage.
 */
export async function processPhotoNote(
	env: App.Platform['env'],
	db: D1Database,
	noteId: string,
	r2Key: string,
	projectTitle: string
): Promise<void> {
	try {
		// Mark as processing
		await db.prepare("UPDATE photo_notes SET ai_status = 'processing' WHERE id = ?")
			.bind(noteId).run();

		// Fetch image from R2
		const object = await env.FILES_BUCKET.get(r2Key);
		if (!object) {
			await db.prepare("UPDATE photo_notes SET ai_status = 'failed' WHERE id = ?")
				.bind(noteId).run();
			return;
		}

		// Step 1: Vision analysis
		const imageBytes = await object.arrayBuffer();
		const description = await analyzeImage(env.AI, imageBytes);

		if (!description.trim()) {
			await db.prepare("UPDATE photo_notes SET ai_description = ?, ai_status = 'completed', ai_actions = ? WHERE id = ?")
				.bind('Unable to analyze image', JSON.stringify({ summary: 'Unable to analyze image', new_actions: [], blockers: [], status_update: null }), noteId).run();
			return;
		}

		// Save vision description
		await db.prepare("UPDATE photo_notes SET ai_description = ? WHERE id = ?")
			.bind(description, noteId).run();

		// Step 2: Claude task extraction
		const anthropicKey = env.ANTHROPIC_API_KEY;
		if (!anthropicKey) {
			console.error('ANTHROPIC_API_KEY not configured');
			await db.prepare("UPDATE photo_notes SET ai_status = 'failed' WHERE id = ?")
				.bind(noteId).run();
			return;
		}

		const actions = await extractTasksFromPhoto(anthropicKey, description, projectTitle);

		await db.prepare("UPDATE photo_notes SET ai_actions = ?, ai_status = 'completed' WHERE id = ?")
			.bind(JSON.stringify(actions), noteId).run();

	} catch (err) {
		console.error('Photo note processing error:', err);
		await db.prepare("UPDATE photo_notes SET ai_status = CASE WHEN ai_status = 'processing' THEN 'failed' ELSE ai_status END WHERE id = ?")
			.bind(noteId).run();
	}
}
