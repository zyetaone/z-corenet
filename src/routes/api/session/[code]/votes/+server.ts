import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { buildTallyResult } from '$lib/server/tally';

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = getDb(platform);
	const result = await buildTallyResult(db, params.code);

	if (!result) {
		error(404, 'Session not found');
	}

	return json(result);
};
