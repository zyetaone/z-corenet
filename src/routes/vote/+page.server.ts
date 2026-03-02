import { redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getSessionById, getSessionFeatures, saveVotes, saveComment } from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const participantId = cookies.get('participant_id');
	const sessionId = cookies.get('session_id');

	if (!participantId || !sessionId) {
		redirect(303, '/');
	}

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
		const participantId = cookies.get('participant_id');
		const sessionId = cookies.get('session_id');

		if (!participantId || !sessionId) {
			return { error: 'Not registered' };
		}

		const formData = await request.formData();
		let individualIds: number[] = [];
		let communalIds: number[] = [];
		try {
			individualIds = JSON.parse((formData.get('individualIds') as string) || '[]');
			communalIds = JSON.parse((formData.get('communalIds') as string) || '[]');
		} catch {
			return { error: 'Invalid vote data' };
		}
		if (!Array.isArray(individualIds) || !Array.isArray(communalIds)) {
			return { error: 'Invalid vote data' };
		}
		const comment = (formData.get('comment') as string)?.trim() || '';

		const db = getDb(platform);

		await saveVotes(db, participantId, sessionId, 'individual', individualIds);
		await saveVotes(db, participantId, sessionId, 'communal', communalIds);

		if (comment) {
			await saveComment(db, participantId, sessionId, comment);
		}

		redirect(303, '/dashboard');
	}
};
