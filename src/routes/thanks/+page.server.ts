import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { votes, sessionFeatures } from '$lib/server/db/schema';
import { requireParticipant } from '$lib/server/session';
import { getSessionById, getLatestParticipantImage, getWorkspaceImageCount } from '$lib/server/db/queries';
import { MAX_GENERATIONS } from '$lib/server/ai/image-generator';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const { participantId, sessionId } = requireParticipant(cookies);

	const db = getDb(platform);

	// Verify session is still open (redirects after reset)
	const session = await getSessionById(db, sessionId);
	if (!session || session.status !== 'open') {
		redirect(303, '/');
	}

	const rows = await db
		.select({
			name: sessionFeatures.name,
			phase: votes.phase,
			hasEvidence: sessionFeatures.hasEvidence,
			caption: sessionFeatures.caption
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

	type PickedFeature = { name: string; hasEvidence: boolean; caption: string | null };

	// If no votes found for this participant+session combo, redirect to join fresh
	if (rows.length === 0) {
		redirect(303, '/');
	}

	const individual: PickedFeature[] = rows
		.filter((r) => r.phase === 'individual')
		.map((r) => ({ name: r.name, hasEvidence: r.hasEvidence, caption: r.caption }));
	const communal: PickedFeature[] = rows
		.filter((r) => r.phase === 'communal')
		.map((r) => ({ name: r.name, hasEvidence: r.hasEvidence, caption: r.caption }));

	const existingImage = await getLatestParticipantImage(db, participantId, sessionId);
	const imageCount = existingImage
		? await getWorkspaceImageCount(db, participantId, sessionId)
		: 0;

	return {
		individual,
		communal,
		existingImage: existingImage
			? {
					imageData: existingImage.imageData,
					prompt: existingImage.prompt,
					generationsRemaining: MAX_GENERATIONS - imageCount
				}
			: null,
		hasFalKey: !!platform?.env?.FAL_API_KEY
	};
};
