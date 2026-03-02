import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDb } from '$lib/server/db';
import { buildTallyResult } from '$lib/server/tally';

export const load: PageServerLoad = async ({ params, platform }) => {
	const db = getDb(platform);
	const result = await buildTallyResult(db, params.code);

	if (!result) {
		error(404, 'Session not found');
	}

	return result;
};
