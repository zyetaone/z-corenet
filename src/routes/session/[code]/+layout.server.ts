import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { getSessionByCode, getSessionFeatures } from '$lib/server/db/queries';

export const load: LayoutServerLoad = async ({ params, platform }) => {
	const db = getDb(platform);
	const session = await getSessionByCode(db, params.code);

	if (!session) {
		error(404, 'Session not found');
	}

	const features = await getSessionFeatures(db, session.id);

	return {
		session,
		features
	};
};
