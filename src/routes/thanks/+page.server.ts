import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { eq, and } from 'drizzle-orm';
import { votes, sessionFeatures } from '$lib/server/db/schema';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const participantId = cookies.get('participant_id');
	const sessionId = cookies.get('session_id');

	if (!participantId || !sessionId) {
		redirect(303, '/');
	}

	const db = getDb(platform);

	const rows = await db
		.select({
			name: sessionFeatures.name,
			phase: votes.phase
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

	const individual = rows.filter((r) => r.phase === 'individual').map((r) => r.name);
	const communal = rows.filter((r) => r.phase === 'communal').map((r) => r.name);

	return { individual, communal };
};
