import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { eq, and } from 'drizzle-orm';
import { getDb } from '$lib/server/db';
import { getSessionById, getSessionFeatures, saveVotes, saveComment } from '$lib/server/db/queries';
import { votes } from '$lib/server/db/schema';
import { MAX_PICKS } from '$lib/data/default-features';
import { requireParticipant } from '$lib/server/session';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const { participantId, sessionId } = requireParticipant(cookies);

	const db = getDb(platform);
	const session = await getSessionById(db, sessionId);

	if (!session) {
		error(404, 'Session not found');
	}

	const features = await getSessionFeatures(db, session.id);

	return { participantId, session, features };
};

export const actions: Actions = {
	default: async ({ request, platform, cookies }) => {
		const { participantId, sessionId } = requireParticipant(cookies);

		const formData = await request.formData();
		const individualIds = formData
			.getAll('individualIds')
			.map((id) => Number(id))
			.filter((id) => !isNaN(id));
		const communalIds = formData
			.getAll('communalIds')
			.map((id) => Number(id))
			.filter((id) => !isNaN(id));

		if (individualIds.length === 0 || communalIds.length === 0) {
			return fail(400, { error: 'Invalid vote data (missing selections)' });
		}

		if (individualIds.length > MAX_PICKS || communalIds.length > MAX_PICKS) {
			return fail(400, { error: 'Too many picks' });
		}

		const comment = (formData.get('comment') as string)?.trim() || '';

		const db = getDb(platform);

		// 防呆 check: already voted?
		const existingVotes = await db
			.select({ id: votes.id })
			.from(votes)
			.where(and(eq(votes.participantId, participantId), eq(votes.sessionId, sessionId)))
			.limit(1);

		if (existingVotes.length > 0) {
			redirect(303, '/thanks');
		}

		await saveVotes(db, participantId, sessionId, 'individual', individualIds);
		await saveVotes(db, participantId, sessionId, 'communal', communalIds);

		if (comment) {
			await saveComment(db, participantId, sessionId, comment);
		}

		redirect(303, '/thanks');
	}
};
