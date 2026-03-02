import { redirect, error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import {
	getSessionByCode,
	getSessionFeatures,
	saveVotes,
	saveComment
} from '$lib/server/db/queries';

export const load: PageServerLoad = async ({ params, platform, cookies }) => {
	const participantId = cookies.get('participant_id');

	if (!participantId) {
		redirect(303, `/session/${params.code}`);
	}

	const db = getDb(platform);
	const session = await getSessionByCode(db, params.code);

	if (!session) {
		error(404, 'Session not found');
	}

	const features = await getSessionFeatures(db, session.id);

	return { participantId, session, features };
};

export const actions: Actions = {
	default: async ({ request, params, platform, cookies }) => {
		const participantId = cookies.get('participant_id');

		if (!participantId) {
			return { error: 'Not registered' };
		}

		const formData = await request.formData();
		const individualIds: number[] = JSON.parse((formData.get('individualIds') as string) || '[]');
		const communalIds: number[] = JSON.parse((formData.get('communalIds') as string) || '[]');
		const comment = (formData.get('comment') as string)?.trim() || '';

		const db = getDb(platform);
		const session = await getSessionByCode(db, params.code);

		if (!session) {
			return { error: 'Session not found' };
		}

		await saveVotes(db, participantId, session.id, 'individual', individualIds);
		await saveVotes(db, participantId, session.id, 'communal', communalIds);

		if (comment) {
			await saveComment(db, participantId, session.id, comment);
		}

		redirect(303, `/session/${params.code}/dashboard`);
	}
};
