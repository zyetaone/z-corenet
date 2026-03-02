import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { getSessionByCode, getParticipantCount } from '$lib/server/db/queries';

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = getDb(platform);
	const session = await getSessionByCode(db, params.code);

	if (!session) {
		error(404, 'Session not found');
	}

	const participantCount = await getParticipantCount(db, session.id);

	return json({ session, participantCount });
};
