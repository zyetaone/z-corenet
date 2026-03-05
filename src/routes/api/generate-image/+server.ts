import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { eq, and, sql, count } from 'drizzle-orm';
import { votes, sessionFeatures, workspaceImages, participants } from '$lib/server/db/schema';
import {
	getWorkspaceImageCount,
	getCollectiveImageCount,
	insertWorkspaceImage,
	updateParticipantIdentity
} from '$lib/server/db/queries';
import {
	configureFal,
	buildWorkspacePrompt,
	buildRegenerationPrompt,
	generateWorkspaceImage,
	MAX_GENERATIONS
} from '$lib/server/ai/image-generator';
import { buildTallyResultById } from '$lib/server/tally';

export const POST: RequestHandler = async ({ request, platform, cookies }) => {
	const sessionId = cookies.get('session_id');
	const participantId = cookies.get('participant_id');
	if (!sessionId) error(401, 'No active session');

	const db = getDb(platform);
	const apiKey = platform?.env?.FAL_API_KEY;
	if (!apiKey) error(503, 'Image generation not available');

	configureFal(apiKey);

	const body = await request.json();
	const { type, name, email, additionalPrompt } = body as {
		type: 'individual' | 'collective';
		name?: string;
		email?: string;
		additionalPrompt?: string;
	};

	if (type !== 'individual' && type !== 'collective') {
		error(400, 'Invalid type');
	}

	let features: Array<{ name: string; hasEvidence: boolean }> = [];
	let currentCount = 0;

	if (type === 'individual') {
		if (!participantId) error(401, 'No participant session');

		// Check generation limit
		currentCount = await getWorkspaceImageCount(db, participantId, sessionId);
		if (currentCount >= MAX_GENERATIONS) {
			error(429, 'Generation limit reached');
		}

		// Update participant identity if provided
		if (name?.trim() || email?.trim()) {
			await updateParticipantIdentity(
				db,
				participantId,
				name?.trim() ?? '',
				email?.trim() ?? ''
			);
		}

		// Fetch this participant's voted features
		const rows = await db
			.select({
				name: sessionFeatures.name,
				hasEvidence: sessionFeatures.hasEvidence
			})
			.from(votes)
			.innerJoin(
				sessionFeatures,
				and(
					eq(votes.featureId, sessionFeatures.featureId),
					eq(votes.sessionId, sessionFeatures.sessionId)
				)
			)
			.where(and(eq(votes.participantId, participantId), eq(votes.sessionId, sessionId)));

		features = rows.map((r) => ({ name: r.name, hasEvidence: r.hasEvidence }));
	} else {
		// Collective: use top 8 features from tally
		currentCount = await getCollectiveImageCount(db, sessionId);
		if (currentCount >= MAX_GENERATIONS) {
			error(429, 'Generation limit reached');
		}

		const tally = await buildTallyResultById(db, sessionId);
		if (!tally) error(404, 'No tally data');

		// Merge both phases, deduplicate, take top 8
		const merged = new Map<string, { name: string; hasEvidence: boolean; voteCount: number }>();
		for (const f of [...tally.individual.features, ...tally.communal.features]) {
			const existing = merged.get(f.name);
			if (existing) {
				existing.voteCount += f.voteCount;
			} else {
				merged.set(f.name, { name: f.name, hasEvidence: f.hasEvidence, voteCount: f.voteCount });
			}
		}
		features = [...merged.values()]
			.sort((a, b) => b.voteCount - a.voteCount)
			.slice(0, 8)
			.map((f) => ({ name: f.name, hasEvidence: f.hasEvidence }));
	}

	if (features.length === 0) {
		error(400, 'No features found for image generation');
	}

	// Build prompt (new or regeneration)
	let prompt: string;
	if (currentCount > 0 && additionalPrompt !== undefined) {
		// Regeneration: modify previous prompt
		const basePrompt = buildWorkspacePrompt(features);
		prompt = buildRegenerationPrompt(basePrompt, additionalPrompt);
	} else {
		prompt = buildWorkspacePrompt(features, additionalPrompt);
	}

	// Generate image via fal.ai
	const result = await generateWorkspaceImage(prompt);
	const generationNum = currentCount + 1;

	// Store in DB
	await insertWorkspaceImage(db, {
		sessionId,
		participantId: type === 'individual' ? participantId : undefined,
		participantName: name?.trim(),
		participantEmail: email?.trim(),
		imageData: result.imageData,
		prompt: result.prompt,
		generationNum,
		type,
		featureNames: features.map((f) => f.name)
	});

	return json({
		imageData: result.imageData,
		prompt: result.prompt,
		generationsRemaining: MAX_GENERATIONS - generationNum,
		generationNum
	});
};
