/** Site Safety Audit: Vision analysis + Claude compliance extraction */

const VISION_MODEL = '@cf/meta/llama-3.2-11b-vision-instruct';

const AUDIT_VISION_PROMPT = `You are a construction site safety and compliance inspector. Analyze this photo for safety hazards and code violations. Focus on:

1. PPE compliance — hard hats, safety vests, eye protection, gloves, steel-toe boots
2. Fall protection — guardrails, safety nets, harness systems, open edges, roof work
3. Scaffolding — proper assembly, planking, access, base plates, bracing
4. Electrical hazards — exposed wiring, temporary power, lockout/tagout, GFCIs
5. Housekeeping — debris, trip hazards, material storage, walkway clearance
6. Fire safety — extinguisher access, hot work, flammable storage, egress
7. Trenching/excavation — shoring, sloping, access/egress, soil conditions
8. Ladder safety — setup angle, securing, condition, three-point contact
9. Signage — warning signs, barricades, danger tape, restricted areas
10. General conditions — weather hazards, structural integrity, equipment condition

Be specific about what you observe. Note both violations AND areas of compliance. Describe locations within the photo (left, right, foreground, background).`;

const AUDIT_SYSTEM_PROMPT = `You are a certified construction safety inspector for CollectRelay. Analyze the site photo description and produce a structured safety audit.

For each finding, assign:
- severity: "critical" (immediate danger, work stoppage required), "warning" (needs correction soon), or "info" (observation, best practice recommendation)
- category: "safety" (worker safety hazard), "compliance" (code/regulation violation), or "quality" (workmanship/quality issue)
- code: short identifier like "PPE-001", "FALL-002", "ELEC-001", "HOUSEKEEP-003"
- description: what was observed
- recommendation: specific corrective action
- osha_reference: relevant OSHA standard if applicable (e.g., "29 CFR 1926.501"), or null

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Overall audit summary (2-3 sentences)",
  "overall_severity": "critical" or "warning" or "pass",
  "findings": [
    {
      "severity": "critical",
      "category": "safety",
      "code": "FALL-001",
      "description": "Worker observed on elevated platform without fall protection",
      "recommendation": "Install guardrail system or require personal fall arrest system for work above 6 feet",
      "osha_reference": "29 CFR 1926.501(b)(1)"
    }
  ]
}

If no issues are found, set overall_severity to "pass" and findings to an empty array with a summary noting the site appears compliant.
Do NOT include any text outside the JSON object.`;

export interface AuditFinding {
	severity: 'critical' | 'warning' | 'info';
	category: 'safety' | 'compliance' | 'quality';
	code: string;
	description: string;
	recommendation: string;
	osha_reference: string | null;
}

export interface AuditFindings {
	summary: string;
	overall_severity: 'critical' | 'warning' | 'pass';
	findings: AuditFinding[];
}

/**
 * Analyze an image for safety/compliance using Workers AI vision model
 */
export async function analyzeImageForAudit(
	ai: Ai,
	imageBytes: ArrayBuffer
): Promise<string> {
	const result = await ai.run(VISION_MODEL, {
		messages: [{ role: 'user', content: AUDIT_VISION_PROMPT }],
		image: [...new Uint8Array(imageBytes)]
	}) as { response?: string };

	return result.response || '';
}

/**
 * Extract structured audit findings from image description using Claude API
 */
export async function extractAuditFindings(
	apiKey: string,
	description: string,
	projectTitle: string
): Promise<AuditFindings> {
	const response = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': apiKey,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			model: 'claude-sonnet-4-20250514',
			max_tokens: 2048,
			system: AUDIT_SYSTEM_PROMPT,
			messages: [{
				role: 'user',
				content: `Project: ${projectTitle}\n\nSite photo safety inspection description:\n${description}`
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
		return JSON.parse(textBlock.text) as AuditFindings;
	} catch {
		console.error('Failed to parse Claude audit response as JSON:', textBlock.text);
		return {
			summary: textBlock.text.slice(0, 300),
			overall_severity: 'warning',
			findings: [],
		};
	}
}

/**
 * Full audit pipeline: vision analysis → compliance extraction → DB update.
 */
export async function processAudit(
	env: App.Platform['env'],
	db: D1Database,
	auditId: string,
	photoNoteId: string,
	r2Key: string,
	projectTitle: string,
	workspaceId: string
): Promise<void> {
	try {
		// Mark as processing
		await db.prepare("UPDATE site_audits SET ai_status = 'processing' WHERE id = ?")
			.bind(auditId).run();

		// Fetch image from R2
		const object = await env.FILES_BUCKET.get(r2Key);
		if (!object) {
			await db.prepare("UPDATE site_audits SET ai_status = 'failed', summary = 'Image not found in storage' WHERE id = ?")
				.bind(auditId).run();
			return;
		}

		// Step 1: Vision analysis with audit-focused prompt
		const imageBytes = await object.arrayBuffer();
		const description = await analyzeImageForAudit(env.AI, imageBytes);

		if (!description.trim()) {
			await db.prepare("UPDATE site_audits SET ai_status = 'completed', summary = 'Unable to analyze image', overall_severity = 'pass', findings = '[]', finding_count = 0, critical_count = 0, warning_count = 0 WHERE id = ?")
				.bind(auditId).run();
			return;
		}

		// Step 2: Claude structured extraction
		const anthropicKey = env.ANTHROPIC_API_KEY;
		if (!anthropicKey) {
			console.error('ANTHROPIC_API_KEY not configured');
			await db.prepare("UPDATE site_audits SET ai_status = 'failed', summary = 'API key not configured' WHERE id = ?")
				.bind(auditId).run();
			return;
		}

		const audit = await extractAuditFindings(anthropicKey, description, projectTitle);

		const findingCount = audit.findings.length;
		const criticalCount = audit.findings.filter(f => f.severity === 'critical').length;
		const warningCount = audit.findings.filter(f => f.severity === 'warning').length;

		await db.prepare(
			"UPDATE site_audits SET findings = ?, summary = ?, overall_severity = ?, finding_count = ?, critical_count = ?, warning_count = ?, ai_status = 'completed' WHERE id = ?"
		).bind(
			JSON.stringify(audit.findings),
			audit.summary,
			audit.overall_severity,
			findingCount,
			criticalCount,
			warningCount,
			auditId
		).run();

	} catch (err) {
		console.error('Audit processing error:', err);
		await db.prepare("UPDATE site_audits SET ai_status = CASE WHEN ai_status = 'processing' THEN 'failed' ELSE ai_status END WHERE id = ?")
			.bind(auditId).run();
	}
}
