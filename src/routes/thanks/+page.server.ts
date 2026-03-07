import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { requireParticipant } from '$lib/server/session';
import {
	getSessionById,
	getLatestParticipantImage,
	getWorkspaceImageCount,
	getParticipantVotedFeatures
} from '$lib/server/db/queries';
import { MAX_GENERATIONS } from '$lib/server/ai/image-generator';
import { isR2Key } from '$lib/server/r2';
import type { PickedFeature } from '$lib/types/voting';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const { participantId, sessionId } = requireParticipant(cookies);

	const db = getDb(platform);

	const session = await getSessionById(db, sessionId);
	if (!session) {
		redirect(303, '/vote');
	}

	const rows = await getParticipantVotedFeatures(db, participantId, sessionId);

	// If no votes found for this participant+session combo, send to quiz
	if (rows.length === 0) {
		redirect(303, '/vote');
	}

	const individual: PickedFeature[] = rows
		.filter((r) => r.phase === 'individual')
		.map((r) => ({ name: r.name, hasEvidence: r.hasEvidence, caption: r.caption }));
	const communal: PickedFeature[] = rows
		.filter((r) => r.phase === 'communal')
		.map((r) => ({ name: r.name, hasEvidence: r.hasEvidence, caption: r.caption }));

	const existingImage = await getLatestParticipantImage(db, participantId, sessionId);
	const imageCount = existingImage ? await getWorkspaceImageCount(db, participantId, sessionId) : 0;

	// Resolve R2 keys to proxy URLs for the client
	let imageData = existingImage?.imageData;
	if (imageData && isR2Key(imageData)) {
		imageData = `/api/images/${imageData}`;
	}

	return {
		individual,
		communal,
		existingImage: existingImage
			? {
					imageData: imageData!,
					prompt: existingImage.prompt,
					generationsRemaining: MAX_GENERATIONS - imageCount
				}
			: null,
		hasFalKey: !!platform?.env?.FAL_API_KEY
	};
};
