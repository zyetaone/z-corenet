import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { eq, and, sql } from 'drizzle-orm';
import { votes, sessionFeatures, workspaceImages } from '$lib/server/db/schema';
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
	editWorkspaceImage,
	MAX_GENERATIONS,
	MAX_COLLECTIVE_GENERATIONS
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
	const { type, name, email, additionalPrompt, trackingId, previousImageData } = body as {
		type: 'individual' | 'collective';
		name?: string;
		email?: string;
		additionalPrompt?: string;
		trackingId?: string;
		previousImageData?: string;
	};

	if (type !== 'individual' && type !== 'collective') {
		error(400, 'Invalid type');
	}

	// Validate trackingId is a UUID if provided
	if (trackingId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trackingId)) {
		error(400, 'Invalid tracking ID');
	}

	// Cap additional prompt length
	if (additionalPrompt && additionalPrompt.length > 500) {
		error(400, 'Additional prompt too long (max 500 characters)');
	}

	// Validate previousImageData size and format
	if (previousImageData) {
		if (previousImageData.length > 8 * 1024 * 1024) {
			error(400, 'Image data too large (max 8MB)');
		}
		if (!/^data:image\/(webp|jpeg|png);base64,/.test(previousImageData)) {
			error(400, 'Invalid image format (must be webp, jpeg, or png)');
		}
	}

	let features: Array<{ name: string; hasEvidence: boolean }> = [];
	let currentCount = 0;

	if (type === 'individual') {
		if (!participantId) error(401, 'No participant session');

		const targetEmail = email?.trim();
		const targetName = name?.trim();

		// Update participant identity if provided
		if (targetName || targetEmail) {
			await updateParticipantIdentity(db, participantId, targetName ?? '', targetEmail ?? '');
		}

		// If they just submitted the form initially (no additionalPrompt) and already have an image connected to this email, skip generation
		if (targetEmail && !additionalPrompt) {
			const existing = await db
				.select()
				.from(workspaceImages)
				.where(
					and(
						eq(workspaceImages.sessionId, sessionId),
						eq(workspaceImages.type, 'individual'),
						eq(workspaceImages.participantEmail, targetEmail)
					)
				)
				.orderBy(sql`${workspaceImages.createdAt} DESC`)
				.limit(1);

			if (existing.length > 0) {
				const img = existing[0];
				return json({
					imageData: img.imageData,
					prompt: img.prompt,
					generationsRemaining: Math.max(0, MAX_GENERATIONS - img.generationNum),
					generationNum: img.generationNum
				});
			}
		}

		// Check generation limit
		currentCount = await getWorkspaceImageCount(db, participantId, sessionId);
		if (currentCount >= MAX_GENERATIONS) {
			error(429, 'Generation limit reached');
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
		if (currentCount >= MAX_COLLECTIVE_GENERATIONS) {
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
		const basePrompt = buildWorkspacePrompt(features);
		prompt = buildRegenerationPrompt(basePrompt, additionalPrompt);
	} else {
		prompt = buildWorkspacePrompt(features, additionalPrompt);
	}

	// Use edit mode when we have a previous image and user provided modifications
	let result: { imageData: string; prompt: string };
	if (previousImageData && additionalPrompt?.trim()) {
		result = await editWorkspaceImage(previousImageData, additionalPrompt.trim(), trackingId);
		// Store the full composite prompt for DB/display, not the short edit instruction
		result = { ...result, prompt };
	} else {
		result = await generateWorkspaceImage(prompt, trackingId);
	}
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

	const maxGens = type === 'collective' ? MAX_COLLECTIVE_GENERATIONS : MAX_GENERATIONS;
	return json({
		imageData: result.imageData,
		prompt: result.prompt,
		generationsRemaining: maxGens - generationNum,
		generationNum
	});
};
