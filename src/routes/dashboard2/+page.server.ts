import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getLatestOpenSession } from '$lib/server/db/queries';
import { buildTallyResultById } from '$lib/server/tally';

export const load: PageServerLoad = async ({ platform, cookies }) => {
	const db = getDb(platform);

	const sessionId = cookies.get('session_id');
	let result;

	if (sessionId) {
		result = await buildTallyResultById(db, sessionId);
	}

	if (!result) {
		const session = await getLatestOpenSession(db);
		if (session) {
			result = await buildTallyResultById(db, session.id);
		}
	}

	if (!result) {
		error(404, 'No active session found');
	}

	return result;
};
